const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'api.log');

const formatLog = (timestamp, level, message, meta = '') => {
  return `[${timestamp}] ${level}: ${message} ${meta}\n`;
};

const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const meta = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // Log request
  const logMessage = formatLog(timestamp, 'INFO', `${req.method} ${req.path}`, JSON.stringify(meta));
  fs.appendFileSync(logFile, logMessage);

  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const responseTime = Date.now();
    const responseLog = formatLog(
      new Date(responseTime).toISOString(),
      'INFO',
      `Response ${req.method} ${req.path}`,
      `Status: ${res.statusCode}`
    );
    fs.appendFileSync(logFile, responseLog);
    return originalJson(data);
  };

  next();
};

const errorLogger = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorLog = formatLog(
    timestamp,
    'ERROR',
    error.message,
    JSON.stringify({ stack: error.stack, ...context })
  );
  fs.appendFileSync(logFile, errorLog);
};

module.exports = {
  requestLogger,
  errorLogger
};
