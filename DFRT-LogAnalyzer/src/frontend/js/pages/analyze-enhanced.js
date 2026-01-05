/**
 * DFRT Log Analyzer - Enhanced Analyze Page
 * Modern wizard-based log file upload and analysis configuration
 */

const AnalyzePageEnhanced = {
    state: {
        currentStep: 1,
        selectedLogType: null,
        files: [],
        analysisName: '',
        analysisDescription: '',
        enableBasic: true,
        enableIntermediate: true,
        enableAdvanced: true,
        bruteForceThreshold: 5,
        bruteForceWindow: 300
    },
    
    init() {
        console.log('Initializing Enhanced Analyze Page');
        this.bindEvents();
        this.setupDragDrop();
        this.updateStepUI();
    },
    
    bindEvents() {
        // File upload
        const browseBtn = document.getElementById('browseFilesBtn');
        const fileInput = document.getElementById('fileInput');
        const clearAllBtn = document.getElementById('clearAllFiles');
        
        if (browseBtn) browseBtn.addEventListener('click', () => fileInput?.click());
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        if (clearAllBtn) clearAllBtn.addEventListener('click', () => this.clearAllFiles());
        
        // Log type selection
        document.querySelectorAll('.log-type-card').forEach(card => {
            card.addEventListener('click', () => this.selectLogType(card.dataset.type));
        });
        
        // Analysis options
        ['enableBasic', 'enableIntermediate', 'enableAdvanced'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.addEventListener('change', (e) => {
                this.state[id] = e.target.checked;
            });
        });
        
        // Other inputs
        const nameInput = document.getElementById('analysisName');
        const descInput = document.getElementById('analysisDescription');
        const thresholdInput = document.getElementById('bruteForceThreshold');
        const windowInput = document.getElementById('bruteForceWindow');
        
        if (nameInput) nameInput.addEventListener('input', (e) => {
            this.state.analysisName = e.target.value;
        });
        if (descInput) descInput.addEventListener('input', (e) => {
            this.state.analysisDescription = e.target.value;
        });
        if (thresholdInput) thresholdInput.addEventListener('input', (e) => {
            this.state.bruteForceThreshold = parseInt(e.target.value) || 5;
        });
        if (windowInput) windowInput.addEventListener('input', (e) => {
            this.state.bruteForceWindow = parseInt(e.target.value) || 300;
        });
        
        // Wizard buttons
        const nextBtn = document.getElementById('wizardNextBtn');
        const prevBtn = document.getElementById('wizardPrevBtn');
        const cancelBtn = document.getElementById('wizardCancelBtn');
        const startBtn = document.getElementById('startAnalysisBtn');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousStep());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancel());
        if (startBtn) startBtn.addEventListener('click', () => this.startAnalysis());
    },
    
    setupDragDrop() {
        const uploadZone = document.getElementById('uploadZone');
        if (!uploadZone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.remove('drag-over');
            });
        });
        
        uploadZone.addEventListener('drop', (e) => {
            if (e.dataTransfer?.files) {
                this.handleFileSelect(e.dataTransfer.files);
            }
        });
    },
    
    handleFileSelect(files) {
        for (const file of files) {
            // Validate file size
            if (file.size > CONFIG.UI.MAX_FILE_SIZE) {
                UINotifications.showError('File Too Large',
                    `${file.name} exceeds maximum size of ${Utils.formatBytes(CONFIG.UI.MAX_FILE_SIZE)}`);
                continue;
            }
            
            // Check if file already added
            if (this.state.files.some(f => f.name === file.name)) {
                UINotifications.showWarning('Duplicate File', `${file.name} is already added`);
                continue;
            }
            
            // Check max files
            if (this.state.files.length >= CONFIG.UI.MAX_FILES) {
                UINotifications.showWarning('Too Many Files',
                    `Maximum ${CONFIG.UI.MAX_FILES} files allowed`);
                break;
            }
            
            this.state.files.push(file);
        }
        
        this.updateFileList();
        if (this.state.files.length > 0) {
            UINotifications.showSuccess('Files Added', `${this.state.files.length} file(s) selected`);
        }
    },
    
    updateFileList() {
        const container = document.getElementById('fileListContainer');
        const list = document.getElementById('fileList');
        
        if (!list || !container) return;
        
        if (this.state.files.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        list.innerHTML = this.state.files.map((file, idx) => `
            <div class="card" style="padding: var(--space-3); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: var(--font-weight-medium);">${Utils.escapeHtml(file.name)}</div>
                    <div style="font-size: 0.875rem; color: var(--text-tertiary);">${Utils.formatBytes(file.size)}</div>
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="AnalyzePageEnhanced.removeFile(${idx})">
                    Remove
                </button>
            </div>
        `).join('');
    },
    
    removeFile(index) {
        this.state.files.splice(index, 1);
        this.updateFileList();
    },
    
    clearAllFiles() {
        if (this.state.files.length === 0) return;
        
        UINotifications.confirm('Clear All Files?', 
            `Are you sure you want to remove all ${this.state.files.length} file(s)?`
        ).then(confirmed => {
            if (confirmed) {
                this.state.files = [];
                this.updateFileList();
                UINotifications.showInfo('Cleared', 'All files removed');
            }
        });
    },
    
    selectLogType(type) {
        this.state.selectedLogType = type;
        
        // Update UI
        document.querySelectorAll('.log-type-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.type === type);
        });
        
        // Move to next step if not already there
        if (this.state.currentStep === 2) {
            UINotifications.showSuccess('Selected', `${type} log type selected`);
        }
    },
    
    nextStep() {
        // Validate current step
        if (!this.validateStep(this.state.currentStep)) {
            return;
        }
        
        // Move to next step
        if (this.state.currentStep < 4) {
            this.state.currentStep++;
            this.updateStepUI();
            
            // Auto-focus first input
            const firstInput = document.querySelector(
                `.wizard-step[data-step="${this.state.currentStep}"] input:first-of-type,
                 .wizard-step[data-step="${this.state.currentStep}"] textarea:first-of-type`
            );
            if (firstInput) setTimeout(() => firstInput.focus(), 300);
        }
    },
    
    previousStep() {
        if (this.state.currentStep > 1) {
            this.state.currentStep--;
            this.updateStepUI();
        }
    },
    
    validateStep(step) {
        switch (step) {
            case 1: // Upload Files
                if (this.state.files.length === 0) {
                    UINotifications.showError('No Files Selected', 'Please select at least one file to analyze');
                    return false;
                }
                return true;
            
            case 2: // Log Type
                if (!this.state.selectedLogType) {
                    UINotifications.showError('Log Type Not Selected', 'Please select a log file type');
                    return false;
                }
                return true;
            
            case 3: // Analysis Options
                if (!this.state.analysisName.trim()) {
                    UINotifications.showError('Analysis Name Required', 'Please enter an analysis name');
                    return false;
                }
                return true;
            
            default:
                return true;
        }
    },
    
    updateStepUI() {
        // Show/hide wizard steps
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.style.display = step.dataset.step === String(this.state.currentStep) ? 'block' : 'none';
        });
        
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach(indicator => {
            const step = parseInt(indicator.dataset.step);
            indicator.classList.toggle('active', step <= this.state.currentStep);
        });
        
        // Update buttons
        const prevBtn = document.getElementById('wizardPrevBtn');
        const nextBtn = document.getElementById('wizardNextBtn');
        const startBtn = document.getElementById('startAnalysisBtn');
        
        if (prevBtn) prevBtn.style.display = this.state.currentStep > 1 ? 'inline-flex' : 'none';
        if (nextBtn) nextBtn.style.display = this.state.currentStep < 4 ? 'inline-flex' : 'none';
        if (startBtn) startBtn.style.display = this.state.currentStep === 4 ? 'inline-flex' : 'none';
        
        // Update review section if on step 4
        if (this.state.currentStep === 4) {
            this.updateReview();
        }
    },
    
    updateReview() {
        // Files review
        const filesReview = document.getElementById('reviewFiles');
        if (filesReview) {
            filesReview.innerHTML = this.state.files.map(file =>
                `<div style="padding: var(--space-2) 0; border-bottom: 1px solid var(--border-color-primary);">
                    <div style="font-weight: var(--font-weight-medium);">${Utils.escapeHtml(file.name)}</div>
                    <div style="font-size: 0.875rem; color: var(--text-tertiary);">${Utils.formatBytes(file.size)}</div>
                </div>`
            ).join('');
        }
        
        // Configuration review
        document.getElementById('reviewLogType').textContent = this.state.selectedLogType || '-';
        document.getElementById('reviewAnalysisName').textContent = this.state.analysisName || 'Not specified';
        
        const levels = [];
        if (this.state.enableBasic) levels.push('Basic');
        if (this.state.enableIntermediate) levels.push('Intermediate');
        if (this.state.enableAdvanced) levels.push('Advanced');
        document.getElementById('reviewLevels').textContent = levels.join(', ') || 'None';
        
        document.getElementById('reviewThreshold').textContent = this.state.bruteForceThreshold;
    },
    
    async startAnalysis() {
        if (!this.validateStep(4)) {
            return;
        }
        
        // Show loading
        const loadingId = UINotifications.showLoading('Starting analysis...');
        
        try {
            // Prepare form data
            const formData = new FormData();
            
            // Add files
            this.state.files.forEach(file => {
                formData.append('files', file);
            });
            
            // Add configuration
            formData.append('analysisName', this.state.analysisName);
            formData.append('analysisDescription', this.state.analysisDescription);
            formData.append('logType', this.state.selectedLogType);
            formData.append('analysisOptions', JSON.stringify({
                enableBasic: this.state.enableBasic,
                enableIntermediate: this.state.enableIntermediate,
                enableAdvanced: this.state.enableAdvanced,
                bruteForceThreshold: this.state.bruteForceThreshold,
                bruteForceWindowSeconds: this.state.bruteForceWindow
            }));
            
            // Send to backend
            const response = await API.post('/api/analysis/start', {}, {
                headers: { /* FormData headers will be set automatically */ }
            });
            
            // For now, show success message
            UINotifications.removeToast(loadingId);
            UINotifications.showSuccess('Analysis Started',
                `Analysis "${this.state.analysisName}" has been queued for processing`);
            
            // Save to localStorage
            const analysis = {
                id: Utils.generateUUID(),
                name: this.state.analysisName,
                description: this.state.analysisDescription,
                logType: this.state.selectedLogType,
                fileCount: this.state.files.length,
                createdAt: new Date().toISOString(),
                status: 'processing'
            };
            
            const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
            analyses.push(analysis);
            localStorage.setItem('analyses', JSON.stringify(analyses));
            
            // Redirect to results
            setTimeout(() => {
                window.location.href = 'results.html?analysisId=' + analysis.id;
            }, 1500);
            
        } catch (error) {
            UINotifications.removeToast(loadingId);
            console.error('Analysis start error:', error);
            UINotifications.showError('Analysis Failed',
                error.message || 'Failed to start analysis. Please try again.');
        }
    },
    
    cancel() {
        UINotifications.confirm('Cancel Analysis Setup?',
            'You will lose all unsaved changes. Continue?'
        ).then(confirmed => {
            if (confirmed) {
                window.location.href = 'index.html';
            }
        });
    }
};
