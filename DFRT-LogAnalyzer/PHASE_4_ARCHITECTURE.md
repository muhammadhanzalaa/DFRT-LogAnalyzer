# DFRT Log Analyzer - Phase 4 Technical Stack & Architecture

## Technology Stack

### Backend Framework
- **Node.js**: Runtime environment (14+)
- **Express.js** (4.18.2): Web application framework
- **TypeScript**: Optional type safety (not implemented in Phase 4, ready for Phase 5)

### Database
- **SQLite 3** (5.1.6): Lightweight, serverless database
- **Parameterized Queries**: SQL injection prevention
- **Transactions**: ACID compliance

### Security
- **jsonwebtoken** (9.1.0): JWT authentication
- **helmet** (7.0.0): HTTP security headers
- **cors** (2.8.5): Cross-Origin Resource Sharing
- **express-rate-limit** (6.10.0): Rate limiting
- **bcryptjs**: Password hashing (ready for Phase 5)

### File Handling
- **multer** (1.4.5): File upload middleware
- **fs**: File system operations
- **path**: Path utilities

### Utilities
- **uuid** (9.0.0): Unique identifiers
- **dotenv** (16.3.1): Environment configuration
- **morgan** (1.10.0): Request logging

### Development Tools
- **nodemon** (3.0.1): Auto-reload server
- **jest** (29.7.0): Testing framework
- **supertest** (6.3.3): HTTP testing
- **eslint** (8.50.0): Code linting

## Architecture Layers

### 1. Presentation Layer (API)
**Responsibility**: Handle HTTP requests/responses
**Components**:
- Routes (logs, analysis, config, reports)
- Request validation
- Response formatting

**Files**:
- `routes/logs.routes.js`
- `routes/analysis.routes.js`
- `routes/config.routes.js`
- `routes/report.routes.js`

### 2. Middleware Layer
**Responsibility**: Request processing, security, logging
**Components**:
- Authentication (JWT)
- Authorization (roles)
- Error handling
- Request logging
- Rate limiting
- File upload
- Security headers

**Files**:
- `middleware/security.middleware.js`
- `middleware/error.middleware.js`
- `middleware/logging.middleware.js`
- `middleware/rateLimit.middleware.js`
- `middleware/upload.middleware.js`

### 3. Business Logic Layer (Services)
**Responsibility**: Core application logic
**Components**:
- Log analysis
- Report generation
- Database operations
- Data transformation

**Files**:
- `services/analyzer.service.js`
- `services/report.service.js`
- `services/database.service.js`

### 4. Data Access Layer
**Responsibility**: Database operations
**Components**:
- Query execution
- Transaction management
- Data validation
- Connection pooling

**Files**:
- `services/database.service.js`

### 5. Utilities Layer
**Responsibility**: Helper functions
**Components**:
- Input validation
- String sanitization
- Error classes
- Response formatting

**Files**:
- `utils/validation.js`

## Request Flow

```
HTTP Request
    ↓
Express Server
    ↓
Security Middleware
├─ CORS check
├─ Helmet headers
└─ Rate limiter
    ↓
Authentication Middleware
└─ JWT validation
    ↓
Request Logging
    ↓
File Upload Handler (if applicable)
    ↓
Route Handler
    ↓
Input Validation
    ↓
Service Layer
    ↓
Database Service
    ↓
SQLite Database
    ↓
Response Processing
    ↓
Error Handler (if error)
    ↓
Response Formatting
    ↓
HTTP Response
```

## Component Relationships

