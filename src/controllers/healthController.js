/**
 * Health controller for handling health check requests
 */

const weatherService = require('../services/weatherService');

class HealthController {
  /**
   * Health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHealth(req, res) {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          weather: 'operational',
          cache: 'operational'
        }
      };

      // Check if we can access the weather service
      try {
        const cacheStats = weatherService.getCacheStats();
        healthStatus.cache = {
          status: 'operational',
          stats: cacheStats
        };
      } catch (error) {
        healthStatus.cache = {
          status: 'degraded',
          error: error.message
        };
        healthStatus.status = 'degraded';
      }

      res.status(200).json(healthStatus);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error.message
      });
    }
  }

  /**
   * Detailed health check with service dependencies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDetailedHealth(req, res) {
    try {
      // Check weather API
      let weatherAPIStatus;
      try {
        if (!process.env.WEATHER_API_KEY) {
          weatherAPIStatus = {
            status: 'healthy',
            message: 'Using mock data (no API key configured)',
            type: 'mock'
          };
        } else {
          const axios = require('axios');
          const response = await axios.get(process.env.WEATHER_API_URL, {
            params: {
              q: 'London',
              appid: process.env.WEATHER_API_KEY
            },
            timeout: 5000
          });
          weatherAPIStatus = {
            status: 'healthy',
            responseTime: response.headers['x-response-time'] || 'unknown',
            type: 'external'
          };
        }
      } catch (error) {
        weatherAPIStatus = {
          status: 'unhealthy',
          error: error.message,
          type: 'external'
        };
      }

      // Check cache
      let cacheStatus;
      try {
        const stats = weatherService.getCacheStats();
        cacheStatus = {
          status: 'healthy',
          stats: stats
        };
      } catch (error) {
        cacheStatus = {
          status: 'unhealthy',
          error: error.message
        };
      }

      const detailedHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        dependencies: {
          weatherAPI: weatherAPIStatus,
          cache: cacheStatus
        }
      };

      // Determine overall health status
      const hasUnhealthyServices = Object.values(detailedHealth.dependencies)
        .some(dep => dep.status !== 'healthy');
      
      if (hasUnhealthyServices) {
        detailedHealth.status = 'degraded';
      }

      const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(detailedHealth);
    } catch (error) {
      console.error('Detailed health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Detailed health check failed',
        message: error.message
      });
    }
  }


}

module.exports = new HealthController();
