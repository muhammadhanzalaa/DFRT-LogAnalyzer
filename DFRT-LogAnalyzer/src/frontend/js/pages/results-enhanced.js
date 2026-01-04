/**
 * DFRT Log Analyzer - Enhanced Results Page
 * Complete implementation with API integration, pagination, filtering, sorting, and export
 * @file pages/results-enhanced.js
 */

const ResultsPageEnhanced = {
  state: {
    analysisId: null,
    entries: [],
    threats: [],
    userProfiles: [],
    timeline: [],
    summary: {
      totalEntries: 0,
      riskScore: 0,
      threatsCount: 0,
      usersAnalyzed: 0,
      statistics: {
        normalEvents: 0,
        warningEvents: 0,
        criticalEvents: 0
      }
    },
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      offset: 0,
      hasNext: false,
      hasPrev: false
    },
    filters: {
      severity: 'all',
      user: '',
      ip: '',
      eventType: '',
      keyword: ''
    },
    sort: {
      field: 'timestamp',
      order: 'desc'
    },
    isLoading: false
  },

  /**
   * Initialize results page
   */
  init() {
    console.log('Initializing Enhanced Results Page');
    this.bindUIElements();
    this.loadAnalysesList();
  },

  /**
   * Bind all UI event listeners
   */
  bindUIElements() {
    // Analysis selector
    const analysisSelect = document.getElementById('analysisSelect');
    if (analysisSelect) {
      analysisSelect.addEventListener('change', (e) => {
        this.selectAnalysis(e.target.value);
      });
    }

    // Pagination controls
    const prevBtn = document.getElementById('resultPrevPage');
    const nextBtn = document.getElementById('resultNextPage');
    const pageSize = document.getElementById('resultPageSize');

    if (prevBtn) prevBtn.addEventListener('click', () => this.changePage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.changePage(1));
    if (pageSize) {
      pageSize.addEventListener('change', (e) => {
        this.state.pagination.limit = parseInt(e.target.value) || 50;
        this.state.pagination.page = 1;
        this.loadEntries();
      });
    }

    // Filter controls
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => this.applyFilters());
    }
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }

    // Search input
    const search = document.getElementById('resultSearch');
    if (search) {
      search.addEventListener('input', Utils.debounce(() => {
        this.state.filters.keyword = search.value;
        this.state.pagination.page = 1;
        this.loadEntries();
      }, 400));
    }

    // Severity filter
    document.querySelectorAll('.severity-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.filters.severity = btn.dataset.severity || 'all';
        this.loadEntries();
      });
    });

    // Sortable headers
    document.querySelectorAll('.results-table thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (this.state.sort.field === field) {
          this.state.sort.order = this.state.sort.order === 'asc' ? 'desc' : 'asc';
        } else {
          this.state.sort.field = field;
          this.state.sort.order = 'asc';
        }
        this.loadEntries();
      });
    });

    // Export buttons
    const exportBtn = document.getElementById('exportResultsBtn');
    const exportTimelineBtn = document.getElementById('exportTimelineBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');

    if (exportBtn) exportBtn.addEventListener('click', () => this.exportResults());
    if (exportTimelineBtn) exportTimelineBtn.addEventListener('click', () => this.exportTimeline());
    if (generateReportBtn) generateReportBtn.addEventListener('click', () => this.generateReport());
  },

  /**
   * Load list of analyses from API
   */
  async loadAnalysesList() {
    try {
      const response = await API.get('/analysis');
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to load analyses');
      }

      const analyses = response.data || [];
      const select = document.getElementById('analysisSelect');
      if (!select) return;

      // Build options
      const html = '<option value="">-- Select Analysis --</option>' +
        analyses.map(a => {
          const date = new Date(a.createdAt).toLocaleDateString();
          const status = a.status ? `[${a.status.toUpperCase()}]` : '';
          return `<option value="${a.id}">${Utils.escapeHTML(a.name)} ${date} ${status}</option>`;
        }).join('');

      select.innerHTML = html;

      // Auto-select from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const analysisId = urlParams.get('id');
      if (analysisId) {
        select.value = analysisId;
        this.selectAnalysis(analysisId);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
      ToastManager.error('Failed to load analyses list');
    }
  },

  /**
   * Select analysis and load its data
   */
  async selectAnalysis(analysisId) {
    if (!analysisId) {
      this.showEmptyState();
      return;
    }

    this.state.analysisId = analysisId;
    this.state.pagination.page = 1;
    this.state.filters = { severity: 'all', user: '', ip: '', eventType: '', keyword: '' };

    this.showLoadingState();

    try {
      // Load analysis summary and data in parallel
      await Promise.all([
        this.loadSummary(),
        this.loadEntries(),
        this.loadThreats(),
        this.loadTimeline()
      ]);

      this.showContent();
    } catch (error) {
      console.error('Error loading analysis:', error);
      ToastManager.error('Failed to load analysis data');
      this.showEmptyState();
    }
  },

  /**
   * Load analysis summary/statistics
   */
  async loadSummary() {
    try {
      const response = await API.get(`/analysis/${this.state.analysisId}`);
      if (!response || !response.success) return;

      const data = response.data;
      this.state.summary = {
        totalEntries: data.statistics?.totalEntries || 0,
        riskScore: Math.round((data.riskScore || 0) * 100),
        threatsCount: data.statistics?.threatsCount || 0,
        usersAnalyzed: data.statistics?.usersCount || 0,
        statistics: {
          normalEvents: data.statistics?.normalEvents || 0,
          warningEvents: data.statistics?.warningEvents || 0,
          criticalEvents: data.statistics?.criticalEvents || 0
        }
      };

      this.renderSummaryCards();
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  },

  /**
   * Load log entries with current filters and pagination
   */
  async loadEntries() {
    if (!this.state.analysisId) return;

    this.state.isLoading = true;
    this.renderLoadingIndicator();

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: this.state.pagination.page,
        limit: this.state.pagination.limit,
        sort: this.state.sort.field,
        order: this.state.sort.order
      });

      if (this.state.filters.severity && this.state.filters.severity !== 'all') {
        params.append('severity', this.state.filters.severity);
      }
      if (this.state.filters.user) {
        params.append('user', this.state.filters.user);
      }
      if (this.state.filters.ip) {
        params.append('ip', this.state.filters.ip);
      }
      if (this.state.filters.eventType) {
        params.append('eventType', this.state.filters.eventType);
      }
      if (this.state.filters.keyword) {
        params.append('keyword', this.state.filters.keyword);
      }

      const response = await API.get(`/analysis/${this.state.analysisId}/entries?${params}`);
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to load entries');
      }

      this.state.entries = response.data?.entries || [];
      this.state.pagination.total = response.data?.total || 0;
      this.state.pagination.offset = (this.state.pagination.page - 1) * this.state.pagination.limit;
      this.state.pagination.hasNext = this.state.pagination.page * this.state.pagination.limit < this.state.pagination.total;
      this.state.pagination.hasPrev = this.state.pagination.page > 1;

      this.renderEntriesTable();
      this.updatePaginationControls();
    } catch (error) {
      console.error('Error loading entries:', error);
      ToastManager.error('Failed to load log entries');
      this.state.entries = [];
      this.renderEntriesTable();
    } finally {
      this.state.isLoading = false;
    }
  },

  /**
   * Load threats for current analysis
   */
  async loadThreats() {
    if (!this.state.analysisId) return;

    try {
      const response = await API.get(`/analysis/${this.state.analysisId}/threats`);
      if (!response || !response.success) return;

      this.state.threats = response.data?.threats || [];
      this.renderThreatsPanel();
    } catch (error) {
      console.error('Error loading threats:', error);
    }
  },

  /**
   * Load timeline for current analysis
   */
  async loadTimeline() {
    if (!this.state.analysisId) return;

    try {
      const response = await API.get(`/analysis/${this.state.analysisId}/timeline`);
      if (!response || !response.success) return;

      this.state.timeline = response.data?.timeline || [];
      this.renderTimelinePanel();
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  },

  /**
   * Apply current filters
   */
  async applyFilters() {
    this.state.pagination.page = 1;
    const userInput = document.getElementById('filterUser');
    const ipInput = document.getElementById('filterIP');
    const eventInput = document.getElementById('filterEventType');

    if (userInput) this.state.filters.user = userInput.value;
    if (ipInput) this.state.filters.ip = ipInput.value;
    if (eventInput) this.state.filters.eventType = eventInput.value;

    await this.loadEntries();
    ToastManager.info('Filters applied');
  },

  /**
   * Clear all filters
   */
  async clearFilters() {
    this.state.filters = {
      severity: 'all',
      user: '',
      ip: '',
      eventType: '',
      keyword: ''
    };

    const inputs = document.querySelectorAll('#filterUser, #filterIP, #filterEventType, #resultSearch');
    inputs.forEach(input => input.value = '');

    this.state.pagination.page = 1;
    await this.loadEntries();
    ToastManager.info('Filters cleared');
  },

  /**
   * Change page for pagination
   */
  changePage(direction) {
    const newPage = this.state.pagination.page + direction;
    if (newPage >= 1 && newPage * this.state.pagination.limit <= this.state.pagination.total + this.state.pagination.limit) {
      this.state.pagination.page = newPage;
      this.loadEntries();
    }
  },

  /**
   * Render summary cards
   */
  renderSummaryCards() {
    const container = document.getElementById('summaryCards');
    if (!container) return;

    const html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="summary-card">
          <div style="font-size: 12px; color: var(--color-text-tertiary); text-transform: uppercase; margin-bottom: 8px;">Total Entries</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--primary-600);">${this.state.summary.totalEntries.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div style="font-size: 12px; color: var(--color-text-tertiary); text-transform: uppercase; margin-bottom: 8px;">Risk Score</div>
          <div style="font-size: 24px; font-weight: 600; color: ${this.getRiskScoreColor(this.state.summary.riskScore)};">${this.state.summary.riskScore}%</div>
        </div>
        <div class="summary-card">
          <div style="font-size: 12px; color: var(--color-text-tertiary); text-transform: uppercase; margin-bottom: 8px;">Threats Detected</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--danger-600);">${this.state.summary.threatsCount}</div>
        </div>
        <div class="summary-card">
          <div style="font-size: 12px; color: var(--color-text-tertiary); text-transform: uppercase; margin-bottom: 8px;">Users Analyzed</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--success-600);">${this.state.summary.usersAnalyzed}</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  /**
   * Render entries table
   */
  renderEntriesTable() {
    const tbody = document.querySelector('.results-table tbody');
    if (!tbody) return;

    if (this.state.entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--color-text-tertiary);">
            <i class="fas fa-inbox" style="font-size: 24px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
            No log entries found
          </td>
        </tr>
      `;
      return;
    }

    const html = this.state.entries.map(entry => `
      <tr>
        <td>${Utils.formatDate(entry.timestamp, 'short')}</td>
        <td>${Utils.escapeHTML(entry.eventType || 'Unknown')}</td>
        <td>${Utils.escapeHTML(entry.source || 'N/A')}</td>
        <td>${Utils.escapeHTML(entry.user || 'System')}</td>
        <td><span class="severity-badge severity-${(entry.severity || 'normal').toLowerCase()}">${entry.severity || 'Normal'}</span></td>
        <td>${Utils.escapeHTML((entry.message || '').substring(0, 50))}...</td>
      </tr>
    `).join('');

    tbody.innerHTML = html;
  },

  /**
   * Render threats panel
   */
  renderThreatsPanel() {
    const container = document.getElementById('threatsPanel');
    if (!container || this.state.threats.length === 0) return;

    const html = `
      <div class="threats-section">
        <h3><i class="fas fa-exclamation-triangle"></i> Top Threats (${this.state.threats.length})</h3>
        <div style="display: grid; gap: 12px;">
          ${this.state.threats.slice(0, 5).map(threat => `
            <div style="padding: 12px; background: var(--danger-50); border-left: 4px solid var(--danger-500); border-radius: 4px;">
              <div style="font-weight: 600; color: var(--danger-700); margin-bottom: 4px;">${Utils.escapeHTML(threat.type)}</div>
              <div style="font-size: 12px; color: var(--color-text-secondary);">${Utils.escapeHTML(threat.description)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  /**
   * Render timeline panel (simplified)
   */
  renderTimelinePanel() {
    const container = document.getElementById('timelinePanel');
    if (!container || this.state.timeline.length === 0) return;

    const html = `
      <div class="timeline-section">
        <h3><i class="fas fa-history"></i> Timeline Preview (${this.state.timeline.length} events)</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">
          ${this.state.timeline.slice(0, 10).map(event => `
            <div style="padding: 8px 12px; background: var(--color-bg-secondary); border-radius: 4px; font-size: 12px;">
              <span style="color: var(--color-text-tertiary);">${Utils.formatDate(event.timestamp, 'time')}</span>
              <span style="margin: 0 8px;">→</span>
              <span>${Utils.escapeHTML(event.phase || event.description)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  /**
   * Update pagination controls
   */
  updatePaginationControls() {
    const prevBtn = document.getElementById('resultPrevPage');
    const nextBtn = document.getElementById('resultNextPage');
    const pageInfo = document.getElementById('pageInfo');

    if (prevBtn) prevBtn.disabled = !this.state.pagination.hasPrev;
    if (nextBtn) nextBtn.disabled = !this.state.pagination.hasNext;

    if (pageInfo) {
      const start = (this.state.pagination.page - 1) * this.state.pagination.limit + 1;
      const end = Math.min(this.state.pagination.page * this.state.pagination.limit, this.state.pagination.total);
      pageInfo.textContent = `${start}-${end} of ${this.state.pagination.total}`;
    }
  },

  /**
   * Export results to CSV
   */
  exportResults() {
    if (this.state.entries.length === 0) {
      ToastManager.warning('No entries to export');
      return;
    }

    try {
      const headers = ['Timestamp', 'Event Type', 'Source', 'User', 'Severity', 'Message'];
      const rows = this.state.entries.map(e => [
        new Date(e.timestamp).toISOString(),
        e.eventType || 'Unknown',
        e.source || 'N/A',
        e.user || 'System',
        e.severity || 'Normal',
        (e.message || '').replace(/"/g, '""')
      ]);

      let csv = headers.map(h => `"${h}"`).join(',') + '\n';
      csv += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `results-${this.state.analysisId}-${Date.now()}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      ToastManager.success('Results exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      ToastManager.error('Failed to export results');
    }
  },

  /**
   * Export timeline to JSON
   */
  exportTimeline() {
    if (this.state.timeline.length === 0) {
      ToastManager.warning('No timeline to export');
      return;
    }

    try {
      const data = {
        analysisId: this.state.analysisId,
        exportedAt: new Date().toISOString(),
        timeline: this.state.timeline
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `timeline-${this.state.analysisId}-${Date.now()}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      ToastManager.success('Timeline exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      ToastManager.error('Failed to export timeline');
    }
  },

  /**
   * Generate comprehensive report
   */
  generateReport() {
    if (!this.state.analysisId) {
      ToastManager.warning('Please select an analysis first');
      return;
    }

    try {
      const reportModal = document.getElementById('reportModal');
      if (reportModal) {
        const analysisSelect = reportModal.querySelector('#reportAnalysisSelect');
        if (analysisSelect) {
          analysisSelect.value = this.state.analysisId;
        }
        ModalManager.show('reportModal');
      }
    } catch (error) {
      console.error('Report error:', error);
      ToastManager.error('Failed to open report dialog');
    }
  },

  /**
   * Get risk score color
   */
  getRiskScoreColor(score) {
    if (score >= 80) return 'var(--danger-600)';
    if (score >= 60) return 'var(--warning-600)';
    if (score >= 40) return 'var(--info-600)';
    return 'var(--success-600)';
  },

  /**
   * Show empty state
   */
  showEmptyState() {
    const content = document.getElementById('resultsContent');
    const empty = document.getElementById('noResultsState');

    if (content) content.style.display = 'none';
    if (empty) empty.style.display = 'flex';

    const buttons = document.querySelectorAll('#exportResultsBtn, #exportTimelineBtn, #generateReportBtn');
    buttons.forEach(btn => btn.disabled = true);
  },

  /**
   * Show loading state
   */
  showLoadingState() {
    const content = document.getElementById('resultsContent');
    if (content) {
      content.style.opacity = '0.6';
      content.style.pointerEvents = 'none';
    }
  },

  /**
   * Show content
   */
  showContent() {
    const content = document.getElementById('resultsContent');
    if (content) {
      content.style.opacity = '1';
      content.style.pointerEvents = 'auto';
    }

    const empty = document.getElementById('noResultsState');
    if (empty) empty.style.display = 'none';

    const buttons = document.querySelectorAll('#exportResultsBtn, #exportTimelineBtn, #generateReportBtn');
    buttons.forEach(btn => btn.disabled = false);
  },

  /**
   * Render loading indicator
   */
  renderLoadingIndicator() {
    const tbody = document.querySelector('.results-table tbody');
    if (tbody && this.state.isLoading) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px;">
            <div style="display: inline-block;">
              <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--primary-600); margin-bottom: 12px; display: block;"></i>
              <div style="color: var(--color-text-secondary); font-size: 12px;">Loading entries...</div>
            </div>
          </td>
        </tr>
      `;
    }
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResultsPageEnhanced;
}
