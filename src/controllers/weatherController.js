/**
 * Weather controller for handling weather-related HTTP requests
 */

const weatherService = require('../services/weatherService');

class WeatherController {
  /**
   * Get weather data for a specific city
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWeather(req, res) {
    try {
      const { city } = req.query;

      if (!city) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'City parameter is required',
          example: '/weather?city=London'
        });
      }

      const weatherData = await weatherService.getWeatherByCity(city);
      
      res.status(200).json({
        success: true,
        data: weatherData
      });
    } catch (error) {
      console.error('Weather controller error:', error);
      
      // Handle different types of errors
      if (error.message.includes('City name is required')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }
      
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'City not found. Please check the city name and try again.'
        });
      }
      
      if (error.response?.status === 401) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Weather service authentication failed'
        });
      }
      
      if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Weather service is temporarily unavailable. Please try again later.'
        });
      }
      
      // Default error response
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while fetching weather data'
      });
    }
  }

  /**
   * Get cache statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCacheStats(req, res) {
    try {
      const stats = weatherService.getCacheStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Cache stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve cache statistics'
      });
    }
  }

  /**
   * Clear weather cache
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async clearCache(req, res) {
    try {
      weatherService.clearCache();
      
      res.status(200).json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Clear cache error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to clear cache'
      });
    }
  }
}

module.exports = new WeatherController();
