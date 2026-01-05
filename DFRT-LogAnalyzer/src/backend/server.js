const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { errorHandler, asyncHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logging.middleware');
const { rateLimiter } = require('./middleware/rateLimit.middleware');
const { securityHeaders } = require('./middleware/security.middleware');
const { fileUploadValidator } = require('./middleware/upload.middleware');

// Initialize Express App
const app = express();

// Middleware Stack
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(morgan('combined'));
app.use(requestLogger);
app.use(securityHeaders);
app.use(rateLimiter);

// Body Parsing
app.use(express.json({ limit: process.env.JSON_LIMIT || '50mb' }));
app.use(express.urlencoded({ limit: process.env.URL_LIMIT || '50mb', extended: true }));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/static', express.static(path.join(__dirname, '../frontend')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
const logRoutes = require('./routes/logs.routes');
const analysisRoutes = require('./routes/analysis.routes');
const configRoutes = require('./routes/config.routes');
const reportRoutes = require('./routes/report.routes');

app.use('/api/logs', logRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/config', configRoutes);
app.use('/api/reports', reportRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`DFRT Log Analyzer Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database: ${process.env.DATABASE_URL}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
