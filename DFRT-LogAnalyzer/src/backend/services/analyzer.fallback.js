/**
 * DFRT Log Analyzer - JavaScript Fallback Analyzer (FIXED)
 * @file analyzer.fallback.js
 * Phase 1 Remediation: Algorithm verification, error handling, JSON serialization
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

class FallbackAnalyzer {
    constructor() {
        this.entries = [];
        this.result = null;
        this.options = {};
    }
    
    initialize(options) {
        // Validate options object
        if (!options || typeof options !== 'object') {
            options = {};
        }
        
        this.options = {
            enableBasicParsing: options.enableBasicParsing !== false,
            enableEventExtraction: options.enableEventExtraction !== false,
            enableLoginAnalysis: options.enableLoginAnalysis !== false,
            enableFailedLoginDetection: options.enableFailedLoginDetection !== false,
            enableBruteForceDetection: options.enableBruteForceDetection !== false,
            enableLogTamperingDetection: options.enableLogTamperingDetection !== false,
            enableCrossCorrelation: options.enableCrossCorrelation !== false,
            enableUserProfiling: options.enableUserProfiling !== false,
            enableTimelineReconstruction: options.enableTimelineReconstruction !== false,
            bruteForceThreshold: Math.max(1, parseInt(options.bruteForceThreshold) || 5),
            bruteForceWindowSeconds: Math.max(60, parseInt(options.bruteForceWindowSeconds) || 300)
        };
        
        this.entries = [];
        this.result = null;
        return true;
    }
    
    async analyzeFile(filePath) {
        const files = [filePath];
        return this.analyzeFiles(files);
    }
    
    async analyzeFiles(filePaths) {
        // FIXED: Validate input - Phase 1 Algorithm Verification
        if (!Array.isArray(filePaths)) {
            throw new Error('filePaths must be an array');
        }
        
        if (filePaths.length === 0) {
            throw new Error('No file paths provided for analysis');
        }
        
        // Validate each file path
        const validPaths = filePaths.filter(fp => {
            if (typeof fp !== 'string') return false;
            if (!fs.existsSync(fp)) return false;
            return true;
        });
        
        if (validPaths.length === 0) {
            throw new Error('No valid, accessible file paths provided');
        }

        const startTime = Date.now();
        const analysisId = `DFRT-${uuidv4().substring(0, 8)}-${Date.now()}`;
        
        this.entries = [];
        let totalEntries = 0;
        let normalEvents = 0;
        let warningEvents = 0;
        let criticalEvents = 0;
        const processedFiles = [];
        const failedFiles = [];
        
        // Process each file with proper error handling
        for (const filePath of filePaths) {
            if (!filePath || typeof filePath !== 'string') {
                failedFiles.push({ path: filePath, error: 'Invalid file path type' });
                continue;
            }
            
            if (!fs.existsSync(filePath)) {
                failedFiles.push({ path: filePath, error: 'File not found' });
                continue;
            }
            
            try {
                const entries = await this.parseLogFile(filePath);
                
                // FIXED: Type validation
                if (!Array.isArray(entries)) {
                    throw new Error('parseLogFile returned non-array result');
                }
                
                // FIXED: Handle empty files
                if (entries.length === 0) {
                    processedFiles.push(filePath);
                    continue;
                }
                
                this.entries.push(...entries);
                totalEntries += entries.length;
                processedFiles.push(filePath);
                
                // Count by severity with validation
                entries.forEach(entry => {
                    if (!entry || typeof entry !== 'object') return;
                    if (typeof entry.severity !== 'string') return;
                    
                    switch (entry.severity.toUpperCase()) {
                        case 'CRITICAL':
                        case 'ERROR':
                        case 'ALERT':
                            criticalEvents++;
                            break;
                        case 'WARNING':
                            warningEvents++;
                            break;
                        case 'INFO':
                        case 'NORMAL':
                        case 'DEBUG':
                        default:
                            normalEvents++;
                    }
                });
                
            } catch (error) {
                console.error(`[ANALYZER] Error processing file ${filePath}:`, error.message);
                failedFiles.push({ path: filePath, error: error.message });
            }
        }
        
        // FIXED: Only run threat detection if we have entries
        let threats = [];
        let userProfiles = [];
        let bruteForceAttacks = [];
        
        if (this.entries.length > 0) {
            if (this.options.enableLoginAnalysis && this.options.enableFailedLoginDetection) {
                threats = this.detectThreats();
            }
            
            if (this.options.enableUserProfiling) {
                userProfiles = this.buildUserProfiles();
            }
            
            if (this.options.enableBruteForceDetection) {
                bruteForceAttacks = this.detectBruteForce();
            }
        }
        
        const endTime = Date.now();
        const overallRiskScore = this.calculateRiskScore(threats);
        
        // FIXED: Ensure all data is JSON-serializable (no Sets, undefined values)
        this.result = {
            analysisId,
            success: processedFiles.length > 0,
            errorMessage: failedFiles.length > 0 ? `${failedFiles.length} file(s) could not be processed` : '',
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            processingTimeMs: endTime - startTime,
            totalFilesAnalyzed: filePaths.length,
            successfulFiles: processedFiles.length,
            failedFiles: failedFiles,
            totalEntriesParsed: totalEntries,
            statistics: {
                totalEntries: totalEntries,
                normalEvents: normalEvents,
                warningEvents: warningEvents,
                criticalEvents: criticalEvents
            },
            detectionSummary: {
                totalThreats: Array.isArray(threats) ? threats.length : 0,
                criticalThreats: (Array.isArray(threats) ? threats : []).filter(t => t && t.severity === 'CRITICAL').length,
                warningThreats: (Array.isArray(threats) ? threats : []).filter(t => t && t.severity === 'WARNING').length,
                overallRiskScore: Math.max(0, Math.min(1, overallRiskScore))
            },
            bruteForceAttacks: Array.isArray(bruteForceAttacks) ? bruteForceAttacks : [],
            threats: Array.isArray(threats) ? threats : [],
            userProfiles: Array.isArray(userProfiles) ? userProfiles : [],
            recommendations: this.generateRecommendations(threats, bruteForceAttacks)
        };
        
        return this.result;
    }
    
    async parseLogFile(filePath) {
        const entries = [];
        
        // FIXED: Validate file exists and is readable
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error('File does not exist');
            }
            
            const stats = fs.statSync(filePath);
            if (!stats.isFile()) {
                throw new Error('Path is not a file');
            }
        } catch (error) {
            throw new Error(`Cannot access file ${filePath}: ${error.message}`);
        }
        
        const fileStream = fs.createReadStream(filePath);
        
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        
        let lineNumber = 0;
        
        try {
            for await (const line of rl) {
                lineNumber++;
                
                // Skip empty lines
                if (!line || !line.trim()) continue;
                
                try {
                    const entry = this.parseLine(line, lineNumber);
                    if (entry) {
                        entries.push(entry);
                    }
                } catch (lineError) {
                    console.warn(`[PARSER] Error parsing line ${lineNumber}:`, lineError.message);
                    // Continue with next line instead of failing entire file
                }
            }
        } catch (streamError) {
            throw new Error(`Error reading file: ${streamError.message}`);
        }
        
        return entries;
    }
    
    parseLine(line, lineNumber) {
        // FIXED: Defensive string parsing with null checks
        if (!line || typeof line !== 'string') {
            return null;
        }
        
        const trimmed = line.trim();
        if (!trimmed) return null;
        
        // FIXED: Regex matches with safe groups
        const timestampMatch = trimmed.match(/(\\d{4}-\\d{2}-\\d{2}[\\sT]\\d{2}:\\d{2}:\\d{2})/) || [];
        const ipMatch = trimmed.match(/(\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b)/) || [];
        const userMatch = trimmed.match(/(?:user|username|account)[=:\\s]+['\"]?(\\w+)['\"]?/i) || [];
        const eventIdMatch = trimmed.match(/(?:event\\s*id|eventid)[=:\\s]+(\\d+)/i) || [];
        
        // Determine severity with case-insensitive matching
        let severity = 'NORMAL';
        const lowerLine = trimmed.toLowerCase();
        
        if (lowerLine.includes('critical') || lowerLine.includes('emergency') || lowerLine.includes('alert')) {
            severity = 'CRITICAL';
        } else if (lowerLine.includes('error') || lowerLine.includes('fail')) {
            severity = 'ERROR';
        } else if (lowerLine.includes('warn')) {
            severity = 'WARNING';
        } else if (lowerLine.includes('info') || lowerLine.includes('information')) {
            severity = 'INFO';
        }
        
        return {
            lineNumber: Math.max(1, lineNumber),
            timestamp: timestampMatch[1] || '',
            eventId: eventIdMatch[1] ? parseInt(eventIdMatch[1], 10) : 0,
            user: userMatch[1] || '',
            username: userMatch[1] || '',
            ipAddress: ipMatch[1] || '',
            severity: severity,
            message: trimmed.substring(0, 500),
            rawContent: line.substring(0, 1000)
        };
    }
    
    detectThreats() {
        // FIXED: Validate entries before processing
        if (!Array.isArray(this.entries) || this.entries.length === 0) {
            return [];
        }
        
        const threats = [];
        
        // FIXED: Detect failed logins with proper filtering
        if (this.options.enableFailedLoginDetection) {
            const failedLogins = this.entries.filter(e => {
                if (!e || typeof e.message !== 'string') return false;
                const msg = e.message.toLowerCase();
                return (msg.includes('failed') || msg.includes('failure')) && 
                       (msg.includes('login') || msg.includes('logon') || msg.includes('authentication'));
            });
            
            if (failedLogins.length > 5) {
                const sourceIP = failedLogins[0]?.ipAddress || 'unknown';
                const targetUser = failedLogins[0]?.user || 'unknown';
                
                threats.push({
                    type: 'BRUTE_FORCE',
                    severity: 'CRITICAL',
                    description: `Multiple failed login attempts detected (${failedLogins.length})`,
                    source: sourceIP,
                    target: targetUser,
                    ipAddress: sourceIP,
                    timestamp: failedLogins[0]?.timestamp || new Date().toISOString(),
                    confidenceScore: Math.min(0.95, 0.5 + (failedLogins.length * 0.05)),
                    recommendation: `Block source IP ${sourceIP} and reset affected account`,
                    relatedEntries: failedLogins.length
                });
            }
        }
        
        // FIXED: Detect log tampering with proper event filtering
        if (this.options.enableLogTamperingDetection) {
            const clearEvents = this.entries.filter(e => {
                if (!e || typeof e.message !== 'string') return false;
                const msg = e.message.toLowerCase();
                return msg.includes('cleared') || msg.includes('deleted') || msg.includes('purged') ||
                       (e.eventId === 1102); // Windows Log Clear event
            });
            
            if (clearEvents.length > 0) {
                threats.push({
                    type: 'LOG_TAMPERING',
                    severity: 'CRITICAL',
                    description: `Log tampering indicator: ${clearEvents.length} event(s) suggest log manipulation`,
                    source: 'System',
                    target: 'Logs',
                    timestamp: clearEvents[0]?.timestamp || new Date().toISOString(),
                    confidenceScore: 0.9,
                    recommendation: 'CRITICAL: Preserve remaining logs immediately and investigate',
                    relatedEntries: clearEvents.length
                });
            }
        }
        
        return threats;
    }
    
    detectBruteForce() {
        // FIXED: Validate entries and threshold
        if (!Array.isArray(this.entries) || this.entries.length === 0) {
            return [];
        }
        
        const threshold = Math.max(1, this.options.bruteForceThreshold);
        const attacks = [];
        const failedByIP = {};
        
        // Group failed attempts by IP
        this.entries.forEach(entry => {
            if (!entry || typeof entry.message !== 'string') return;
            
            const msg = entry.message.toLowerCase();
            if ((msg.includes('failed') || msg.includes('denied')) && entry.ipAddress) {
                if (!failedByIP[entry.ipAddress]) {
                    failedByIP[entry.ipAddress] = [];
                }
                failedByIP[entry.ipAddress].push(entry);
            }
        });
        
        // FIXED: Analyze patterns with proper threshold validation
        Object.keys(failedByIP).forEach(ip => {
            const attempts = failedByIP[ip];
            if (attempts.length >= threshold) {
                const startTime = attempts[0]?.timestamp || new Date().toISOString();
                const endTime = attempts[attempts.length - 1]?.timestamp || new Date().toISOString();
                
                attacks.push({
                    targetUser: attempts[0]?.user || 'unknown',
                    sourceIP: ip,
                    startTime: startTime,
                    endTime: endTime,
                    attemptCount: attempts.length,
                    accountLocked: attempts.some(e => 
                        (e.message || '').toLowerCase().includes('locked')
                    ),
                    confidenceScore: Math.min(0.99, Math.max(0.5, 0.5 + (attempts.length * 0.05))),
                    recommendation: `Block source IP ${ip}, reset affected passwords, enable MFA`,
                    relatedEntries: attempts.length
                });
            }
        });
        
        return attacks;
    }
    
    buildUserProfiles() {
        // FIXED: Validate entries array
        if (!Array.isArray(this.entries) || this.entries.length === 0) {
            return [];
        }
        
        const profiles = {};
        
        this.entries.forEach(entry => {
            // FIXED: Defensive object access
            if (!entry || typeof entry !== 'object') return;
            
            const user = entry.user || entry.username;
            if (!user || typeof user !== 'string' || user.trim() === '') return;
            
            const normalizedUser = user.toLowerCase();
            
            if (!profiles[normalizedUser]) {
                profiles[normalizedUser] = {
                    username: user,
                    totalActivities: 0,
                    failedLogins: 0,
                    successfulLogins: 0,
                    sourceIPs: new Set(),
                    firstSeen: entry.timestamp || '',
                    lastSeen: entry.timestamp || '',
                    riskScore: 0,
                    anomalies: [],
                    timeline: []
                };
            }
            
            const profile = profiles[normalizedUser];
            profile.totalActivities++;
            
            // FIXED: Safe IP address handling
            if (entry.ipAddress && typeof entry.ipAddress === 'string' && entry.ipAddress.trim()) {
                profile.sourceIPs.add(entry.ipAddress);
            }
            
            // FIXED: Timestamp comparison with type safety
            if (entry.timestamp && typeof entry.timestamp === 'string') {
                if (!profile.firstSeen || entry.timestamp < profile.firstSeen) {
                    profile.firstSeen = entry.timestamp;
                }
                if (entry.timestamp > profile.lastSeen) {
                    profile.lastSeen = entry.timestamp;
                }
            }
            
            // FIXED: Message parsing with null safety
            const message = (entry.message || '').toLowerCase();
            if (message.includes('failed') || message.includes('denied')) {
                profile.failedLogins++;
            } else if (message.includes('success') || message.includes('logged in') || message.includes('authenticated')) {
                profile.successfulLogins++;
            }
        });
        
        // FIXED: Convert Sets to Arrays (required for JSON serialization) + calculate scores
        return Object.values(profiles).map(profile => {
            const failRatio = profile.totalActivities > 0 
                ? profile.failedLogins / profile.totalActivities 
                : 0;
            
            const sourceIPCount = profile.sourceIPs instanceof Set ? profile.sourceIPs.size : profile.sourceIPs.length;
            
            // FIXED: Risk score calculation with proper bounds
            const baseScore = Math.min(1.0, Math.max(0,
                failRatio * 0.5 +
                (sourceIPCount > 3 ? 0.3 : 0) +
                (profile.failedLogins > 10 ? 0.2 : 0)
            ));
            
            profile.riskScore = baseScore;
            
            // Add anomalies with clear descriptions
            if (profile.failedLogins > 10) {
                profile.anomalies.push(`Elevated failed logins: ${profile.failedLogins}`);
            }
            if (sourceIPCount > 5) {
                profile.anomalies.push(`Unusual location activity: ${sourceIPCount} distinct IPs`);
            }
            if (failRatio > 0.5) {
                profile.anomalies.push('High failure rate detected');
            }
            
            // FIXED: Convert Set to Array for JSON serialization
            profile.sourceIPs = profile.sourceIPs instanceof Set 
                ? Array.from(profile.sourceIPs) 
                : (Array.isArray(profile.sourceIPs) ? profile.sourceIPs : []);
            
            return profile;
        });
    }
    
    calculateRiskScore(threats) {
        // FIXED: Validate threats array
        if (!Array.isArray(threats) || threats.length === 0) return 0;
        
        let score = 0;
        
        threats.forEach(threat => {
            // FIXED: Defensive threat object access
            if (!threat || typeof threat !== 'object') return;
            
            const severity = (threat.severity || threat.type || '').toUpperCase();
            const confidenceScore = threat.confidenceScore || 0.5;
            
            switch (severity) {
                case 'CRITICAL':
                case 'ALERT':
                    score += 0.3 * confidenceScore;
                    break;
                case 'WARNING':
                    score += 0.15 * confidenceScore;
                    break;
                case 'INFO':
                    score += 0.05 * confidenceScore;
                    break;
                default:
                    score += 0.02;
            }
        });
        
        // FIXED: Ensure score is within bounds [0, 1]
        return Math.max(0, Math.min(1.0, score));
    }
    
    generateRecommendations(threats, bruteForceAttacks) {
        // FIXED: Validate input arrays
        if (!Array.isArray(threats)) threats = [];
        if (!Array.isArray(bruteForceAttacks)) bruteForceAttacks = [];
        
        const recommendations = [];
        
        if (bruteForceAttacks.length > 0) {
            recommendations.push('Block source IPs involved in brute-force attacks');
            recommendations.push('Implement or enforce account lockout policies');
            recommendations.push('Enable multi-factor authentication (MFA)');
            recommendations.push('Review and harden password policies');
        }
        
        const hasTampering = threats.some(t => t && t.type === 'LOG_TAMPERING');
        if (hasTampering) {
            recommendations.push('⚠ CRITICAL: Preserve all remaining log evidence');
            recommendations.push('Implement centralized log forwarding (syslog, CEF)');
            recommendations.push('Enable file integrity monitoring (FIM)');
            recommendations.push('Investigate system access immediately');
        }
        
        const hasBruteForce = threats.some(t => t && t.type === 'BRUTE_FORCE');
        if (hasBruteForce && !bruteForceAttacks.some(b => b)) {
            recommendations.push('Review and strengthen authentication mechanisms');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('No critical issues detected - maintain current security monitoring');
        }
        
        return recommendations;
    }
    
    getEntries(filter = {}, limit = 1000) {
        // FIXED: Validate inputs and return empty array on failure
        if (!Array.isArray(this.entries)) return [];
        if (!filter || typeof filter !== 'object') filter = {};
        limit = typeof limit === 'number' && limit > 0 ? parseInt(limit) : 1000;
        
        let filtered = this.entries;
        
        // Apply filters with type safety
        if (filter.keyword && typeof filter.keyword === 'string' && filter.keyword.trim()) {
            const keyword = filter.keyword.toLowerCase().trim();
            filtered = filtered.filter(e => 
                e && e.message && e.message.toLowerCase().includes(keyword)
            );
        }
        
        if (filter.severity && typeof filter.severity === 'string') {
            const sev = filter.severity.toUpperCase();
            filtered = filtered.filter(e => e && (e.severity || '').toUpperCase() === sev);
        }
        
        if (filter.user && typeof filter.user === 'string' && filter.user.trim()) {
            const user = filter.user.toLowerCase();
            filtered = filtered.filter(e => 
                e && ((e.user || '').toLowerCase() === user || (e.username || '').toLowerCase() === user)
            );
        }
        
        if (filter.ip && typeof filter.ip === 'string' && filter.ip.trim()) {
            filtered = filtered.filter(e => e && e.ipAddress === filter.ip);
        }
        
        return filtered.slice(0, Math.max(1, limit));
    }
    
    buildTimeline(title = 'Security Incident Timeline') {
        // FIXED: Handle empty entries
        if (!Array.isArray(this.entries) || this.entries.length === 0) {
            return {
                id: `TL-${Date.now()}`,
                title: title || 'Security Incident Timeline',
                startTime: '',
                endTime: '',
                summary: 'No timeline events available',
                severity: 'INFO',
                confidenceScore: 0,
                events: [],
                mitigationSteps: []
            };
        }
        
        const events = this.entries
            .filter(e => e && e.severity && !['NORMAL', 'INFO', 'DEBUG'].includes((e.severity || '').toUpperCase()))
            .sort((a, b) => {
                const timeA = a.timestamp || '';
                const timeB = b.timestamp || '';
                return timeA.localeCompare(timeB);
            })
            .map(e => ({
                timestamp: e.timestamp || '',
                title: this.getEventTitle(e),
                description: (e.message || '').substring(0, 250),
                severity: e.severity || 'NORMAL',
                actor: e.user || e.username || 'Unknown',
                ipAddress: e.ipAddress || 'N/A',
                lineNumber: e.lineNumber || 0
            }));
        
        const hasCritical = events.some(e => e.severity === 'CRITICAL' || e.severity === 'ALERT');
        const hasWarning = events.some(e => e.severity === 'WARNING');
        
        return {
            id: `TL-${Date.now()}`,
            title: title || 'Security Incident Timeline',
            startTime: events.length > 0 ? events[0].timestamp : '',
            endTime: events.length > 0 ? events[events.length - 1].timestamp : '',
            summary: `Timeline contains ${events.length} significant event${events.length !== 1 ? 's' : ''}`,
            severity: hasCritical ? 'CRITICAL' : (hasWarning ? 'WARNING' : 'INFO'),
            confidenceScore: 0.75,
            events: events,
            eventCount: events.length,
            mitigationSteps: [
                'Review timeline events in chronological order',
                'Identify and remediate root cause',
                'Block compromised accounts and IP addresses',
                'Preserve evidence and document chain of custody',
                'Implement preventive measures to stop recurrence'
            ]
        };
    }
    
    getEventTitle(entry) {
        // FIXED: Safe message access
        const msg = (entry && entry.message || '').toLowerCase();
        
        if (msg.includes('failed') && (msg.includes('login') || msg.includes('logon'))) {
            return 'Failed Login Attempt';
        }
        if (msg.includes('success') && msg.includes('login')) {
            return 'Successful Login';
        }
        if (msg.includes('privilege') || msg.includes('elevated')) {
            return 'Privilege Escalation Event';
        }
        if (msg.includes('account') && msg.includes('lock')) {
            return 'Account Lockout Event';
        }
        if (msg.includes('access') || msg.includes('permission')) {
            return 'Access Control Event';
        }
        if (msg.includes('error') || msg.includes('fail')) {
            return 'Error/Failure Event';
        }
        
        return 'System Event';
    }
    
    exportToJson() {
        // FIXED: Ensure all data is JSON-serializable
        const result = this.result || {};
        
        try {
            const serialized = JSON.stringify(result, (key, value) => {
                // Convert Sets to Arrays
                if (value instanceof Set) {
                    return Array.from(value);
                }
                // Convert undefined to null
                if (value === undefined) {
                    return null;
                }
                // Ensure numbers are valid
                if (typeof value === 'number' && !isFinite(value)) {
                    return null;
                }
                return value;
            }, 2);
            
            return serialized;
        } catch (error) {
            console.error('[ANALYZER] JSON serialization error:', error);
            return JSON.stringify({
                error: 'Failed to serialize analysis results',
                analysisId: result.analysisId,
                timestamp: new Date().toISOString()
            }, null, 2);
        }
    }
    
    exportToCsv() {
        // FIXED: Handle empty entries and proper escaping
        if (!Array.isArray(this.entries) || this.entries.length === 0) {
            return '';
        }
        
        const headers = 'Timestamp,EventID,User,Source,IPAddress,Severity,Message\\n';
        
        const rows = this.entries.map(e => {
            // FIXED: Safe CSV escaping and value extraction
            const csvEscape = (val) => {
                if (val === null || val === undefined) return '""';
                const str = String(val);
                if (str.includes(',') || str.includes('\"') || str.includes('\\n')) {
                    return `"${str.replace(/\"/g, '""')}"`;
                }
                return str;
            };
            
            return [
                csvEscape(e.timestamp || ''),
                csvEscape(e.eventId || '0'),
                csvEscape(e.user || e.username || ''),
                csvEscape(e.source || ''),
                csvEscape(e.ipAddress || ''),
                csvEscape(e.severity || 'UNKNOWN'),
                csvEscape((e.message || '').substring(0, 1000))
            ].join(',');
        }).join('\\n');
        
        return headers + rows;
    }
    
    generateReport() {
        // FIXED: Validate result object before using
        if (!this.result || typeof this.result !== 'object') {
            return 'No analysis results available\n';
        }
        
        const result = this.result;
        const stats = result.statistics || {};
        const detection = result.detectionSummary || {};
        const recs = Array.isArray(result.recommendations) ? result.recommendations : [];
        
        const ruleLine = '================================================================================';
        const divLine = '--------------------------------------------------------------------------------';
        
        const lines = [
            '',
            ruleLine,
            '                    DFRT LOG ANALYZER - FORENSIC REPORT',
            ruleLine,
            '',
            `Analysis ID: ${result.analysisId || 'N/A'}`,
            `Generated:   ${new Date().toISOString()}`,
            `Duration:    ${result.processingTimeMs || 0} ms`,
            divLine,
            '                              EXECUTIVE SUMMARY',
            divLine,
            '',
            `Files Analyzed:     ${result.totalFilesAnalyzed || 0}`,
            `Successful:         ${result.successfulFiles || 0}`,
            `Failed:             ${result.failedFiles?.length || 0}`,
            `Total Entries:      ${result.totalEntriesParsed || 0}`,
            `Normal Events:      ${stats.normalEvents || 0}`,
            `Warning Events:     ${stats.warningEvents || 0}`,
            `Critical Events:    ${stats.criticalEvents || 0}`,
            `Threats Detected:   ${detection.totalThreats || 0}`,
            `Critical Threats:   ${detection.criticalThreats || 0}`,
            `Risk Score:         ${((detection.overallRiskScore || 0) * 100).toFixed(1)}%`,
            divLine,
            '                             RECOMMENDATIONS',
            divLine,
            ''
        ];
        
        if (recs.length > 0) {
            recs.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
        } else {
            lines.push('(No specific recommendations)');
        }
        
        lines.push('');
        lines.push(ruleLine);
        lines.push('                              END OF REPORT');
        lines.push(ruleLine);
        lines.push('');
        
        return lines.join('\n');
    }

    getProgress() {
        return {
            isRunning: false,
            percentComplete: 100,
            filesProcessed: Array.isArray(this.entries) && this.entries.length > 0 ? 1 : 0,
            totalFiles: 1,
            entriesProcessed: Array.isArray(this.entries) ? this.entries.length : 0,
            currentPhase: 'idle',
            statusMessage: 'Analysis ready',
            analysisId: this.result ? this.result.analysisId : null,
            timestamp: new Date().toISOString()
        };
    }
    
    reset() {
        this.entries = [];
        this.result = null;
        this.options = {};
    }
    
    getVersion() {
        return {
            version: '2.5.0',
            name: 'DFRT Log Analyzer',
            engine: 'JavaScript Fallback (Phase 1 Hardened)',
            timestamp: new Date().toISOString()
        };
    }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FallbackAnalyzer;
}
