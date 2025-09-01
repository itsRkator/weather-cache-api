/**
 * Main Express application setup
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const weatherRoutes = require('./routes/weatherRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Import middleware
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// API routes
app.use('/health', healthRoutes);
app.use('/weather', weatherRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Weather Cache API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      weather: '/weather?city=<city_name>',
      cacheStats: '/weather/cache/stats',
      clearCache: 'DELETE /weather/cache'
    },
    documentation: 'https://github.com/your-repo/weather-cache-api'
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