```
Routes
  ├── logs.routes.js
  │   ├─→ dbService.query/insert/update/delete
  │   ├─→ validation.validate*
  │   └─→ upload middleware
  │
  ├── analysis.routes.js
  │   ├─→ dbService.*
  │   ├─→ analyzerService.analyzeLog
  │   └─→ validation.validate*
  │
  ├── report.routes.js
  │   ├─→ dbService.query
  │   ├─→ reportService.generate*
  │   └─→ validation.validate*
  │
  └── config.routes.js
      ├─→ dbService.*
      └─→ validation.validate*

Services
  ├── database.service.js
  │   └─→ SQLite Database
  │
  ├── analyzer.service.js
  │   ├─→ FallbackAnalyzer
  │   ├─→ database.service
  │   └─→ Threat detection
  │
  └── report.service.js
      └─→ Report formatting

Middleware
  ├── security.middleware.js
  │   └─→ JWT validation
  │
  ├── error.middleware.js
  │   └─→ Error formatting
  │
  ├── logging.middleware.js
  │   └─→ File logging
  │
  ├── rateLimit.middleware.js
  │   └─→ Request throttling
  │
  └── upload.middleware.js
      └─→ File validation

Utilities
  └── validation.js
      ├─→ Field validation
      ├─→ Pattern matching
      └─→ String sanitization
```

## Database Schema Relationships

```
logs (1) ----M----> analysis (1) ----M----> threats
├─ id                  ├─ id                 ├─ id
├─ filename            ├─ logId (FK)         ├─ analysisId (FK)
├─ filePath            ├─ analysisType       ├─ threatType
├─ fileSize             ├─ status            ├─ severity
├─ lineCount            ├─ analysisData      ├─ description
├─ status              └─ createdAt           ├─ evidence
├─ uploadedAt                                ├─ resolved
└─ createdAt                                 └─ createdAt

audit_logs
├─ id
├─ action
├─ userId
├─ resourceId
├─ resourceType
├─ changes
└─ ipAddress

settings
├─ id
├─ key (UNIQUE)
├─ value
├─ type
└─ updatedAt
```

## Data Flow Examples

### Example 1: File Upload & Analysis
```
1. User uploads log file
   └─→ POST /api/logs/upload
       ├─ Multer validation
       ├─ File size check
       ├─ File type validation
       └─ Store in uploads/

2. System creates log record
   └─→ INSERT INTO logs (...)
       ├─ Filename
       ├─ File path
       ├─ File size
       └─ Created timestamp

3. User requests analysis
   └─→ POST /api/analysis
       ├─ Validate logId exists
       ├─ Create analysis record
       ├─ Call analyzer service
       ├─ Detect threats
       ├─ Insert threat records
       └─ Return results
```

### Example 2: Report Generation
```
1. User requests report
   └─→ GET /api/reports/:analysisId
       ├─ Fetch analysis record
       ├─ Fetch threat records
       ├─ Fetch log metadata
       ├─ Format response
       ├─ Generate recommendations
       └─ Return report JSON

2. User exports report
   └─→ GET /api/reports/:analysisId?format=csv
       ├─ Fetch data
       ├─ Call reportService.generateCSV()
       ├─ Format as CSV
       ├─ Set response headers
       └─ Stream CSV content
```

### Example 3: Configuration Management
```
1. User updates setting
   └─→ PUT /api/config/key
       ├─ Validate input
       ├─ Check if exists
       ├─ UPDATE or INSERT
       └─ Return updated value

2. System reads setting
   └─→ Anytime during request
       ├─ Query settings table
       ├─ Parse value by type
       └─ Use in logic
```

## API Method Patterns

### Create (POST)
```javascript
POST /resource
{
  "field1": "value1",
  "field2": "value2"
}

Response: 201 Created
{
  "success": true,
  "data": { id, ...fields }
}
```

### Read (GET)
```javascript
GET /resource               // List all
GET /resource?page=1&limit=10  // With pagination
GET /resource/:id           // Single item

Response: 200 OK
{
  "success": true,
  "data": [...]
}
```

### Update (PATCH)
```javascript
PATCH /resource/:id
{
  "field": "newValue"
}

Response: 200 OK
{
  "success": true,
  "data": { id, ...fields }
}
```

### Delete (DELETE)
```javascript
DELETE /resource/:id

Response: 200 OK
{
  "success": true,
  "message": "Resource deleted"
}
```

## Error Handling Strategy

```
Error Occurs
    ↓
Error Middleware
    ├─ Validation Error (400)
    ├─ Authentication Error (401)
    ├─ Authorization Error (403)
    ├─ Not Found (404)
    ├─ Conflict (409)
    ├─ Payload Too Large (413)
    └─ Server Error (500)
    ↓
Format Error Response
    ├─ success: false
    ├─ error: message
    ├─ statusCode: code
    └─ (development: stack trace)
    ↓
Send Response
    └─ HTTP Response with error
```

