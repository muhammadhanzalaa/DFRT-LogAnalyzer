# DFRT Log Analyzer - Backend API Documentation

## Overview

The DFRT Log Analyzer backend provides a comprehensive RESTful API for log file upload, analysis, threat detection, and report generation.

**Base URL**: `http://localhost:5000/api`

## Architecture

### Backend Stack
- **Framework**: Express.js (Node.js)
- **Database**: SQLite 3
- **Authentication**: JWT Tokens
- **Security**: Helmet.js, CORS, Rate Limiting
- **File Upload**: Multer
- **Logging**: Morgan + Custom Logging

### Database Schema

#### logs
```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY,
  filename TEXT NOT NULL,
  filePath TEXT NOT NULL,
  uploadedAt DATETIME,
  fileSize INTEGER,
  lineCount INTEGER,
  status TEXT,
  error TEXT,
  createdAt DATETIME
);
```

#### analysis
```sql
CREATE TABLE analysis (
  id INTEGER PRIMARY KEY,
  logId INTEGER NOT NULL,
  analysisType TEXT,
  startDate DATETIME,
  endDate DATETIME,
  threatLevel TEXT,
  suspiciousActivities INTEGER,
  analysisData TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (logId) REFERENCES logs(id)
);
```

#### threats
```sql
CREATE TABLE threats (
  id INTEGER PRIMARY KEY,
  analysisId INTEGER NOT NULL,
  threatType TEXT,
  severity TEXT (critical|high|medium|low),
  description TEXT,
  evidence TEXT,
  timestamp DATETIME,
  resolved BOOLEAN,
  resolutionNotes TEXT,
  createdAt DATETIME,
  FOREIGN KEY (analysisId) REFERENCES analysis(id)
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY,
  action TEXT,
  userId TEXT,
  resourceId INTEGER,
  resourceType TEXT,
  changes TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME
);
```

## API Endpoints

### Log Management

#### Upload Single Log File
```http
POST /logs/upload
Content-Type: multipart/form-data

Response: 201 Created
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 1,
    "filename": "system.log",
    "filepath": "/uploads/system-1234567890.log",
    "size": 102400,
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Upload Multiple Log Files
```http
POST /logs/upload-multiple
Content-Type: multipart/form-data

Response: 207 Multi-Status
{
  "success": true,
  "message": "3 of 3 files uploaded",
  "data": {
    "uploaded": [
      { "id": 1, "filename": "system.log", "size": 102400 }
    ],
    "errors": []
  }
}
```

#### List All Logs
```http
GET /logs?page=1&limit=10&status=uploaded

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": 1,
      "filename": "system.log",
      "filePath": "/uploads/system-1234567890.log",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "fileSize": 102400,
      "lineCount": 5000,
      "status": "uploaded"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Get Log Details
```http
GET /logs/:id

Response: 200 OK
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "system.log",
    "filePath": "/uploads/system-1234567890.log",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "fileSize": 102400,
    "lineCount": 5000,
    "status": "uploaded"
  }
}
```

#### Download Log File
```http
GET /logs/:id/download

Response: 200 OK
[Binary file content]
```

#### Update Log Metadata
```http
PATCH /logs/:id
Content-Type: application/json

{
  "lineCount": 5000
}

Response: 200 OK
{
  "success": true,
  "message": "Log updated successfully",
  "data": { ... }
}
```

#### Delete Log
```http
DELETE /logs/:id

Response: 200 OK
{
  "success": true,
  "message": "Log deleted successfully"
}
```

### Analysis

#### Create Analysis
```http
POST /analysis
Content-Type: application/json

{
  "logId": 1,
  "analysisType": "comprehensive"
}

Response: 201 Created
{
  "success": true,
  "message": "Analysis completed",
  "data": {
    "id": 1,
    "logId": 1,
    "analysisType": "comprehensive",
    "threatCount": 5,
    "threats": [
      {
        "type": "brute_force",
        "severity": "high",
        "description": "Potential brute force attack detected",
        "evidence": "{...}",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### List Analyses
```http
GET /analysis?logId=1&status=completed&page=1&limit=10

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": 1,
      "logId": 1,
      "analysisType": "comprehensive",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:31:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### Get Analysis Details
```http
GET /analysis/:id

Response: 200 OK
{
  "success": true,
  "data": {
    "id": 1,
    "logId": 1,
    "analysisType": "comprehensive",
    "status": "completed",
    "threats": [
      { ... }
    ]
  }
}
```

#### Update Analysis
```http
PATCH /analysis/:id
Content-Type: application/json

{
  "status": "completed",
  "analysisData": { "threatCount": 5 }
}

Response: 200 OK
{
  "success": true,
  "message": "Analysis updated",
  "data": { ... }
}
```

