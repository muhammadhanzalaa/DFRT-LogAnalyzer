/**
 * DFRT Log Analyzer - API Client
 * Centralized API communication with error handling and request management
 */

class APIClient {
    constructor(baseURL = CONFIG.API_BASE_URL) {
        this.baseURL = baseURL;
        this.timeout = 30000;
        this.requestQueue = [];
        this.isOnline = navigator.onLine;
        
        // Monitor online/offline status
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }
    
    /**
     * Handle online status change
     */
    handleOnline() {
        this.isOnline = true;
        console.log('[API] Connection restored');
        // Retry queued requests
        this.processQueue();
    }
    
    /**
     * Handle offline status change
     */
    handleOffline() {
        this.isOnline = false;
        console.warn('[API] Connection lost');
        UINotifications.showWarning('Connection Lost', 'You are offline. Requests will be retried when connection is restored.');
    }
    
    /**
     * Process queued requests
     */
    processQueue() {
        while (this.requestQueue.length > 0 && this.isOnline) {
            const request = this.requestQueue.shift();
            this.executeRequest(request.config, request.resolve, request.reject);
        }
    }
    
    /**
     * Create a timeout promise
     */
    createTimeoutPromise() {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new APIError('Request timeout', 'TIMEOUT', 0));
            }, this.timeout);
        });
    }
    
    /**
     * Execute HTTP request
     */
    async executeRequest(config, resolve, reject) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const options = {
                method: config.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...config.headers
                },
                signal: controller.signal
            };
            
            // Add auth token if available
            const token = this.getAuthToken();
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Add body if present
            if (config.data) {
                options.body = JSON.stringify(config.data);
            }
            
            const url = this.buildURL(config.url);
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            
            // Handle response
            const result = await this.handleResponse(response);
            resolve(result);
            
        } catch (error) {
            console.error('[API Error]', error);
            reject(this.normalizeError(error));
        }
    }
    
    /**
     * Build full URL
     */
    buildURL(endpoint) {
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        return `${this.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    }
    
    /**
     * Handle API response
     */
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let data;
        
        try {
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
        } catch (error) {
            data = {};
        }
        
        // Check if response is successful
        if (!response.ok) {
            throw new APIError(
                data.message || data.error || `HTTP ${response.status}`,
                data.code || `HTTP_${response.status}`,
                response.status,
                data
            );
        }
        
        return {
            success: true,
            status: response.status,
            data: data.data || data,
            message: data.message
        };
    }
    
    /**
     * Normalize error
     */
    normalizeError(error) {
        if (error instanceof APIError) {
            return error;
        }
        
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            if (!this.isOnline) {
                return new APIError('No internet connection', 'OFFLINE', 0);
            }
            return new APIError('Network error', 'NETWORK_ERROR', 0);
        }
        
        if (error.name === 'AbortError') {
            return new APIError('Request timeout', 'TIMEOUT', 0);
        }
        
        return new APIError(error.message || 'Unknown error', 'UNKNOWN', 0);
    }
    
    /**
     * Get auth token
     */
    getAuthToken() {
        return localStorage.getItem('authToken');
    }
    
    /**
     * Make GET request
     */
    async get(url, options = {}) {
        return this.request({ ...options, method: 'GET', url });
    }
    
    /**
     * Make POST request
     */
    async post(url, data, options = {}) {
        return this.request({ ...options, method: 'POST', url, data });
    }
    
    /**
     * Make PUT request
     */
    async put(url, data, options = {}) {
        return this.request({ ...options, method: 'PUT', url, data });
    }
    
    /**
     * Make DELETE request
     */
    async delete(url, options = {}) {
        return this.request({ ...options, method: 'DELETE', url });
    }
    
    /**
     * Make PATCH request
     */
    async patch(url, data, options = {}) {
        return this.request({ ...options, method: 'PATCH', url, data });
    }
    
    /**
     * Upload file
     */
    async uploadFile(url, file, options = {}) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            
            // Add additional fields if provided
            if (options.data) {
                Object.entries(options.data).forEach(([key, value]) => {
                    formData.append(key, value);
                });
            }
            
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            if (options.onProgress) {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = (event.loaded / event.total) * 100;
                        options.onProgress(progress);
                    }
                });
            }
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({
                            success: true,
                            status: xhr.status,
                            data: response.data || response
                        });
                    } catch {
                        resolve({
                            success: true,
                            status: xhr.status,
                            data: xhr.responseText
                        });
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new APIError(error.message || 'Upload failed', 'UPLOAD_FAILED', xhr.status));
                    } catch {
                        reject(new APIError('Upload failed', 'UPLOAD_FAILED', xhr.status));
                    }
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new APIError('Upload failed', 'NETWORK_ERROR', 0));
            });
            
            xhr.addEventListener('abort', () => {
                reject(new APIError('Upload cancelled', 'CANCELLED', 0));
            });
            
            const fullURL = this.buildURL(url);
            xhr.open('POST', fullURL, true);
            
            // Add auth token if available
            const token = this.getAuthToken();
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            
            xhr.send(formData);
        });
    }
    
    /**
     * Main request method
     */
    async request(config) {
        return new Promise((resolve, reject) => {
            const wrappedRequest = { config, resolve, reject };
            
            if (!this.isOnline) {
                this.requestQueue.push(wrappedRequest);
                UINotifications.showInfo('Offline', 'Request queued. It will be sent when connection is restored.');
                return;
            }
            
            this.executeRequest(config, resolve, reject);
        });
    }
}

/**
 * APIError class
 */
class APIError extends Error {
    constructor(message, code = 'UNKNOWN', status = 0, data = {}) {
        super(message);
        this.name = 'APIError';
        this.code = code;
        this.status = status;
        this.data = data;
    }
    
    isNetworkError() {
        return this.code === 'NETWORK_ERROR' || this.code === 'OFFLINE' || this.code === 'TIMEOUT';
    }
    
    isClientError() {
        return this.status >= 400 && this.status < 500;
    }
    
    isServerError() {
        return this.status >= 500;
    }
}

// Create global API client instance
const API = new APIClient();
