/**
 * Report Service
 * Generates reports in various formats (JSON, CSV, PDF)
 */

const { AppError } = require('../middleware/error.middleware');

class ReportService {
  /**
   * Generate CSV report
   */
  async generateCSV(report) {
    try {
      const { metadata, summary, threats } = report;

      let csv = 'DFRT Log Analyzer - Threat Report\n';
      csv += `Generated: ${metadata.generatedAt}\n`;
      csv += `Analysis ID: ${metadata.analysisId}\n`;
      csv += `Log File: ${metadata.logFile}\n`;
      csv += `Analysis Type: ${metadata.analysisType}\n\n`;

      csv += 'SUMMARY\n';
      csv += `Total Threats,${summary.totalThreats}\n`;
      csv += `Critical,${summary.criticalThreats}\n`;
      csv += `High,${summary.highThreats}\n`;
      csv += `Medium,${summary.mediumThreats}\n`;
      csv += `Low,${summary.lowThreats}\n\n`;

      csv += 'THREATS\n';
      csv += 'ID,Type,Severity,Description,Timestamp,Resolved\n';

      threats.forEach(threat => {
        const desc = (threat.description || '').replace(/,/g, ';');
        csv += `${threat.id},"${threat.type}","${threat.severity}","${desc}","${threat.timestamp}",${threat.resolved ? 'Yes' : 'No'}\n`;
      });

      return csv;
    } catch (err) {
      throw new AppError(`CSV generation failed: ${err.message}`, 500);
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDF(report) {
    try {
      // Note: Full PDF generation requires additional libraries like pdfkit
      // For now, returning a basic HTML that can be printed to PDF
      const html = this.generateHTML(report);
      
      // In production, you would use a library like:
      // const PDFDocument = require('pdfkit');
      // const doc = new PDFDocument();
      // doc.fontSize(12).text(html);
      
      // For now, throw error and suggest using external service
      throw new AppError('PDF generation requires external service. Use HTML export instead.', 400);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(`PDF generation failed: ${err.message}`, 500);
    }
  }

  /**
   * Generate HTML report (can be printed to PDF)
   */
  generateHTML(report) {
    const { metadata, summary, threats, recommendations } = report;

    const severityColors = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#fbc02d',
      low: '#388e3c'
    };

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>DFRT Log Analyzer - Threat Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        h1 {
            color: #1976d2;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 10px;
        }
        h2 {
            color: #1976d2;
            margin-top: 30px;
        }
        .metadata {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        .summary-item {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            text-align: center;
        }
        .summary-item .number {
            font-size: 28px;
            font-weight: bold;
            color: #1976d2;
        }
        .summary-item .label {
            color: #666;
            font-size: 12px;
            margin-top: 5px;
        }
        .threat-item {
            border-left: 4px solid;
            padding: 10px;
            margin: 10px 0;
            background: #fafafa;
            border-radius: 4px;
        }
        .threat-item.critical { border-color: #d32f2f; }
        .threat-item.high { border-color: #f57c00; }
        .threat-item.medium { border-color: #fbc02d; }
        .threat-item.low { border-color: #388e3c; }
        .severity-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            margin: 5px 0;
        }
        .severity-badge.critical { background: #d32f2f; }
        .severity-badge.high { background: #f57c00; }
        .severity-badge.medium { background: #fbc02d; color: black; }
        .severity-badge.low { background: #388e3c; }
        .recommendation {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background: #1976d2;
            color: white;
        }
        .footer {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>DFRT Log Analyzer - Threat Report</h1>
    
    <div class="metadata">
        <strong>Report ID:</strong> ${metadata.id}<br>
        <strong>Generated:</strong> ${new Date(metadata.generatedAt).toLocaleString()}<br>
        <strong>Analysis ID:</strong> ${metadata.analysisId}<br>
        <strong>Log File:</strong> ${metadata.logFile}<br>
        <strong>Analysis Type:</strong> ${metadata.analysisType}
    </div>

    <h2>Executive Summary</h2>
    <div class="summary-grid">
        <div class="summary-item">
            <div class="number">${summary.totalThreats}</div>
            <div class="label">Total Threats</div>
        </div>
        <div class="summary-item">
            <div class number" style="color: #d32f2f;">${summary.criticalThreats}</div>
            <div class="label">Critical</div>
        </div>
        <div class="summary-item">
            <div class="number" style="color: #f57c00;">${summary.highThreats}</div>
            <div class="label">High</div>
        </div>
        <div class="summary-item">
            <div class="number" style="color: #fbc02d;">${summary.mediumThreats}</div>
            <div class="label">Medium</div>
        </div>
        <div class="summary-item">
            <div class="number" style="color: #388e3c;">${summary.lowThreats}</div>
            <div class="label">Low</div>
        </div>
    </div>

    <h2>Detected Threats</h2>
    ${threats.length > 0 ? threats.map(threat => `
        <div class="threat-item ${threat.severity}">
            <span class="severity-badge ${threat.severity}">${threat.severity.toUpperCase()}</span>
            <strong>${threat.type}</strong> - ${threat.description}<br>
            <small>Timestamp: ${threat.timestamp}</small>
        </div>
    `).join('') : '<p>No threats detected.</p>'}

    <h2>Recommendations</h2>
    ${recommendations.length > 0 ? recommendations.map(rec => `
        <div class="recommendation">${rec}</div>
    `).join('') : '<p>No specific recommendations.</p>'}

    <div class="footer">
        <p>This report was automatically generated by DFRT Log Analyzer v3.0.0</p>
    </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Validate report structure
   */
  validateReport(report) {
    if (!report.metadata || !report.summary || !Array.isArray(report.threats)) {
      throw new AppError('Invalid report structure', 400);
    }
    return true;
  }
}

// Singleton instance
const reportService = new ReportService();

module.exports = reportService;
