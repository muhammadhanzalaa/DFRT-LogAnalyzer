/**
 * DFRT Log Analyzer - Dashboard Page
 * Main dashboard with overview and quick actions
 */

const Dashboard = {
    init() {
        console.log('Initializing Dashboard');
        this.loadAnalyses();
        this.setupEventListeners();
        this.applyTheme();
    },
    
    setupEventListeners() {
        // Sidebar toggle
        const menuToggle = document.querySelector('[data-toggle="sidebar"]');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Theme toggle
        const themeToggle = document.querySelector('[data-toggle="theme"]');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },
    
    loadAnalyses() {
        // Load analyses from localStorage or API
        const cached = localStorage.getItem('analyses');
        if (cached) {
            try {
                const analyses = JSON.parse(cached);
                this.updateAnalysesCount(analyses.length);
            } catch (error) {
                console.error('Failed to load cached analyses:', error);
            }
        }
    },
    
    updateAnalysesCount(count) {
        const element = document.querySelector('[data-stat="total-analyses"]');
        if (element) {
            element.textContent = count;
        }
    },
    
    toggleSidebar() {
        const container = document.querySelector('.app-container');
        if (container) {
            container.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', 
                container.classList.contains('sidebar-collapsed'));
        }
    },
    
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    },
    
    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
};
