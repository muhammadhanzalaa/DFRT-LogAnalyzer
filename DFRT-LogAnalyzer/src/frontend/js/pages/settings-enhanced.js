/**
 * DFRT Log Analyzer - Enhanced Settings Page
 * Complete settings management with localStorage persistence and live config reload
 * @file pages/settings-enhanced.js
 */

const SettingsPageEnhanced = {
  state: {
    settings: {
      // UI Settings
      darkMode: false,
      sidebarCollapsed: false,
      compactMode: false,
      animationsEnabled: true,
      notificationsEnabled: true,
      soundEnabled: true,

      // Data Settings
      autoRefresh: true,
      refreshInterval: 30,
      pageSize: 50,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      // Analysis Settings
      bruteForceThreshold: 5,
      bruteForceWindow: 300,
      logTamperingThreshold: 3,
      riskScoreMin: 0,
      riskScoreMax: 100,

      // Export Settings
      exportFormat: 'json',
      includeTimeline: true,
      includeThreats: true,
      includeUserProfiles: true
    },
    hasChanges: false,
    saveTimeout: null
  },

  init() {
    console.log('Initializing Enhanced Settings Page');
    this.loadSettings();
    this.render();
    this.bind();
  },

  loadSettings() {
    // Load from localStorage with fallback to defaults
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state.settings = { ...this.state.settings, ...parsed };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    // Also load individual settings (for backward compatibility)
    if (localStorage.getItem('darkMode') !== null) {
      this.state.settings.darkMode = localStorage.getItem('darkMode') === 'true';
    }
    if (localStorage.getItem('autoRefresh') !== null) {
      this.state.settings.autoRefresh = localStorage.getItem('autoRefresh') !== 'false';
    }
  },

  saveSettings() {
    try {
      localStorage.setItem('appSettings', JSON.stringify(this.state.settings));
      
      // Also save individual items for compatibility
      localStorage.setItem('darkMode', this.state.settings.darkMode);
      localStorage.setItem('autoRefresh', this.state.settings.autoRefresh);
      localStorage.setItem('refreshInterval', this.state.settings.refreshInterval);
      localStorage.setItem('pageSize', this.state.settings.pageSize);

      ToastManager.success('Settings saved');
      this.state.hasChanges = false;
    } catch (error) {
      console.error('Error saving settings:', error);
      ToastManager.error('Failed to save settings');
    }
  },

  applySettings() {
    // Apply theme changes immediately
    if (this.state.settings.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }

    // Apply animation settings
    if (!this.state.settings.animationsEnabled) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
    }

    // Emit event for other parts of app to react
    window.dispatchEvent(new CustomEvent('settingsChanged', {
      detail: this.state.settings
    }));
  },

  render() {
    const container = document.getElementById('settingsContent');
    if (!container) return;

    const html = `
      <div class="settings-container" style="max-width: 800px; margin: 0 auto;">
        <!-- UI Settings Section -->
        <div class="settings-section" style="background: var(--color-bg-secondary); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
            <i class="fas fa-palette"></i> Appearance
          </h2>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-secondary);">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Dark Mode</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Use dark theme</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="darkModeSetting" 
              ${this.state.settings.darkMode ? 'checked' : ''} data-setting="darkMode">
          </div>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-secondary);">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Compact Mode</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Reduce spacing and padding</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="compactModeSetting"
              ${this.state.settings.compactMode ? 'checked' : ''} data-setting="compactMode">
          </div>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Animations</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Enable UI animations</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="animationsEnabledSetting"
              ${this.state.settings.animationsEnabled ? 'checked' : ''} data-setting="animationsEnabled">
          </div>
        </div>

        <!-- Notification Settings Section -->
        <div class="settings-section" style="background: var(--color-bg-secondary); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
            <i class="fas fa-bell"></i> Notifications
          </h2>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-secondary);">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Desktop Notifications</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Show notification toasts</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="notificationsSetting"
              ${this.state.settings.notificationsEnabled ? 'checked' : ''} data-setting="notificationsEnabled">
          </div>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Sound Alerts</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Play sound on alerts</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="soundSetting"
              ${this.state.settings.soundEnabled ? 'checked' : ''} data-setting="soundEnabled">
          </div>
        </div>

        <!-- Data Settings Section -->
        <div class="settings-section" style="background: var(--color-bg-secondary); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
            <i class="fas fa-sync"></i> Data & Refresh
          </h2>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-secondary);">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Auto Refresh</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Automatically refresh data</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="autoRefreshSetting"
              ${this.state.settings.autoRefresh ? 'checked' : ''} data-setting="autoRefresh">
          </div>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-secondary);">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Refresh Interval (seconds)</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">How often to refresh data</p>
            </div>
            <input type="number" min="5" max="3600" value="${this.state.settings.refreshInterval}"
              id="refreshIntervalSetting" data-setting="refreshInterval"
              style="width: 80px; padding: 8px; border: 1px solid var(--color-border-secondary); border-radius: 4px; background: var(--color-bg-primary);">
          </div>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Page Size</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Items per page</p>
            </div>
            <select id="pageSizeSetting" data-setting="pageSize"
              style="padding: 8px; border: 1px solid var(--color-border-secondary); border-radius: 4px; background: var(--color-bg-primary); color: var(--color-text-primary);">
              <option value="25" ${this.state.settings.pageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${this.state.settings.pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.state.settings.pageSize === 100 ? 'selected' : ''}>100</option>
              <option value="250" ${this.state.settings.pageSize === 250 ? 'selected' : ''}>250</option>
            </select>
          </div>
        </div>

        <!-- Analysis Settings Section -->
        <div class="settings-section" style="background: var(--color-bg-secondary); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
            <i class="fas fa-microscope"></i> Analysis
          </h2>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-secondary);">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Brute Force Threshold</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Failed attempts to trigger alert</p>
            </div>
            <input type="number" min="1" max="100" value="${this.state.settings.bruteForceThreshold}"
              id="bruteForceThresholdSetting" data-setting="bruteForceThreshold"
              style="width: 80px; padding: 8px; border: 1px solid var(--color-border-secondary); border-radius: 4px; background: var(--color-bg-primary);">
          </div>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Brute Force Window (seconds)</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Time window for grouping attempts</p>
            </div>
            <input type="number" min="10" max="10000" value="${this.state.settings.bruteForceWindow}"
              id="bruteForceWindowSetting" data-setting="bruteForceWindow"
              style="width: 80px; padding: 8px; border: 1px solid var(--color-border-secondary); border-radius: 4px; background: var(--color-bg-primary);">
          </div>
        </div>

        <!-- Export Settings Section -->
        <div class="settings-section" style="background: var(--color-bg-secondary); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
            <i class="fas fa-download"></i> Export
          </h2>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-secondary);">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Include Timeline</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Add timeline data to exports</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="includeTimelineSetting"
              ${this.state.settings.includeTimeline ? 'checked' : ''} data-setting="includeTimeline">
          </div>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-secondary);">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Include Threats</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Add threat data to exports</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="includeThreatsetting"
              ${this.state.settings.includeThreats ? 'checked' : ''} data-setting="includeThreats">
          </div>

          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <div>
              <label style="font-weight: 500; color: var(--color-text-primary);">Include User Profiles</label>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-tertiary);">Add user profile data to exports</p>
            </div>
            <input type="checkbox" class="toggle-switch" id="includeUserProfilesSetting"
              ${this.state.settings.includeUserProfiles ? 'checked' : ''} data-setting="includeUserProfiles">
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 12px; margin-top: 32px;">
          <button id="saveSettingsBtn" class="btn btn-primary" style="flex: 1;">
            <i class="fas fa-save"></i> Save Changes
          </button>
          <button id="resetSettingsBtn" class="btn btn-secondary" style="flex: 1;">
            <i class="fas fa-undo"></i> Reset to Defaults
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  bind() {
    // Checkbox settings
    document.querySelectorAll('input[type="checkbox"][data-setting]').forEach(input => {
      input.addEventListener('change', (e) => {
        const setting = e.target.dataset.setting;
        const value = e.target.checked;
        this.state.settings[setting] = value;
        this.state.hasChanges = true;

        // Apply immediately for some settings
        if (['darkMode', 'animationsEnabled'].includes(setting)) {
          this.applySettings();
        }
      });
    });

    // Number/select inputs
    document.querySelectorAll('input[type="number"][data-setting], select[data-setting]').forEach(input => {
      input.addEventListener('change', (e) => {
        const setting = e.target.dataset.setting;
        const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
        
        // Validate ranges
        if (setting === 'refreshInterval') {
          this.state.settings[setting] = Math.max(5, Math.min(3600, value));
        } else if (setting === 'pageSize') {
          this.state.settings[setting] = value;
        } else if (setting === 'bruteForceThreshold') {
          this.state.settings[setting] = Math.max(1, Math.min(100, value));
        } else {
          this.state.settings[setting] = value;
        }
        
        this.state.hasChanges = true;
      });
    });

    // Save button
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSettings();
        this.applySettings();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all settings to defaults?')) {
          localStorage.removeItem('appSettings');
          this.state.settings = this.getDefaults();
          this.state.hasChanges = false;
          this.render();
          this.bind();
          this.applySettings();
          ToastManager.success('Settings reset to defaults');
        }
      });
    }
  },

  getDefaults() {
    return {
      darkMode: false,
      sidebarCollapsed: false,
      compactMode: false,
      animationsEnabled: true,
      notificationsEnabled: true,
      soundEnabled: true,
      autoRefresh: true,
      refreshInterval: 30,
      pageSize: 50,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      bruteForceThreshold: 5,
      bruteForceWindow: 300,
      logTamperingThreshold: 3,
      riskScoreMin: 0,
      riskScoreMax: 100,
      exportFormat: 'json',
      includeTimeline: true,
      includeThreats: true,
      includeUserProfiles: true
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsPageEnhanced;
}
