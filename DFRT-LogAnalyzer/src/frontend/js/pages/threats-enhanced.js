/**
 * DFRT Log Analyzer - Enhanced Threats Page
 * Comprehensive threat detection and analysis dashboard
 * @file pages/threats-enhanced.js
 */

const ThreatsPageEnhanced = {
  state: {
    analysisId: null,
    threats: [],
    filteredThreats: [],
    detailsModal: {
      visible: false,
      current: null
    },
    filters: {
      severity: 'all',
      type: 'all',
      status: 'all'
    },
    sort: {
      field: 'severity',
      order: 'desc'
    },
    isLoading: false
  },

  init() {
    console.log('Initializing Enhanced Threats Page');
    this.bindUIElements();
    this.loadAnalysesList();
  },

  bindUIElements() {
    // Analysis selector
    const select = document.getElementById('threatsAnalysisSelect');
    if (select) {
      select.addEventListener('change', (e) => this.selectAnalysis(e.target.value));
    }

    // Filter controls
    const severityFilter = document.getElementById('threatSeverityFilter');
    const typeFilter = document.getElementById('threatTypeFilter');
    const statusFilter = document.getElementById('threatStatusFilter');

    if (severityFilter) {
      severityFilter.addEventListener('change', () => this.applyFilters());
    }
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.applyFilters());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshThreatsBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.state.analysisId) {
          this.loadThreats();
        }
      });
    }

    // Export button
    const exportBtn = document.getElementById('exportThreatsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportThreats());
    }
  },

  async loadAnalysesList() {
    try {
      const response = await API.get('/analysis');
      if (!response || !response.success) return;

      const select = document.getElementById('threatsAnalysisSelect');
      if (!select) return;

      const html = '<option value="">-- Select Analysis --</option>' +
        (response.data || []).map(a => `
          <option value="${a.id}">${Utils.escapeHTML(a.name)}</option>
        `).join('');

      select.innerHTML = html;
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  },

  async selectAnalysis(analysisId) {
    if (!analysisId) {
      this.showEmptyState();
      return;
    }

    this.state.analysisId = analysisId;
    this.state.filters = { severity: 'all', type: 'all', status: 'all' };
    
    this.showLoadingState();

    try {
      await this.loadThreats();
      this.showContent();
    } catch (error) {
      console.error('Error loading threats:', error);
      ToastManager.error('Failed to load threats');
      this.showEmptyState();
    }
  },

  async loadThreats() {
    if (!this.state.analysisId) return;

    this.state.isLoading = true;

    try {
      const response = await API.get(`/analysis/${this.state.analysisId}/threats`);
      if (!response || !response.success) {
        throw new Error('Failed to load threats');
      }

      this.state.threats = response.data?.threats || [];
      this.applyFilters();
      this.renderThreats();
    } catch (error) {
      console.error('Error loading threats:', error);
      throw error;
    } finally {
      this.state.isLoading = false;
    }
  },

  applyFilters() {
    const severitySelect = document.getElementById('threatSeverityFilter');
    const typeSelect = document.getElementById('threatTypeFilter');
    const statusSelect = document.getElementById('threatStatusFilter');

    if (severitySelect) this.state.filters.severity = severitySelect.value;
    if (typeSelect) this.state.filters.type = typeSelect.value;
    if (statusSelect) this.state.filters.status = statusSelect.value;

    // Apply filters
    this.state.filteredThreats = this.state.threats.filter(threat => {
      if (this.state.filters.severity !== 'all' && threat.severity !== this.state.filters.severity) {
        return false;
      }
      if (this.state.filters.type !== 'all' && threat.type !== this.state.filters.type) {
        return false;
      }
      if (this.state.filters.status !== 'all' && (threat.status || 'unreviewed') !== this.state.filters.status) {
        return false;
      }
      return true;
    });

    // Apply sorting
    this.state.filteredThreats.sort((a, b) => {
      let aVal = a[this.state.sort.field];
      let bVal = b[this.state.sort.field];

      // Custom sorting for severity
      if (this.state.sort.field === 'severity') {
        const severityOrder = { critical: 3, warning: 2, normal: 1, info: 0 };
        aVal = severityOrder[aVal] || 0;
        bVal = severityOrder[bVal] || 0;
      }

      if (aVal < bVal) return this.state.sort.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.state.sort.order === 'asc' ? 1 : -1;
      return 0;
    });

    this.renderThreats();
  },

  renderThreats() {
    const container = document.getElementById('threatsContainer');
    if (!container) return;

    if (this.state.filteredThreats.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 24px; color: var(--color-text-tertiary);">
          <i class="fas fa-shield-alt" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
          ${this.state.threats.length === 0 ? 'No threats detected' : 'No threats match the current filters'}
        </div>
      `;
      return;
    }

    // Summary stats
    const stats = this.getStats();
    const summaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <div class="stat-card" style="background: var(--danger-50); padding: 16px; border-radius: 8px; border-left: 4px solid var(--danger-600);">
          <div style="font-size: 12px; color: var(--danger-600); text-transform: uppercase; font-weight: 600;">Critical</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--danger-600);">${stats.critical}</div>
        </div>
        <div class="stat-card" style="background: var(--warning-50); padding: 16px; border-radius: 8px; border-left: 4px solid var(--warning-600);">
          <div style="font-size: 12px; color: var(--warning-600); text-transform: uppercase; font-weight: 600;">Warning</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--warning-600);">${stats.warning}</div>
        </div>
        <div class="stat-card" style="background: var(--info-50); padding: 16px; border-radius: 8px; border-left: 4px solid var(--info-600);">
          <div style="font-size: 12px; color: var(--info-600); text-transform: uppercase; font-weight: 600;">Info</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--info-600);">${stats.info}</div>
        </div>
        <div class="stat-card" style="background: var(--primary-50); padding: 16px; border-radius: 8px; border-left: 4px solid var(--primary-600);">
          <div style="font-size: 12px; color: var(--primary-600); text-transform: uppercase; font-weight: 600;">Total</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--primary-600);">${stats.total}</div>
        </div>
      </div>
    `;

    // Threat cards
    const threatCardsHtml = this.state.filteredThreats.map(threat => `
      <div class="threat-card" style="background: var(--color-bg-secondary); border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid ${this.getSeverityColor(threat.severity)}; cursor: pointer;" onclick="ThreatsPageEnhanced.showDetails('${threat.id}')">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 4px 0; color: var(--color-text-primary); font-size: 14px; font-weight: 600;">
              ${Utils.escapeHTML(threat.type)}
            </h3>
            <div style="font-size: 12px; color: var(--color-text-tertiary);">
              <i class="fas fa-clock"></i> ${Utils.formatDate(threat.detectedAt, 'short')}
            </div>
          </div>
          <span class="severity-badge severity-${(threat.severity || 'info').toLowerCase()}" style="margin-left: 12px;">
            ${threat.severity || 'Info'}
          </span>
        </div>
        
        <p style="margin: 8px 0; color: var(--color-text-secondary); font-size: 13px;">
          ${Utils.escapeHTML(threat.description || 'No description')}
        </p>

        ${threat.affectedUsers && threat.affectedUsers.length > 0 ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border-secondary); font-size: 12px;">
            <strong>Affected Users:</strong> ${threat.affectedUsers.slice(0, 3).map(u => `<code style="background: var(--color-bg-tertiary); padding: 2px 6px; border-radius: 3px; margin-right: 4px;">${Utils.escapeHTML(u)}</code>`).join('')}
            ${threat.affectedUsers.length > 3 ? `<span style="color: var(--color-text-tertiary);">+${threat.affectedUsers.length - 3} more</span>` : ''}
          </div>
        ` : ''}

        ${threat.sourceIPs && threat.sourceIPs.length > 0 ? `
          <div style="margin-top: 8px; font-size: 12px;">
            <strong>Source IPs:</strong> ${threat.sourceIPs.slice(0, 2).map(ip => `<code style="background: var(--color-bg-tertiary); padding: 2px 6px; border-radius: 3px; margin-right: 4px;">${Utils.escapeHTML(ip)}</code>`).join('')}
            ${threat.sourceIPs.length > 2 ? `<span style="color: var(--color-text-tertiary);">+${threat.sourceIPs.length - 2} more</span>` : ''}
          </div>
        ` : ''}

        <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: var(--color-text-tertiary);">
            <strong>Confidence:</strong> ${Math.round((threat.confidence || 0) * 100)}%
          </div>
          <button class="btn btn-icon" style="padding: 4px 8px; font-size: 12px;">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = summaryHtml + threatCardsHtml;
  },

  showDetails(threatId) {
    const threat = this.state.filteredThreats.find(t => t.id === threatId);
    if (!threat) return;

    const modal = document.getElementById('threatDetailsModal');
    if (!modal) {
      // Create modal if it doesn't exist
      const newModal = document.createElement('div');
      newModal.id = 'threatDetailsModal';
      newModal.className = 'modal';
      document.body.appendChild(newModal);
    }

    const modalContent = document.getElementById('threatDetailsModal');
    modalContent.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.style.display='none'"></div>
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2 style="margin: 0;">
            <span class="severity-badge severity-${(threat.severity || 'info').toLowerCase()}">
              ${threat.severity || 'Info'}
            </span>
            ${Utils.escapeHTML(threat.type)}
          </h2>
          <button class="modal-close" onclick="this.closest('.modal').style.display='none'">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body" style="padding: 20px;">
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; color: var(--color-text-primary);">Description</h3>
            <p style="margin: 0; color: var(--color-text-secondary);">
              ${Utils.escapeHTML(threat.description || 'No description available')}
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div>
              <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: var(--color-text-tertiary);">Detected At</h4>
              <p style="margin: 0; color: var(--color-text-primary);">${Utils.formatDate(threat.detectedAt, 'long')}</p>
            </div>
            <div>
              <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: var(--color-text-tertiary);">Confidence</h4>
              <p style="margin: 0; color: var(--color-text-primary);">${Math.round((threat.confidence || 0) * 100)}%</p>
            </div>
          </div>

          ${threat.affectedUsers && threat.affectedUsers.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 8px 0; color: var(--color-text-primary);">Affected Users (${threat.affectedUsers.length})</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${threat.affectedUsers.map(user => `
                  <span style="background: var(--primary-50); color: var(--primary-700); padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                    ${Utils.escapeHTML(user)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${threat.sourceIPs && threat.sourceIPs.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 8px 0; color: var(--color-text-primary);">Source IPs (${threat.sourceIPs.length})</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${threat.sourceIPs.map(ip => `
                  <span style="background: var(--warning-50); color: var(--warning-700); padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                    ${Utils.escapeHTML(ip)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${threat.metadata ? `
            <div style="background: var(--color-bg-tertiary); padding: 12px; border-radius: 6px; margin-top: 20px;">
              <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: var(--color-text-tertiary);">Additional Details</h4>
              <pre style="margin: 0; font-size: 11px; overflow: auto; max-height: 200px; color: var(--color-text-secondary);">
${Utils.escapeHTML(JSON.stringify(threat.metadata, null, 2))}
              </pre>
            </div>
          ` : ''}
        </div>

        <div class="modal-footer" style="padding: 16px; border-top: 1px solid var(--color-border-secondary); display: flex; gap: 12px;">
          <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'" style="flex: 1;">Close</button>
          <button class="btn btn-primary" onclick="ThreatsPageEnhanced.exportThreat('${threatId}')" style="flex: 1;">Export</button>
        </div>
      </div>
    `;

    modalContent.style.display = 'flex';
  },

  getStats() {
    return {
      critical: this.state.filteredThreats.filter(t => t.severity === 'critical').length,
      warning: this.state.filteredThreats.filter(t => t.severity === 'warning').length,
      info: this.state.filteredThreats.filter(t => t.severity === 'info').length,
      total: this.state.filteredThreats.length
    };
  },

  getSeverityColor(severity) {
    const colors = {
      critical: 'var(--danger-600)',
      warning: 'var(--warning-600)',
      info: 'var(--info-600)',
      normal: 'var(--success-600)'
    };
    return colors[severity] || 'var(--primary-600)';
  },

  exportThreats() {
    if (this.state.filteredThreats.length === 0) {
      ToastManager.warning('No threats to export');
      return;
    }

    try {
      const data = {
        analysisId: this.state.analysisId,
        exportedAt: new Date().toISOString(),
        threatCount: this.state.filteredThreats.length,
        threats: this.state.filteredThreats
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `threats-${this.state.analysisId}-${Date.now()}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      ToastManager.success('Threats exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      ToastManager.error('Failed to export threats');
    }
  },

  exportThreat(threatId) {
    const threat = this.state.filteredThreats.find(t => t.id === threatId);
    if (!threat) return;

    try {
      const blob = new Blob([JSON.stringify(threat, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `threat-${threat.id}-${Date.now()}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      ToastManager.success('Threat exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      ToastManager.error('Failed to export threat');
    }
  },

  showEmptyState() {
    const content = document.getElementById('threatsContent');
    const empty = document.getElementById('noThreatsState');

    if (content) content.style.display = 'none';
    if (empty) empty.style.display = 'flex';
  },

  showLoadingState() {
    const content = document.getElementById('threatsContent');
    if (content) {
      content.innerHTML = `
        <div style="text-align: center; padding: 48px 24px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--primary-600); margin-bottom: 12px; display: block;"></i>
          <div style="color: var(--color-text-secondary);">Loading threats...</div>
        </div>
      `;
    }
  },

  showContent() {
    const content = document.getElementById('threatsContent');
    const empty = document.getElementById('noThreatsState');

    if (empty) empty.style.display = 'none';
    if (content) content.style.display = 'block';
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThreatsPageEnhanced;
}