#### Delete Analysis
```http
DELETE /analysis/:id

Response: 200 OK
{
  "success": true,
  "message": "Analysis deleted"
}
```

### Reports

#### Generate Report
```http
GET /reports/:analysisId?format=json

Query Parameters:
- format: json (default), csv, pdf

Response: 200 OK
{
  "success": true,
  "data": {
    "metadata": {
      "id": "REPORT-1",
      "analysisId": 1,
      "generatedAt": "2024-01-15T10:31:00Z"
    },
    "summary": {
      "totalThreats": 5,
      "criticalThreats": 0,
      "highThreats": 2,
      "mediumThreats": 2,
      "lowThreats": 1
    },
    "threats": [ ... ],
    "recommendations": [
      "HIGH: Investigate and remediate high severity threats within 24 hours.",
      "Review access logs and update access control policies."
    ]
  }
}
```

#### Export Report (CSV)
```http
GET /reports/:analysisId?format=csv

Response: 200 OK
Content-Type: text/csv
[CSV formatted data]
```

#### Resolve Threat
```http
POST /reports/:analysisId/threats/:threatId/resolve
Content-Type: application/json

{
  "resolutionNotes": "Applied firewall rules to block source IP"
}

Response: 200 OK
{
  "success": true,
  "message": "Threat marked as resolved",
  "data": { ... }
}
```

#### Get Summary Statistics
```http
GET /reports/summary?startDate=2024-01-01&endDate=2024-01-31

Response: 200 OK
{
  "success": true,
  "data": {
    "totalAnalyses": 42,
    "threatsBySeverity": {
      "critical": 2,
      "high": 8,
      "medium": 15,
      "low": 12
    }
  }
}
```

### Configuration

#### Get All Settings
```http
GET /config

Response: 200 OK
{
  "success": true,
  "data": {
    "setting_key": "setting_value",
    ...
  }
}
```

#### Get Specific Setting
```http
GET /config/:key

Response: 200 OK
{
  "success": true,
  "data": {
    "key": "value"
  }
}
```

#### Update Setting
```http
PUT /config/:key
Content-Type: application/json

{
  "value": "new_value",
  "type": "string"
}

Response: 200 OK
{
  "success": true,
  "message": "Setting updated",
  "data": { ... }
}
```

#### Delete Setting
```http
DELETE /config/:key

Response: 200 OK
{
  "success": true,
  "message": "Setting deleted"
}
```

### Health Check

#### Server Health
```http
GET /health

Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600
}
```

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "details": "Additional error details"
}
```

### Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry |
| 413 | Payload Too Large | File size exceeds limit |
| 500 | Internal Server Error | Server error |

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

## Rate Limiting

- **Default Limit**: 100 requests per 15 minutes per IP
- **API Key Limit**: 300 requests per minute

Rate limit info is returned in response headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1705324200
```

## File Upload Restrictions

- **Max File Size**: 100 MB
- **Max Files**: 10 per request
- **Allowed Types**: .log, .txt, .csv, .json, .evtx, .xml

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Optional message",
  "data": { /* response data */ },
  "pagination": { /* optional pagination info */ }
}
```

## Pagination

Paginated endpoints support:
- `page` (default: 1)
- `limit` (default: 10, max: 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

## Database Indexing

Optimized indexes for common queries:
- `idx_logs_uploadedAt` - For filtering logs by upload time
- `idx_analysis_logId` - For retrieving analyses by log
- `idx_threats_analysisId` - For retrieving threats by analysis
- `idx_threats_severity` - For filtering threats by severity
- `idx_audit_logs_createdAt` - For audit trail queries

## Performance Considerations

1. **Database**: SQLite with indexed queries
2. **Pagination**: Use pagination for large result sets
3. **Caching**: Consider caching report results
4. **Async Operations**: Analysis runs asynchronously
5. **File Storage**: Organized by analysis ID for easy cleanup

## Security Features

1. **JWT Authentication** - Token-based authentication
2. **Rate Limiting** - Prevents API abuse
3. **Input Validation** - All inputs validated
4. **SQL Injection Prevention** - Parameterized queries
5. **CORS** - Restricted origin access
6. **Helmet.js** - HTTP security headers
7. **File Upload Validation** - Type and size checks
8. **Audit Logging** - All actions logged

## Development

### Environment Variables
See `.env.example` for required configuration.

### Database Migration
```bash
npm run migrate
```

### Running Tests
```bash
npm test
npm run test:watch
```

### Development Server
```bash
npm run dev
```

---

**Version**: 3.0.0
**Last Updated**: January 2024
