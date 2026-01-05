/**
 * DFRT Log Analyzer - UI Notifications System
 * Toast notifications, loading indicators, and user feedback
 */

class UINotifications {
    /**
     * Create a toast notification
     */
    static createToast(title, message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.warn('Toast container not found');
            return;
        }
        
        const id = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.id = id;
        
        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${iconMap[type] || '●'}</span>
            <div class="toast-content">
                <div class="toast-title">${this.escapeHtml(title)}</div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" data-toast-id="${id}">×</button>
        `;
        
        container.appendChild(toast);
        
        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(id);
        });
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(id);
            }, duration);
        }
        
        return id;
    }
    
    /**
     * Remove toast
     */
    static removeToast(id) {
        const toast = document.getElementById(id);
        if (toast) {
            toast.classList.add('show-remove');
            setTimeout(() => {
                toast.remove();
            }, 250);
        }
    }
    
    /**
     * Show success notification
     */
    static showSuccess(title, message, duration) {
        return this.createToast(title, message, 'success', duration);
    }
    
    /**
     * Show error notification
     */
    static showError(title, message, duration) {
        return this.createToast(title, message, 'error', duration);
    }
    
    /**
     * Show warning notification
     */
    static showWarning(title, message, duration) {
        return this.createToast(title, message, 'warning', duration);
    }
    
    /**
     * Show info notification
     */
    static showInfo(title, message, duration) {
        return this.createToast(title, message, 'info', duration);
    }
    
    /**
     * Show loading indicator
     */
    static showLoading(message = 'Loading...') {
        const id = `loading-${Date.now()}`;
        const container = document.getElementById('toastContainer');
        if (!container) return null;
        
        const loading = document.createElement('div');
        loading.className = 'toast';
        loading.id = id;
        loading.style.pointerEvents = 'none';
        
        loading.innerHTML = `
            <div class="spinner spinner-sm"></div>
            <div class="toast-content">
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
        `;
        
        container.appendChild(loading);
        return id;
    }
    
    /**
     * Confirm dialog
     */
    static confirm(title, message) {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop show';
            backdrop.id = `modal-${Date.now()}`;
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.maxWidth = '400px';
            
            modal.innerHTML = `
                <div class="modal-header">
                    <h3 class="modal-title">${this.escapeHtml(title)}</h3>
                </div>
                <div class="modal-body">
                    <p>${this.escapeHtml(message)}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-primary confirm-btn">Confirm</button>
                </div>
            `;
            
            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);
            
            const close = () => {
                backdrop.remove();
            };
            
            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                close();
                resolve(true);
            });
            
            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                close();
                resolve(false);
            });
            
            // Close on backdrop click
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    close();
                    resolve(false);
                }
            });
        });
    }
    
    /**
     * Prompt dialog
     */
    static prompt(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop show';
            backdrop.id = `modal-${Date.now()}`;
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.maxWidth = '400px';
            
            modal.innerHTML = `
                <div class="modal-header">
                    <h3 class="modal-title">${this.escapeHtml(title)}</h3>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: var(--space-4);">${this.escapeHtml(message)}</p>
                    <input type="text" class="form-control prompt-input" value="${this.escapeHtml(defaultValue)}" />
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-primary confirm-btn">OK</button>
                </div>
            `;
            
            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);
            
            const input = modal.querySelector('.prompt-input');
            input.focus();
            
            const close = () => {
                backdrop.remove();
            };
            
            const handleConfirm = () => {
                close();
                resolve(input.value);
            };
            
            modal.querySelector('.confirm-btn').addEventListener('click', handleConfirm);
            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                close();
                resolve(null);
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                }
            });
            
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    close();
                    resolve(null);
                }
            });
        });
    }
    
    /**
     * Alert dialog
     */
    static alert(title, message) {
        return this.confirm(title, message).then(() => true);
    }
    
    /**
     * Show modal
     */
    static showModal(title, content, buttons = []) {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop show';
            backdrop.id = `modal-${Date.now()}`;
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            
            const buttonHTML = buttons.map((btn, idx) => `
                <button class="btn btn-${btn.variant || 'secondary'} modal-btn" data-index="${idx}">
                    ${this.escapeHtml(btn.text)}
                </button>
            `).join('');
            
            modal.innerHTML = `
                <div class="modal-header">
                    <h3 class="modal-title">${this.escapeHtml(title)}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length > 0 ? `<div class="modal-footer">${buttonHTML}</div>` : ''}
            `;
            
            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);
            
            const close = (result = null) => {
                backdrop.remove();
                resolve(result);
            };
            
            modal.querySelector('.modal-close').addEventListener('click', () => close());
            
            buttons.forEach((btn, idx) => {
                modal.querySelector(`[data-index="${idx}"]`).addEventListener('click', () => {
                    close(idx);
                });
            });
            
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    close();
                }
            });
        });
    }
    
    /**
     * Escape HTML
     */
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
    }
}

/**
 * Loading Indicator Helper
 */
class LoadingIndicator {
    static show(message = 'Loading...') {
        return UINotifications.showLoading(message);
    }
    
    static hide(id) {
        if (id) {
            UINotifications.removeToast(id);
        }
    }
}
