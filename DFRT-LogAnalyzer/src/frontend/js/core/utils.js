/**
 * DFRT Log Analyzer - Utility Functions
 * Common helper functions for the application
 */

const Utils = {
    /**
     * Debounce function - delays execution until after specified wait time
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Throttle function - limits execution frequency
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Format date
     */
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        if (!date) return '';
        
        const d = new Date(date);
        const pad = (n) => (n < 10 ? '0' + n : n);
        
        return format
            .replace('YYYY', d.getFullYear())
            .replace('MM', pad(d.getMonth() + 1))
            .replace('DD', pad(d.getDate()))
            .replace('HH', pad(d.getHours()))
            .replace('mm', pad(d.getMinutes()))
            .replace('ss', pad(d.getSeconds()));
    },
    
    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const seconds = Math.floor((now - target) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
        if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
        return `${Math.floor(seconds / 31536000)} years ago`;
    },
    
    /**
     * Format bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    },
    
    /**
     * Parse bytes
     */
    parseBytes(str) {
        const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
        const match = str.match(/^([\d.]+)\s*([A-Z]+)$/i);
        if (!match) return 0;
        return Math.floor(parseFloat(match[1]) * (units[match[2].toUpperCase()] || 1));
    },
    
    /**
     * Get severity color
     */
    getSeverityColor(severity) {
        const colors = {
            'CRITICAL': 'var(--color-critical)',
            'HIGH': 'var(--color-high)',
            'MEDIUM': 'var(--color-medium)',
            'LOW': 'var(--color-low)',
            'INFO': 'var(--color-info-level)',
            'WARNING': 'var(--color-warning)',
            'ERROR': 'var(--color-danger)',
            'SUCCESS': 'var(--color-success)'
        };
        return colors[severity?.toUpperCase()] || 'var(--text-secondary)';
    },
    
    /**
     * Get severity badge
     */
    getSeverityBadge(severity) {
        const badgeClasses = {
            'CRITICAL': 'badge-danger',
            'HIGH': 'badge-warning',
            'MEDIUM': 'badge-warning',
            'LOW': 'badge-info',
            'INFO': 'badge-info',
            'WARNING': 'badge-warning',
            'ERROR': 'badge-danger',
            'SUCCESS': 'badge-success'
        };
        return badgeClasses[severity?.toUpperCase()] || 'badge-primary';
    },
    
    /**
     * Clone deep
     */
    cloneDeep(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.cloneDeep(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.cloneDeep(obj[key]);
                }
            }
            return cloned;
        }
    },
    
    /**
     * Merge objects
     */
    merge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        
        if (typeof source === 'object' && source !== null) {
            for (const key in source) {
                if (typeof source[key] === 'object' && source[key] !== null) {
                    if (!target[key]) {
                        target[key] = typeof source[key] === 'array' ? [] : {};
                    }
                    this.merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        
        return this.merge(target, ...sources);
    },
    
    /**
     * Generate UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    /**
     * CSV to Array
     */
    csvToArray(str) {
        const arr = [];
        let quote = false;
        
        for (let row = 0, col = 0, c = 0; c < str.length; c++) {
            const cc = str[c], nc = str[c + 1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';
            
            if (cc === '"' && quote && nc === '"') {
                arr[row][col] += cc;
                ++c;
            } else if (cc === '"') {
                quote = !quote;
            } else if (cc === ',' && !quote) {
                ++col;
            } else if ((cc === '\n' || cc === '\r') && !quote) {
                if (cc === '\r' && nc === '\n') ++c;
                ++row;
                col = 0;
            } else {
                arr[row][col] += cc;
            }
        }
        
        return arr;
    },
    
    /**
     * Array to CSV
     */
    arrayToCsv(data) {
        return data.map(row =>
            row.map(cell =>
                typeof cell === 'string' && cell.includes(',')
                    ? `"${cell.replace(/"/g, '""')}"` 
                    : cell
            ).join(',')
        ).join('\n');
    },
    
    /**
     * JSON to CSV
     */
    jsonToCsv(data) {
        if (!data || !data.length) return '';
        
        const headers = Object.keys(data[0]);
        const rows = [headers.join(',')];
        
        for (const obj of data) {
            rows.push(headers.map(h => {
                const cell = obj[h];
                if (cell === null || cell === undefined) return '';
                if (typeof cell === 'string' && cell.includes(',')) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(','));
        }
        
        return rows.join('\n');
    },
    
    /**
     * Download file
     */
    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    },
    
    /**
     * Copy to clipboard
     */
    copyToClipboard(text) {
        return navigator.clipboard.writeText(text).then(() => {
            UINotifications.showSuccess('Copied', 'Text copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy:', err);
            UINotifications.showError('Copy Failed', 'Unable to copy to clipboard');
        });
    },
    
    /**
     * Validate email
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    /**
     * Validate IP
     */
    isValidIP(ip) {
        const regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!regex.test(ip)) return false;
        return ip.split('.').every(num => parseInt(num) <= 255);
    },
    
    /**
     * Get URL parameter
     */
    getUrlParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },
    
    /**
     * Set URL parameter
     */
    setUrlParam(name, value) {
        const params = new URLSearchParams(window.location.search);
        params.set(name, value);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    },
    
    /**
     * Wait for condition
     */
    async waitFor(condition, timeout = 5000) {
        const start = Date.now();
        while (!condition()) {
            if (Date.now() - start > timeout) {
                throw new Error('Timeout waiting for condition');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    },
    
    /**
     * Retry function
     */
    async retry(func, maxAttempts = 3, delay = 1000) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                return await func();
            } catch (error) {
                if (i === maxAttempts - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
};
