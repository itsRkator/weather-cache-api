/**
 * Request logging middleware
 */

const morgan = require('morgan');

/**
 * Custom morgan token for response time
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
             (res._startAt[1] - req._startAt[1]) * 1e-6;
  
  return ms.toFixed(3);
});

/**
 * Custom morgan format for development
 */
const devFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

/**
 * Custom morgan format for production
 */
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms';

/**
 * Get appropriate morgan format based on environment
 */
const getMorganFormat = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? devFormat : prodFormat;
};

/**
 * Request logger middleware
 */
const requestLogger = morgan(getMorganFormat(), {
  skip: (req, res) => {
    // Skip logging for health checks in production
    return process.env.NODE_ENV === 'production' && req.url === '/health';
  }
});

module.exports = requestLogger;
