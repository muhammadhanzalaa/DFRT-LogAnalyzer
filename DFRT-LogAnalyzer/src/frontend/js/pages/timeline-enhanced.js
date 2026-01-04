/**
 * DFRT Log Analyzer - Enhanced Timeline Page
 * Complete timeline visualization with event phases, severity filtering, and export
 * @file pages/timeline-enhanced.js
 */

const TimelinePageEnhanced = {
  state: {
    analysisId: null,
    events: [],
    phases: {},
    selectedPhase: 'all',
    severityFilter: 'all',
    viewMode: 'timeline', // timeline or phases
    isLoading: false
  },

  init() {
    console.log('Initializing Enhanced Timeline Page');
    this.bindUIElements();
    this.loadAnalysesList();
  },

  bindUIElements() {
    // Analysis selector
    const select = document.getElementById('timelineAnalysisSelect');
    if (select) {
      select.addEventListener('change', (e) => this.selectAnalysis(e.target.value));
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshTimelineBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.state.analysisId) {
          this.loadTimeline();
        }
      });
    }

    // Export button
    const exportBtn = document.getElementById('exportTimelineBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportTimeline());
    }

    // View mode toggles
    document.querySelectorAll('.timeline-view-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.timeline-view-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.viewMode = btn.dataset.view || 'timeline';
        this.render();
      });
    });

    // Severity filters
    document.querySelectorAll('.timeline-severity-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.timeline-severity-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.severityFilter = btn.dataset.severity || 'all';
        this.render();
      });
    });

    // Phase selector
    const phaseSelect = document.getElementById('phaseSelect');
    if (phaseSelect) {
      phaseSelect.addEventListener('change', (e) => {
        this.state.selectedPhase = e.target.value || 'all';
        this.render();
      });
    }
  },

  async loadAnalysesList() {
    try {
      const response = await API.get('/analysis');
      if (!response || !response.success) return;

      const select = document.getElementById('timelineAnalysisSelect');
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
    this.showLoadingState();

    try {
      await this.loadTimeline();
      this.showContent();
    } catch (error) {
      console.error('Error loading timeline:', error);
      ToastManager.error('Failed to load timeline');
      this.showEmptyState();
    }
  },

  async loadTimeline() {
    if (!this.state.analysisId) return;

    this.state.isLoading = true;

    try {
      const response = await API.get(`/analysis/${this.state.analysisId}/timeline`);
      if (!response || !response.success) {
        throw new Error('Failed to load timeline');
      }

      this.state.events = response.data?.timeline || [];
      this.organizeByPhase();
      this.updatePhaseSelector();
      this.render();
    } catch (error) {
      console.error('Error loading timeline:', error);
      throw error;
    } finally {
      this.state.isLoading = false;
    }
  },

  organizeByPhase() {
    this.state.phases = {};

    this.state.events.forEach(event => {
      const phase = event.phase || 'Unknown Phase';
      if (!this.state.phases[phase]) {
        this.state.phases[phase] = [];
      }
      this.state.phases[phase].push(event);
    });

    // Sort events within each phase by timestamp
    Object.keys(this.state.phases).forEach(phase => {
      this.state.phases[phase].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
    });
  },

  updatePhaseSelector() {
    const phaseSelect = document.getElementById('phaseSelect');
    if (!phaseSelect) return;

    const phases = Object.keys(this.state.phases);
    const html = '<option value="all">All Phases</option>' +
      phases.map(phase => `
        <option value="${phase}">${Utils.escapeHTML(phase)}</option>
      `).join('');

    phaseSelect.innerHTML = html;
  },

  render() {
    if (this.state.viewMode === 'timeline') {
      this.renderTimelineView();
    } else {
      this.renderPhasesView();
    }
  },

  renderTimelineView() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    let eventsToShow = this.state.events;

    // Apply filters
    if (this.state.severityFilter && this.state.severityFilter !== 'all') {
      eventsToShow = eventsToShow.filter(e => 
        (e.severity || '').toLowerCase() === this.state.severityFilter.toLowerCase()
      );
    }

    if (this.state.selectedPhase && this.state.selectedPhase !== 'all') {
      eventsToShow = eventsToShow.filter(e => (e.phase || 'Unknown Phase') === this.state.selectedPhase);
    }

    if (eventsToShow.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 24px; color: var(--color-text-tertiary);">
          <i class="fas fa-history" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
          No events match selected filters
        </div>
      `;
      return;
    }

    const html = `
      <div class="timeline-visualization">
        ${eventsToShow.map((event, idx) => {
          const date = new Date(event.timestamp);
          const timeStr = date.toLocaleTimeString();
          const severity = (event.severity || 'normal').toLowerCase();
          const color = this.getSeverityColor(severity);

          return `
            <div class="timeline-event" style="display: flex; margin-bottom: 24px;">
              <div style="display: flex; flex-direction: column; align-items: center; margin-right: 24px; flex-shrink: 0;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; margin-bottom: 8px;"></div>
                ${idx < eventsToShow.length - 1 ? `<div style="width: 2px; height: 40px; background-color: var(--color-border-secondary);"></div>` : ''}
              </div>
              <div style="flex: 1; background: var(--color-bg-secondary); padding: 16px; border-radius: 8px; border-left: 4px solid ${color};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">
                      ${Utils.escapeHTML(event.phase || 'Event')}
                    </div>
                    <div style="font-size: 12px; color: var(--color-text-tertiary);">
                      ${timeStr} · ${Utils.formatDate(event.timestamp, 'short')}
                    </div>
                  </div>
                  <span class="severity-badge severity-${severity}">${severity}</span>
                </div>
                <div style="font-size: 14px; color: var(--color-text-secondary); margin-bottom: 8px;">
                  ${Utils.escapeHTML(event.description || 'No description')}
                </div>
                ${event.actor ? `<div style="font-size: 12px; color: var(--color-text-tertiary);"><strong>Actor:</strong> ${Utils.escapeHTML(event.actor)}</div>` : ''}
                ${event.ip ? `<div style="font-size: 12px; color: var(--color-text-tertiary);"><strong>IP:</strong> ${Utils.escapeHTML(event.ip)}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  },

  renderPhasesView() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    const phases = Object.keys(this.state.phases).sort();
    
    if (phases.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 48px 24px; color: var(--color-text-tertiary);">No phases found</div>';
      return;
    }

    const html = `
      <div class="phases-visualization">
        ${phases.map(phase => {
          const phaseEvents = this.state.phases[phase];
          const filteredEvents = this.state.severityFilter && this.state.severityFilter !== 'all'
            ? phaseEvents.filter(e => (e.severity || '').toLowerCase() === this.state.severityFilter.toLowerCase())
            : phaseEvents;

          if (filteredEvents.length === 0) return '';

          const severityCounts = {
            critical: filteredEvents.filter(e => (e.severity || '').toLowerCase() === 'critical').length,
            warning: filteredEvents.filter(e => (e.severity || '').toLowerCase() === 'warning').length,
            normal: filteredEvents.filter(e => (e.severity || '').toLowerCase() === 'normal').length
          };

          return `
            <div class="phase-card" style="background: var(--color-bg-secondary); border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 6px solid var(--primary-600);">
              <div style="margin-bottom: 12px;">
                <h3 style="margin: 0 0 4px 0; color: var(--color-text-primary);">${Utils.escapeHTML(phase)}</h3>
                <div style="font-size: 12px; color: var(--color-text-tertiary);">
                  ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}
                  ${severityCounts.critical > 0 ? `• <span style="color: var(--danger-600);">${severityCounts.critical} critical</span>` : ''}
                  ${severityCounts.warning > 0 ? `• <span style="color: var(--warning-600);">${severityCounts.warning} warnings</span>` : ''}
                </div>
              </div>
              <div style="display: grid; gap: 8px;">
                ${filteredEvents.slice(0, 5).map(event => `
                  <div style="font-size: 12px; padding: 8px; background: var(--color-bg-tertiary); border-radius: 4px;">
                    <div style="color: var(--color-text-secondary); margin-bottom: 2px;">
                      <i class="fas fa-clock"></i> ${new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                    <div style="color: var(--color-text-primary);">
                      ${Utils.escapeHTML(event.description || 'Event')}
                    </div>
                  </div>
                `).join('')}
                ${filteredEvents.length > 5 ? `
                  <div style="font-size: 12px; color: var(--color-text-tertiary); padding: 8px; text-align: center;">
                    +${filteredEvents.length - 5} more events
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  },

  getSeverityColor(severity) {
    const colors = {
      critical: 'var(--danger-600)',
      warning: 'var(--warning-600)',
      normal: 'var(--success-600)',
      info: 'var(--info-600)'
    };
    return colors[severity] || 'var(--primary-600)';
  },

  exportTimeline() {
    if (this.state.events.length === 0) {
      ToastManager.warning('No timeline data to export');
      return;
    }

    try {
      const data = {
        analysisId: this.state.analysisId,
        exportedAt: new Date().toISOString(),
        eventCount: this.state.events.length,
        phases: this.state.phases,
        events: this.state.events
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

  showEmptyState() {
    const content = document.getElementById('timelineContent');
    const empty = document.getElementById('noTimelineState');

    if (content) content.style.display = 'none';
    if (empty) empty.style.display = 'flex';
  },

  showLoadingState() {
    const content = document.getElementById('timelineContent');
    if (content) {
      content.innerHTML = `
        <div style="text-align: center; padding: 48px 24px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--primary-600); margin-bottom: 12px; display: block;"></i>
          <div style="color: var(--color-text-secondary);">Loading timeline...</div>
        </div>
      `;
    }
  },

  showContent() {
    const content = document.getElementById('timelineContent');
    const empty = document.getElementById('noTimelineState');

    if (empty) empty.style.display = 'none';
    if (content) content.style.display = 'block';

    this.render();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimelinePageEnhanced;
}
