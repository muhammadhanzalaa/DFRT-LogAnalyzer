# DFRT Log Analyzer - Backend Quick Start Guide

## Installation & Setup

### Prerequisites
- Node.js 14+
- npm 6+
- SQLite 3

### 1. Install Dependencies

```bash
cd /workspaces/DFRT-LogAnalyzer/DFRT-LogAnalyzer

# Install all dependencies
npm install

# Or install backend dependencies only (if in src/backend directory)
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Key Settings**:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=sqlite:./dfrt.db
FRONTEND_URL=http://localhost:3000
```

### 3. Initialize Database

The database is automatically initialized on first server start. Tables and indexes are created automatically.

### 4. Start the Server

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

**Expected Output**:
```
DFRT Log Analyzer Backend running on port 5000
Environment: development
Database: sqlite:./dfrt.db
```

### 5. Verify Server is Running

```bash
# Health check
curl http://localhost:5000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 1234
}
```

## API Testing

### Using cURL

**Upload a Log File**:
```bash
curl -X POST http://localhost:5000/api/logs/upload \
  -F "logfile=@/path/to/logfile.log"
```

**List Logs**:
```bash
curl http://localhost:5000/api/logs
```

**Create Analysis**:
```bash
curl -X POST http://localhost:5000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"logId": 1, "analysisType": "comprehensive"}'
```

### Using Postman

1. **Import API Collection**:
   - Create new collection in Postman
   - Add requests for each endpoint
   - Use variables for `{{base_url}}`

2. **Set Environment Variables**:
   ```
   base_url: http://localhost:5000/api
   token: your-jwt-token
   ```

3. **Example Request**:
   ```
   GET {{base_url}}/logs
   Headers: Authorization: Bearer {{token}}
   ```

### Using REST Client (VS Code)

Create `requests.rest` file:
```http
### Upload log file
POST http://localhost:5000/api/logs/upload
Content-Type: multipart/form-data; boundary=----

------
Content-Disposition: form-data; name="logfile"; filename="test.log"

< ./test.log
------

### List logs
GET http://localhost:5000/api/logs

### Create analysis
POST http://localhost:5000/api/analysis
Content-Type: application/json

{
  "logId": 1,
  "analysisType": "comprehensive"
}
```

## Debugging

### Enable Debug Logging

```bash
# Run with debug output
DEBUG=* npm run dev

# Or run with specific debug scope
DEBUG=express* npm run dev
```

### Check Logs

```bash
# View API logs
tail -f logs/api.log

# Watch for errors
grep ERROR logs/api.log
```

### Database Inspection

```bash
# Open SQLite database directly
sqlite3 dfrt.db

# SQLite commands
sqlite> .tables
sqlite> .schema logs
sqlite> SELECT COUNT(*) FROM logs;
sqlite> .quit
```

### Common Issues

**Port Already in Use**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Database Locked**:
```bash
# Ensure no other instances are running
pkill -f "node src/backend/server.js"

# Remove lock files if any
rm -f dfrt.db-wal dfrt.db-shm
```

**JWT Token Expired**:
```bash
# Generate new token by re-authenticating
# Or update JWT_EXPIRY in .env file
JWT_EXPIRY=72h
```

## File Structure

```
src/backend/
├── server.js                 # Main application
├── middleware/               # Express middleware
│   ├── error.middleware.js   # Error handling
│   ├── logging.middleware.js # Request logging
│   ├── security.middleware.js # JWT, CORS
│   ├── rateLimit.middleware.js # Rate limiting
│   └── upload.middleware.js  # File upload
├── routes/                   # API route handlers
│   ├── logs.routes.js        # Log management
│   ├── analysis.routes.js    # Analysis endpoints
│   ├── config.routes.js      # Configuration
│   └── report.routes.js      # Report generation
├── services/                 # Business logic
│   ├── database.service.js   # Database abstraction
│   ├── analyzer.service.js   # Log analysis
│   └── report.service.js     # Report generation
└── utils/
    └── validation.js         # Input validation

Database:
├── dfrt.db                   # SQLite database
├── logs/                     # API logs
└── uploads/                  # Uploaded files
```

## API Endpoints Quick Reference

### Logs
- `POST /logs/upload` - Upload single file
- `POST /logs/upload-multiple` - Upload multiple files
- `GET /logs` - List logs
- `GET /logs/:id` - Get log details
- `GET /logs/:id/download` - Download file
- `PATCH /logs/:id` - Update log
- `DELETE /logs/:id` - Delete log

### Analysis
- `POST /analysis` - Create analysis
- `GET /analysis` - List analyses
- `GET /analysis/:id` - Get analysis details
- `PATCH /analysis/:id` - Update analysis
- `DELETE /analysis/:id` - Delete analysis

### Reports
- `GET /reports/:analysisId` - Generate report
- `GET /reports/:analysisId?format=csv` - CSV export
- `POST /reports/:analysisId/threats/:threatId/resolve` - Resolve threat
- `GET /reports/summary` - Statistics

### Config
- `GET /config` - List settings
- `GET /config/:key` - Get setting
- `PUT /config/:key` - Update setting
- `DELETE /config/:key` - Delete setting

### Health
- `GET /health` - Server health check

## Database Tables

```
logs           - Uploaded log files
analysis       - Analysis records (links to logs)
threats        - Detected threats (links to analysis)
audit_logs     - Audit trail
settings       - Application settings
```

## Performance Tips

1. **Use Pagination**: Always use `page` and `limit` parameters for large datasets
2. **Filter Results**: Use query parameters to filter data
3. **Index Usage**: Database queries automatically use indexes
4. **Async Operations**: All operations are non-blocking
5. **Caching**: Implement caching for frequently accessed reports

## Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Update `FRONTEND_URL` to actual domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/TLS
- [ ] Set strong upload limits
- [ ] Configure CORS appropriately
- [ ] Enable audit logging
- [ ] Regular database backups
- [ ] Monitor rate limiting
- [ ] Keep dependencies updated

## Testing

### Run Unit Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage
```bash
npm test -- --coverage
```

## Linting

### Check Code Style
```bash
npm run lint
```

### Fix Linting Issues
```bash
npm run lint -- --fix
```

## Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
NODE_ENV=production npm start
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t dfrt-backend:3.0.0 .
docker run -p 5000:5000 -e NODE_ENV=production dfrt-backend:3.0.0
```

## Monitoring

### API Metrics
- Requests per second
- Response times
- Error rates
- File upload statistics

### Database Metrics
- Query performance
- Connection usage
- Table sizes
- Index effectiveness

### System Metrics
- CPU usage
- Memory usage
- Disk space
- Log file size

## Support & Troubleshooting

For issues:
1. Check logs: `tail -f logs/api.log`
2. Verify database: `sqlite3 dfrt.db ".tables"`
3. Test API: `curl http://localhost:5000/api/health`
4. Check environment: `cat .env`
5. Verify permissions: `ls -la uploads/`

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [JWT Introduction](https://jwt.io/introduction)
- [REST API Best Practices](https://restfulapi.net/)

---

**Version**: 3.0.0
**Last Updated**: January 2024

For detailed API documentation, see [BACKEND_API_DOCS.md](./BACKEND_API_DOCS.md)
