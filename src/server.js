/**
 * Server entry point
 */

const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Weather Cache API server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🌤️  Weather API: http://${HOST}:${PORT}/weather?city=London`);
  console.log(`📈 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (!process.env.WEATHER_API_KEY) {
    console.log('⚠️  No WEATHER_API_KEY found, using mock data');
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
