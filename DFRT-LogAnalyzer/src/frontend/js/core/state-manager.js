/**
 * DFRT Log Analyzer - State Manager
 * Centralized state management with reactive updates
 */

class StateManager {
    constructor() {
        this.state = {};
        this.observers = [];
        this.history = [];
        this.maxHistory = 50;
    }
    
    /**
     * Initialize state
     */
    init(initialState = {}) {
        this.state = { ...initialState };
        this.history = [{ ...this.state, timestamp: Date.now() }];
    }
    
    /**
     * Get state value
     */
    get(path) {
        if (!path) return this.state;
        
        return path.split('.').reduce((obj, key) => {
            return obj ? obj[key] : undefined;
        }, this.state);
    }
    
    /**
     * Set state value
     */
    set(path, value) {
        const oldValue = this.get(path);
        
        if (oldValue === value) {
            return; // No change
        }
        
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        let obj = this.state;
        for (const key of keys) {
            if (!obj[key]) obj[key] = {};
            obj = obj[key];
        }
        
        obj[lastKey] = value;
        
        // Add to history
        this.addHistory();
        
        // Notify observers
        this.notify({
            type: 'SET',
            path,
            oldValue,
            newValue: value
        });
    }
    
    /**
     * Update nested object
     */
    update(path, updates) {
        const current = this.get(path) || {};
        const updated = { ...current, ...updates };
        this.set(path, updated);
    }
    
    /**
     * Clear state value
     */
    clear(path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        let obj = this.state;
        for (const key of keys) {
            obj = obj[key];
        }
        
        delete obj[lastKey];
        
        this.addHistory();
        this.notify({
            type: 'CLEAR',
            path
        });
    }
    
    /**
     * Reset state
     */
    reset() {
        this.state = {};
        this.addHistory();
        this.notify({
            type: 'RESET'
        });
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(callback, pathFilter = null) {
        const observer = { callback, pathFilter, id: Date.now() + Math.random() };
        this.observers.push(observer);
        return observer.id; // Return unsubscribe ID
    }
    
    /**
     * Unsubscribe from state changes
     */
    unsubscribe(id) {
        this.observers = this.observers.filter(obs => obs.id !== id);
    }
    
    /**
     * Notify all observers
     */
    notify(change) {
        this.observers.forEach(observer => {
            if (!observer.pathFilter || change.path.startsWith(observer.pathFilter)) {
                observer.callback(change, this.state);
            }
        });
    }
    
    /**
     * Add to history
     */
    addHistory() {
        this.history.push({
            ...JSON.parse(JSON.stringify(this.state)),
            timestamp: Date.now()
        });
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    /**
     * Undo last change
     */
    undo() {
        if (this.history.length > 1) {
            this.history.pop();
            this.state = JSON.parse(JSON.stringify(this.history[this.history.length - 1]));
            this.notify({ type: 'UNDO' });
        }
    }
    
    /**
     * Get all state
     */
    getAll() {
        return { ...this.state };
    }
    
    /**
     * Persist to localStorage
     */
    persist(key = 'appState') {
        try {
            localStorage.setItem(key, JSON.stringify(this.state));
        } catch (error) {
            console.error('[StateManager] Failed to persist state:', error);
        }
    }
    
    /**
     * Load from localStorage
     */
    restore(key = 'appState') {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                this.state = JSON.parse(saved);
                this.addHistory();
                this.notify({ type: 'RESTORE' });
                return true;
            }
        } catch (error) {
            console.error('[StateManager] Failed to restore state:', error);
        }
        return false;
    }
}

/**
 * Analysis State Manager
 * Specialized state manager for analysis data
 */
class AnalysisStateManager extends StateManager {
    constructor() {
        super();
        this.init({
            analyses: [],
            currentAnalysis: null,
            results: {
                entries: [],
                threats: [],
                userProfiles: [],
                timeline: [],
                summary: {}
            },
            filters: {
                severity: 'all',
                user: '',
                ip: '',
                eventType: '',
                keyword: ''
            },
            pagination: {
                page: 1,
                limit: 50,
                total: 0
            },
            loading: false,
            error: null
        });
    }
    
    /**
     * Start loading
     */
    startLoading(message = 'Loading...') {
        this.set('loading', true);
        this.set('error', null);
    }
    
    /**
     * Stop loading
     */
    stopLoading() {
        this.set('loading', false);
    }
    
    /**
     * Set error
     */
    setError(error) {
        this.set('error', error);
        this.stopLoading();
    }
    
    /**
     * Add analysis
     */
    addAnalysis(analysis) {
        const analyses = this.get('analyses');
        analyses.push(analysis);
        this.set('analyses', analyses);
    }
    
    /**
     * Update analysis
     */
    updateAnalysis(id, updates) {
        const analyses = this.get('analyses');
        const index = analyses.findIndex(a => a.id === id);
        if (index !== -1) {
            analyses[index] = { ...analyses[index], ...updates };
            this.set('analyses', analyses);
        }
    }
    
    /**
     * Set results
     */
    setResults(results) {
        this.set('results', results);
    }
    
    /**
     * Update filters
     */
    updateFilters(newFilters) {
        const filters = this.get('filters');
        this.set('filters', { ...filters, ...newFilters });
        this.set('pagination.page', 1); // Reset to first page
    }
    
    /**
     * Reset filters
     */
    resetFilters() {
        this.set('filters', {
            severity: 'all',
            user: '',
            ip: '',
            eventType: '',
            keyword: ''
        });
    }
    
    /**
     * Set pagination
     */
    setPagination(page, limit, total) {
        this.update('pagination', { page, limit, total });
    }
    
    /**
     * Get filtered results
     */
    getFilteredResults() {
        const results = this.get('results') || {};
        const filters = this.get('filters');
        const entries = results.entries || [];
        
        return entries.filter(entry => {
            if (filters.severity !== 'all' && entry.severity !== filters.severity) {
                return false;
            }
            if (filters.user && !entry.user?.includes(filters.user)) {
                return false;
            }
            if (filters.ip && !entry.ip?.includes(filters.ip)) {
                return false;
            }
            if (filters.eventType && entry.eventType !== filters.eventType) {
                return false;
            }
            if (filters.keyword && !JSON.stringify(entry).toLowerCase().includes(filters.keyword.toLowerCase())) {
                return false;
            }
            return true;
        });
    }
}

// Create global instances
const AppState = new StateManager();
const AnalysisState = new AnalysisStateManager();
