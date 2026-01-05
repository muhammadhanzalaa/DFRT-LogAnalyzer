# DFRT Log Analyzer

A comprehensive Digital Forensics and Incident Response (DFRT) log analysis platform for detecting threats, analyzing patterns, and investigating security incidents in digital forensics investigations.

## Overview

The DFRT Log Analyzer is a full-stack application that provides powerful log analysis, threat detection, and incident response capabilities. It combines advanced pattern matching, machine learning, and forensic techniques to identify security threats and anomalies in system logs.

**Current Version:** 3.0.0  
**Status:** Production Ready  
**License:** MIT

## Features

### Core Capabilities

- **Advanced Log Analysis**: Parse and analyze multiple log file formats (Windows Event Logs, Syslog, Apache, Nginx, JSON, Generic)
- **Threat Detection**: Detect brute force attacks, privilege escalations, unauthorized access, and suspicious activities
- **Real-time Processing**: Process large log files efficiently with streaming analysis
- **Report Generation**: Generate comprehensive PDF reports with findings and recommendations
- **Multi-user Support**: Role-based access control (Admin, Analyst, User)
- **Dashboard**: Real-time statistics and visualization of detected threats
- **Timeline Reconstruction**: Visual timeline of events for incident investigation

### Technical Features

- **RESTful API**: Complete REST API for programmatic access
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Built-in rate limiting for API protection
- **Input Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Structured error responses and logging
- **Database**: SQLite with proper schema and indexing
- **CORS Support**: Cross-origin resource sharing for web clients
- **Security Headers**: Helmet.js integration for HTTP security headers

## Technology Stack

### Backend
- **Runtime**: Node.js v14+
- **Framework**: Express.js 4.18.2
- **Database**: SQLite 3
- **Security**: JWT, bcryptjs, helmet
- **File Handling**: Multer for uploads
- **PDF Generation**: PDFKit
- **Rate Limiting**: express-rate-limit

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables
- **JavaScript**: Vanilla JS with modular architecture
- **Libraries**: Core utilities and UI components

### Development
- **Testing**: Jest with supertest
- **Linting**: ESLint
- **Process Management**: Nodemon (development)

## Project Structure

```
DFRT-LogAnalyzer/
├── src/
│   ├── backend/
│   │   ├── index.js                 # Main entry point
│   │   ├── server.js               # Alternative server entry
│   │   ├── middleware/             # Express middleware
│   │   ├── routes/                 # API route handlers
│   │   ├── services/               # Business logic
│   │   ├── utils/                  # Utility functions
│   │   ├── database/               # Database connection
│   │   └── __tests__/              # Backend tests
│   │
│   └── frontend/
│       ├── index.html              # Main dashboard
│       ├── analyze.html            # Log upload/analysis
│       ├── results.html            # Analysis results
│       ├── threats.html            # Threat listing
│       ├── timeline.html           # Event timeline
│       ├── settings.html           # User settings
│       ├── css/                    # Stylesheets
│       ├── js/                     # Frontend modules
│       └── __tests__/              # Frontend tests
│
├── package.json                    # Node.js dependencies
├── .env                           # Environment configuration
├── .env.example                   # Example configuration
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## Installation

### Prerequisites

- Node.js v14.0.0 or higher
- npm v6.0.0 or higher
- SQLite 3 (usually included with Node.js)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd DFRT-LogAnalyzer/DFRT-LogAnalyzer
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the backend server**
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

5. **Access the frontend**

Open your browser to `http://localhost:5000/api/static/index.html` or serve the frontend files through a static server.

## Configuration

The application uses environment variables for configuration. See `.env.example` for all available options:

### Key Configuration Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# Database
DATABASE_URL=sqlite:./dfrt.db

# CORS
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
MAX_FILES=10

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs

