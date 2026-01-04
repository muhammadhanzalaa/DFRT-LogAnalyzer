/**
 * DFRT Log Analyzer - Frontend Configuration (Enhanced)
 * @file config.js
 * @version 2.5.0
 * Phase 2-7 Enhancements: Proper defaults, validation, feature flags
 */

const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.origin + '/api',
    SOCKET_URL: window.location.origin,
    
    // UI Configuration with proper defaults
    UI: {
        TOAST_DURATION: 5000,
        MODAL_ANIMATION_DURATION: 300,
        PAGE_TRANSITION_DURATION: 300,
        TABLE_PAGE_SIZE: 50,
        MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
        MAX_FILES: 10,
        ANIMATION_ENABLED: true,
        DARK_MODE_ENABLED: localStorage.getItem('darkMode') === 'true'
    },
    
    // Analysis Options with proper flags
    ANALYSIS_OPTIONS: {
        enableBasicParsing: true,
        enableEventExtraction: true,
        enableLoginAnalysis: true,
        enableFailedLoginDetection: true,
        enableBruteForceDetection: true,
        enableLogTamperingDetection: true,
        enableCrossCorrelation: true,
        enableUserProfiling: true,
        enableTimelineReconstruction: true,
        bruteForceThreshold: 5,
        bruteForceWindowSeconds: 300
    },
    
    // Severity Levels (standardized)
    SEVERITY_LEVELS: {
        CRITICAL: 'CRITICAL',
        WARNING: 'WARNING',
        ERROR: 'ERROR',
        INFO: 'INFO',
        NORMAL: 'NORMAL',
        DEBUG: 'DEBUG'
    },
    
    // Log Types
    LOG_TYPES: {
        WINDOWS_EVENT: 'windows_event',
        SYSLOG: 'syslog',
        APACHE_ACCESS: 'apache_access',
        APACHE_ERROR: 'apache_error',
        NGINX: 'nginx',
        GENERIC: 'generic'
    },
    
    // Date/Time Formats
    DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss',
    TIME_FORMAT: 'HH:mm:ss',
    TIMESTAMP_FORMAT: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    
    // Settings/Preferences
    SETTINGS: {
        autoRefresh: localStorage.getItem('autoRefresh') !== 'false',
        refreshInterval: parseInt(localStorage.getItem('refreshInterval') || '30000', 10),
        pageSize: parseInt(localStorage.getItem('pageSize') || '50', 10),
        notifications: localStorage.getItem('notifications') !== 'false',
        soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
        sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true'
    },
    
    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 50,
        PAGE_SIZE_OPTIONS: [25, 50, 100, 250],
        MAX_PAGE_SIZE: 250
    },
    
    // Timing constants
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 500,
    
    // Features (for feature flags)
    FEATURES: {
        REAL_TIME_UPDATES: true,
        ADVANCED_FILTERING: true,
        EXPORT_FUNCTIONALITY: true,
        TIMELINE_VISUALIZATION: true,
        THREAT_DETECTION: true,
        USER_PROFILING: true,
        BRUTE_FORCE_DETECTION: true,
        LOG_TAMPERING_DETECTION: true
    },
    
    // Feature descriptions
    FEATURE_DESCRIPTIONS: [
        'Multi-format log parsing (Windows Events, syslog, Apache, Nginx, etc.)',
        'Brute-force attack detection and analysis',
        'Log tampering detection and forensic indicators',
        'User behavior profiling and anomaly detection',
        'Attack timeline reconstruction and visualization',
        'Cross-log correlation and pattern detection'
    ]
};

// Validate configuration at runtime
(function validateConfig() {
    'use strict';
    
    try {
        // Validate API URL
        if (!CONFIG.API_BASE_URL || typeof CONFIG.API_BASE_URL !== 'string') {
            console.warn('[CONFIG] Invalid API_BASE_URL, using default');
            CONFIG.API_BASE_URL = '/api';
        }
        
        // Validate UI settings
        if (!Number.isFinite(CONFIG.UI.MAX_FILE_SIZE) || CONFIG.UI.MAX_FILE_SIZE <= 0) {
            CONFIG.UI.MAX_FILE_SIZE = 100 * 1024 * 1024;
        }
        
        if (!Number.isFinite(CONFIG.UI.MAX_FILES) || CONFIG.UI.MAX_FILES <= 0) {
            CONFIG.UI.MAX_FILES = 10;
        }
        
        // Validate settings
        if (!Number.isFinite(CONFIG.SETTINGS.refreshInterval) || CONFIG.SETTINGS.refreshInterval < 1000) {
            CONFIG.SETTINGS.refreshInterval = 30000;
        }
        
        if (!Number.isFinite(CONFIG.SETTINGS.pageSize) || CONFIG.SETTINGS.pageSize < 10) {
            CONFIG.SETTINGS.pageSize = 50;
        }
        
        // Validate analysis options
        if (!Number.isFinite(CONFIG.ANALYSIS_OPTIONS.bruteForceThreshold) || 
            CONFIG.ANALYSIS_OPTIONS.bruteForceThreshold < 1) {
            CONFIG.ANALYSIS_OPTIONS.bruteForceThreshold = 5;
        }
        
        console.log('[CONFIG] Configuration validated and initialized');
    } catch (error) {
        console.error('[CONFIG] Validation error:', error);
    }
})();