## Security Architecture

```
Request
    ↓
├─ Helmet Headers (CSP, X-Frame-Options, etc.)
├─ CORS Check (allowed origins)
├─ Rate Limiting (100 req/15min)
├─ JWT Validation (if protected route)
├─ Input Validation
│  ├─ Type checking
│  ├─ Length validation
│  ├─ Pattern matching
│  └─ Custom validators
├─ File Validation (if upload)
│  ├─ File type check
│  ├─ File size check
│  └─ Mime type check
└─ Parameterized Queries (SQL injection prevention)
```

## Performance Optimization

### Database Level
- **Indexes**: 5 strategic indexes on frequently queried columns
- **Parameterized Queries**: Prepared statements reuse
- **Connection Pooling**: Database connection reuse
- **Query Optimization**: Minimizing full table scans

### Application Level
- **Async/Await**: Non-blocking I/O operations
- **Middleware Efficiency**: Early request termination
- **Pagination**: Limiting result sets
- **Caching Ready**: Structure for Redis integration

### Network Level
- **Compression**: HTTP compression ready
- **CORS Headers**: Efficient preflight handling
- **Response Formatting**: Minimal JSON payloads

## Scalability Considerations

### Horizontal Scaling
- Stateless API (no session storage)
- Database as single source of truth
- Ready for load balancer
- Environment-based configuration

### Vertical Scaling
- Async operations (non-blocking)
- Database indexing
- Query optimization
- Connection pooling

### Future Enhancements
- Caching layer (Redis)
- Message queue (Bull, Agenda)
- Database replication
- CDN for static assets
- Microservices architecture

## Testing Architecture

### Unit Tests
- Service layer testing
- Validator testing
- Utility function testing

### Integration Tests
- API endpoint testing
- Database operation testing
- Middleware testing

### End-to-End Tests
- Complete workflow testing
- Authentication flow
- File upload flow
- Report generation

## Monitoring & Logging

### Application Logging
- Request/response logging
- Error logging
- Audit trail
- Performance metrics

### Database Monitoring
- Query performance
- Connection usage
- Index effectiveness
- Data integrity

### System Monitoring
- CPU usage
- Memory usage
- Disk space
- Network I/O

## Configuration Management

### Environment Variables
```
Server Config: PORT, NODE_ENV
Security: JWT_SECRET, JWT_EXPIRY
Database: DATABASE_URL
CORS: FRONTEND_URL, BACKEND_URL
Files: UPLOAD_DIR, MAX_FILE_SIZE, MAX_FILES
Rate Limiting: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS
```

### Runtime Configuration
- Settings database table
- Dynamic configuration updates
- Without server restart

## Deployment Architecture

### Development
- Local Node.js + SQLite
- npm run dev (with nodemon)

### Production
- Docker container
- Environment-based config
- Database persistence
- Reverse proxy (nginx)
- SSL/TLS encryption

### CI/CD Pipeline (Future)
- GitHub Actions
- Automated testing
- Docker image build
- Cloud deployment

## Technology Benefits

| Technology | Benefit |
|-----------|---------|
| Express.js | Lightweight, flexible, widely used |
| SQLite | Zero-setup, file-based, no server |
| JWT | Stateless auth, scalable |
| Helmet | Security headers, protection |
| Multer | Flexible file upload handling |
| Morgan | Request logging |
| Jest | Comprehensive testing |

## Limitations & Future Improvements

### Current Limitations
- Single SQLite database (no clustering)
- No caching layer
- Synchronous file I/O possible
- No message queue
- No microservices

### Phase 5+ Improvements
- Redis caching
- Message queue (Bull)
- Database migration tools
- Microservices support
- GraphQL API
- WebSocket support
- Container orchestration

---

**Version**: 3.0.0
**Architecture Version**: 1.0
**Last Updated**: January 2024
**Status**: Production Ready
