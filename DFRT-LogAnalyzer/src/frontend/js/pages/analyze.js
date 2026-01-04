/**
 * DFRT Log Analyzer - Enhanced Analyze Page with Full Wizard Support
 * @file pages/analyze.js
 */

const AnalyzePage = {
    state: {
        currentStep: 1,
        selectedLogType: null,
        files: [],
        isUploading: false,
        uploadProgress: 0,
        analysisName: '',
        analysisDescription: '',
        analysisOptions: {
            enableBasic: true,
            enableIntermediate: true,
            enableAdvanced: true,
            basicParsing: true,
            validation: true,
            timestampExtraction: true,
            eventExtraction: true,
            loginAnalysis: true,
            failedLoginDetection: true,
            userProfiling: true,
            bruteForceDetection: true,
            logTamperingDetection: true,
            crossCorrelation: true,
            timelineReconstruction: true,
            bruteForceThreshold: 5,
            bruteForceWindow: 300
        }
    },

    init() {
        console.log('Initializing Enhanced Analyze Page');
        this.setupUI();
        this.bindWizardEvents();
        this.bindFileUpload();
        this.bindLogTypeSelection();
        this.bindAnalysisOptions();
        this.resetWizard();
    },

    setupUI() {
        // Ensure all wizard panels are hidden initially
        document.querySelectorAll('.wizard-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Show first panel
        const firstPanel = document.querySelector('.wizard-panel[data-panel="1"]');
        if (firstPanel) {
            firstPanel.style.display = 'block';
        }
    },

    bindWizardEvents() {
        const nextBtn = document.getElementById('wizardNextBtn');
        const prevBtn = document.getElementById('wizardPrevBtn');
        const startBtn = document.getElementById('startAnalysisBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep());
        }
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startAnalysis());
        }

        this.updateWizardUI();
    },

    bindFileUpload() {
        const browseBtn = document.getElementById('browseFilesBtn');
        const fileInput = document.getElementById('fileInput');

        // File input change event
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files);
                    e.target.value = ''; // Reset input
                }
            });
        }

        // Browse button click
        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInput.click();
            });
        }

        // Upload zone drag and drop
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            // Highlight drop area when item is dragged over it
            ['dragenter', 'dragover'].forEach(eventName => {
                uploadZone.addEventListener(eventName, () => {
                    uploadZone.classList.add('drag-over');
                }, false);
            });

            // Un-highlight drop area when item is dragged away
            ['dragleave', 'drop'].forEach(eventName => {
                uploadZone.addEventListener(eventName, () => {
                    uploadZone.classList.remove('drag-over');
                }, false);
            });

            // Handle dropped files
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove('drag-over');
                
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    this.handleFileSelect(e.dataTransfer.files);
                }
            }, false);

            // Click to browse
            uploadZone.addEventListener('click', (e) => {
                if (e.target === uploadZone || uploadZone.contains(e.target)) {
                    if (!e.target.classList.contains('btn')) {
                        if (fileInput) fileInput.click();
                    }
                }
            });
        }

        // Clear all button
        const clearBtn = document.getElementById('clearAllFiles');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFiles());
        }
    },

    bindLogTypeSelection() {
        document.querySelectorAll('.log-type-card').forEach(card => {
            card.addEventListener('click', () => {
                const logType = card.dataset.type;
                this.selectLogType(logType);
            });
        });
    },

    bindAnalysisOptions() {
        const basicToggle = document.getElementById('enableBasic');
        const intermediateToggle = document.getElementById('enableIntermediate');
        const advancedToggle = document.getElementById('enableAdvanced');

        if (basicToggle) {
            basicToggle.addEventListener('change', (e) => {
                this.state.analysisOptions.enableBasic = e.target.checked;
                this.updateOptionsByCategory('basic', e.target.checked);
            });
        }

        if (intermediateToggle) {
            intermediateToggle.addEventListener('change', (e) => {
                this.state.analysisOptions.enableIntermediate = e.target.checked;
                this.updateOptionsByCategory('intermediate', e.target.checked);
            });
        }

        if (advancedToggle) {
            advancedToggle.addEventListener('change', (e) => {
                this.state.analysisOptions.enableAdvanced = e.target.checked;
                this.updateOptionsByCategory('advanced', e.target.checked);
            });
        }

        document.querySelectorAll('[name="options"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.state.analysisOptions[e.target.value] = e.target.checked;
            });
        });

        const thresholdInput = document.getElementById('bruteForceThreshold');
        const windowInput = document.getElementById('bruteForceWindow');

        if (thresholdInput) {
            thresholdInput.addEventListener('change', (e) => {
                this.state.analysisOptions.bruteForceThreshold = parseInt(e.target.value);
            });
        }

        if (windowInput) {
            windowInput.addEventListener('change', (e) => {
                this.state.analysisOptions.bruteForceWindow = parseInt(e.target.value);
            });
        }

        const nameInput = document.getElementById('analysisName');
        const descInput = document.getElementById('analysisDescription');

        if (nameInput) {
            nameInput.addEventListener('change', (e) => {
                this.state.analysisName = e.target.value;
            });
        }

        if (descInput) {
            descInput.addEventListener('change', (e) => {
                this.state.analysisDescription = e.target.value;
            });
        }
    },

    updateOptionsByCategory(category, enabled) {
        const categoryMap = {
            basic: ['basicParsing', 'validation', 'timestampExtraction'],
            intermediate: ['eventExtraction', 'loginAnalysis', 'failedLoginDetection', 'userProfiling'],
            advanced: ['bruteForceDetection', 'logTamperingDetection', 'crossCorrelation', 'timelineReconstruction']
        };

        if (categoryMap[category]) {
            categoryMap[category].forEach(option => {
                const checkbox = document.querySelector(`[value="${option}"]`);
                if (checkbox) {
                    checkbox.checked = enabled;
                    this.state.analysisOptions[option] = enabled;
                }
            });
        }
    },

    selectLogType(logType) {
        document.querySelectorAll('.log-type-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.type === logType);
        });

        this.state.selectedLogType = logType;
        document.getElementById('selectedLogType').value = logType;
        
        ToastManager.success(`Selected: ${logType.charAt(0).toUpperCase() + logType.slice(1)} Logs`);
    },

    handleFileSelect(files) {
        const maxFiles = 10;
        const maxSize = 100 * 1024 * 1024;

        Array.from(files).forEach(file => {
            if (file.size > maxSize) {
                ToastManager.error(`File ${file.name} exceeds 100MB limit`);
                return;
            }

            const allowedExts = ['.log', '.txt', '.csv', '.json', '.evtx', '.xml'];
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedExts.includes(ext)) {
                ToastManager.error(`File type ${ext} not supported`);
                return;
            }

            if (this.state.files.length >= maxFiles) {
                ToastManager.error(`Maximum ${maxFiles} files allowed`);
                return;
            }

            if (this.state.files.some(f => f.name === file.name && f.size === file.size)) {
                ToastManager.warning(`File ${file.name} already selected`);
                return;
            }

            this.state.files.push(file);
        });

        this.renderFileList();
        if (this.state.files.length > 0) {
            ToastManager.success(`${this.state.files.length} file(s) ready`);
        }
    },

    renderFileList() {
        const container = document.getElementById('filesList');
        const selectedFilesDiv = document.getElementById('selectedFiles');

        if (!container) return;

        if (this.state.files.length === 0) {
            if (selectedFilesDiv) selectedFilesDiv.style.display = 'none';
            return;
        }

        if (selectedFilesDiv) selectedFilesDiv.style.display = 'block';

        const fileCount = document.getElementById('fileCount');
        if (fileCount) fileCount.textContent = this.state.files.length;

        const totalSize = document.getElementById('totalFileSize');
        if (totalSize) totalSize.textContent = this.formatBytes(this.getTotalFileSize());

        const html = this.state.files.map((file, index) => `
            <div class="file-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--color-bg-secondary); border-radius: 6px; margin-bottom: 8px;">
                <div style="flex-shrink: 0;">
                    <i class="fas fa-file"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 500;">${file.name}</div>
                    <div style="font-size: 12px; color: var(--color-text-tertiary);">${this.formatBytes(file.size)}</div>
                </div>
                <button type="button" class="btn btn-icon" onclick="AnalyzePage.removeFile(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    removeFile(index) {
        this.state.files.splice(index, 1);
        this.renderFileList();
        ToastManager.info('File removed');
    },

    clearAllFiles() {
        if (this.state.files.length === 0) return;

        if (confirm(`Remove ${this.state.files.length} file(s)?`)) {
            this.state.files = [];
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.value = '';
            this.renderFileList();
            ToastManager.success('Files cleared');
        }
    },

    getTotalFileSize() {
        return this.state.files.reduce((total, file) => total + file.size, 0);
    },

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    nextStep() {
        if (this.state.currentStep < 4) {
            if (this.validateStep(this.state.currentStep)) {
                this.state.currentStep++;
                this.updateWizardUI();
            }
        }
    },

    previousStep() {
        if (this.state.currentStep > 1) {
            this.state.currentStep--;
            this.updateWizardUI();
        }
    },

    validateStep(step) {
        switch (step) {
            case 1:
                if (!this.state.selectedLogType) {
                    ToastManager.warning('Please select a log type');
                    return false;
                }
                return true;
            case 2:
                if (this.state.files.length === 0) {
                    ToastManager.warning('Please select files to analyze');
                    return false;
                }
                return true;
            case 3:
                if (!this.state.analysisName) {
                    const nameInput = document.getElementById('analysisName');
                    if (nameInput) {
                        this.state.analysisName = `Analysis ${new Date().toLocaleString()}`;
                        nameInput.value = this.state.analysisName;
                    }
                }
                return true;
            default:
                return true;
        }
    },

    updateWizardUI() {
        const currentStep = document.getElementById('currentStep');
        if (currentStep) currentStep.textContent = this.state.currentStep;

        document.querySelectorAll('.wizard-panel').forEach(panel => {
            panel.style.display = 'none';
            panel.classList.remove('active');
        });

        const currentPanel = document.querySelector(`.wizard-panel[data-panel="${this.state.currentStep}"]`);
        if (currentPanel) {
            currentPanel.style.display = 'block';
            currentPanel.classList.add('active');
        }

        document.querySelectorAll('.wizard-step').forEach((step, idx) => {
            const stepNum = idx + 1;
            step.classList.toggle('active', stepNum === this.state.currentStep);
            step.classList.toggle('completed', stepNum < this.state.currentStep);
        });

        const prevBtn = document.getElementById('wizardPrevBtn');
        const nextBtn = document.getElementById('wizardNextBtn');
        const startBtn = document.getElementById('startAnalysisBtn');

        if (prevBtn) prevBtn.disabled = this.state.currentStep === 1;
        
        if (this.state.currentStep === 4) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (startBtn) startBtn.style.display = 'inline-flex';
            this.updateReviewSummary();
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-flex';
            if (startBtn) startBtn.style.display = 'none';
        }
    },

    updateReviewSummary() {
        const reviewLogType = document.getElementById('reviewLogType');
        if (reviewLogType) {
            const typeLabel = this.state.selectedLogType?.charAt(0).toUpperCase() + 
                             this.state.selectedLogType?.slice(1);
            reviewLogType.textContent = typeLabel || '-';
        }

        const reviewFileCount = document.getElementById('reviewFileCount');
        if (reviewFileCount) {
            reviewFileCount.textContent = `${this.state.files.length} file${this.state.files.length !== 1 ? 's' : ''}`;
        }

        const reviewTotalSize = document.getElementById('reviewTotalSize');
        if (reviewTotalSize) {
            reviewTotalSize.textContent = this.formatBytes(this.getTotalFileSize());
        }

        const reviewFilesList = document.getElementById('reviewFilesList');
        if (reviewFilesList) {
            const filesHTML = this.state.files.map(file => `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--color-border-secondary);">
                    <i class="fas fa-file"></i>
                    <span style="flex: 1;">${file.name}</span>
                    <span style="font-size: 12px; color: var(--color-text-muted);">${this.formatBytes(file.size)}</span>
                </div>
            `).join('');
            reviewFilesList.innerHTML = filesHTML;
        }

        const reviewOptions = document.getElementById('reviewOptions');
        if (reviewOptions) {
            const enabledOptions = Object.keys(this.state.analysisOptions)
                .filter(key => this.state.analysisOptions[key] === true && typeof this.state.analysisOptions[key] === 'boolean')
                .slice(0, 6);

            const optionsHTML = enabledOptions.map(option => `
                <span style="display: inline-block; padding: 4px 12px; background: var(--primary-50); color: var(--primary-700); border-radius: 20px; font-size: 12px; margin-right: 8px; margin-bottom: 8px;">
                    ${option.replace(/([A-Z])/g, ' $1').trim()}
                </span>
            `).join('');
            reviewOptions.innerHTML = optionsHTML;
        }
    },

    resetWizard() {
        this.state.currentStep = 1;
        this.state.selectedLogType = null;
        this.state.files = [];
        this.state.analysisName = '';
        this.state.analysisDescription = '';
        this.renderFileList();
        this.updateWizardUI();
    },

    async startAnalysis() {
        // Validate step 3
        if (!this.validateStep(3)) {
            return;
        }

        // Check if files are selected
        if (this.state.files.length === 0) {
            ToastManager.error('No files selected for analysis');
            return;
        }

        if (this.state.isUploading) {
            ToastManager.warning('Analysis already in progress');
            return;
        }

        this.state.isUploading = true;
        const startBtn = document.getElementById('startAnalysisBtn');
        if (startBtn) startBtn.disabled = true;

        try {
            const formData = new FormData();
            
            // Add all files
            this.state.files.forEach(file => {
                formData.append('files', file);
            });

            // Add analysis metadata
            formData.append('name', this.state.analysisName || `Analysis ${new Date().toLocaleString()}`);
            formData.append('description', this.state.analysisDescription);
            formData.append('logType', this.state.selectedLogType);

            // Add all options with proper naming convention
            Object.entries(this.state.analysisOptions).forEach(([key, value]) => {
                // Convert analysisOptions keys to API format
                if (typeof value === 'boolean') {
                    const apiKey = 'enable' + key.charAt(0).toUpperCase() + key.slice(1);
                    formData.append(apiKey, value ? 'true' : 'false');
                } else {
                    formData.append(key, value);
                }
            });

            console.log('Starting analysis with files:', this.state.files.length);
            ToastManager.info('Uploading files and starting analysis...', 'Processing');
            ModalManager.loading(true, 'Analyzing Logs', 'This may take a few moments...');

            const response = await API.post('/analysis/start', formData, {
                isFormData: true
            });

            console.log('Analysis response:', response);

            if (response && response.success) {
                const analysisId = response.data?.analysisId;
                ToastManager.success('Analysis started successfully!');
                
                // Store analysis ID for reference
                if (analysisId) {
                    sessionStorage.setItem('lastAnalysisId', analysisId);
                }
                
                // Wait a moment then redirect to results
                setTimeout(() => {
                    ModalManager.loading(false);
                    window.location.hash = 'results';
                    this.resetWizard();
                }, 1500);
            } else {
                const errorMsg = response?.message || response?.error?.message || 'Analysis failed';
                console.error('Analysis error:', response);
                ToastManager.error(errorMsg);
                ModalManager.loading(false);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            ToastManager.error(error.message || 'Failed to start analysis');
            ModalManager.loading(false);
        } finally {
            this.state.isUploading = false;
            if (startBtn) startBtn.disabled = false;
        }
    }
};

window.AnalyzePage = AnalyzePage;