# Analysis
ANALYSIS_TIMEOUT=3600000
MAX_LOG_ENTRIES=100000
```

## API Documentation

### Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Core Endpoints

#### Analysis Management

- `POST /api/analysis` - Create new analysis
- `GET /api/analysis` - List analyses
- `GET /api/analysis/:id` - Get analysis details
- `GET /api/analysis/:id/entries` - Get log entries
- `GET /api/analysis/:id/threats` - Get detected threats
- `PATCH /api/analysis/:id` - Update analysis

#### Logs

- `POST /api/logs` - Upload log file
- `GET /api/logs` - List logs
- `GET /api/logs/:id` - Get log details

#### Reports

- `POST /api/reports` - Generate report
- `GET /api/reports` - List reports
- `GET /api/reports/:id` - Get report

#### Configuration

- `GET /api/config` - Get system configuration
- `POST /api/config` - Update configuration

#### Health

- `GET /api/health` - Health check endpoint

### Response Format

All API responses follow a standard JSON format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Usage Guide

### Analyzing Logs

1. Navigate to the "Analyze" section
2. Upload one or more log files
3. Select analysis type (quick, comprehensive)
4. Configure analysis options
5. Click "Start Analysis"
6. View results in real-time or navigate to Results page

### Viewing Threats

1. Go to the "Threats" section
2. View detected threats by severity
3. Filter by threat type or severity level
4. Click on threats for detailed investigation
5. Export findings to PDF report

### Timeline View

1. Navigate to "Timeline" section
2. View events in chronological order
3. Filter by date range or event type
4. Identify patterns and correlations
5. Export timeline for reporting

## Development

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Development Server

```bash
# Start with auto-reload
npm run dev
```

### Linting

```bash
npm run lint
```

## Database

The application uses SQLite with the following schema:

### Tables

- **users**: User accounts and authentication
- **analyses**: Analysis tasks and metadata
- **log_entries**: Parsed log entries
- **threats**: Detected threats and anomalies
- **reports**: Generated reports
- **audit_logs**: System audit trail (if implemented)

### Database Management

```bash
# Database file location
./dfrt.db

# Manual initialization
node src/backend/services/database.service.js
```

## Security

### Security Features

- **JWT Authentication**: Token-based user authentication
- **Password Hashing**: bcryptjs for secure password storage
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: HTTP security headers
- **Rate Limiting**: Request throttling to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries

### Best Practices

1. **Change Default JWT Secret**: Always update `JWT_SECRET` in production
2. **Use HTTPS**: Deploy with SSL/TLS certificates
3. **Secure Database**: Use strong database passwords
4. **Limit File Uploads**: Configure `MAX_FILE_SIZE` appropriately
5. **Regular Backups**: Maintain database backups
6. **Monitor Logs**: Check application and system logs regularly

## Deployment

### Production Setup

1. **Environment Configuration**
```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
```

2. **Database**
- Use production database configuration
- Implement automated backups
- Monitor database performance

3. **Process Management**
- Use PM2 or similar for process management
```bash
npm install -g pm2
pm2 start src/backend/server.js --name "dfrt-analyzer"
```

4. **Reverse Proxy**
- Use Nginx or Apache for SSL/TLS
- Configure proper headers
- Enable compression

5. **Logging & Monitoring**
- Configure centralized logging
- Monitor application performance
- Set up alerting

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Database Connection Error**
- Verify `DATABASE_URL` in .env
- Check database file permissions
- Ensure database directory exists

**Missing Dependencies**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Authentication Failures**
- Verify JWT_SECRET is set
- Check token expiration
- Validate token format

## Performance

### Optimization Tips

- **File Size Limits**: Configure appropriate `MAX_FILE_SIZE`
- **Pagination**: Use pagination for large datasets
- **Indexing**: Database indexes are configured on key fields
- **Caching**: Implement response caching for frequently accessed data
- **Compression**: gzip compression enabled for responses

### Scaling

- **Horizontal Scaling**: Use load balancer with multiple instances
- **Database Clustering**: Consider database replication
- **CDN**: Serve static assets through CDN
- **Queue System**: Use job queue for background processing

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support & Resources

- **Documentation**: See documentation files in project root
- **API Docs**: [BACKEND_API_DOCS.md](./BACKEND_API_DOCS.md)
- **Quick Start**: [BACKEND_QUICKSTART.md](./BACKEND_QUICKSTART.md)
- **Issue Tracker**: GitHub Issues

## Project History

- **Phase 1**: Initial setup and core analyzer
- **Phase 2**: Database integration and API development
- **Phase 3**: Frontend development and UI/UX
- **Phase 4**: Optimization, testing, and bug fixes
- **Phase 5**: Integration, testing, and finalization

## Acknowledgments

Developed as a comprehensive DFRT (Digital Forensics and Incident Response) solution for security professionals and forensic analysts.

---

**Version**: 3.0.0  
**Last Updated**: January 5, 2026  
**Status**: Production Ready ✓
