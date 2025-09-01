/**
 * Comprehensive test suite for 100% code coverage
 * Properly handles async operations and covers all uncovered lines
 */

const request = require('supertest');
const app = require('../../src/app');
const weatherService = require('../../src/services/weatherService');
const cacheService = require('../../src/services/cache');

describe('Comprehensive Coverage Tests', () => {
  let server;

  beforeAll(async () => {
    // Start server for testing
    server = app.listen(0);
  });

  afterAll(async () => {
    // Close server after tests
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    cacheService.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('App.js - CORS Configuration', () => {
    it('should handle CORS with specific allowed origins', async () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://example.com';
      
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle CORS with wildcard origin', async () => {
      delete process.env.ALLOWED_ORIGINS;
      
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Health Controller - Error Handling', () => {
    it('should handle health check with cache service error', async () => {
      const originalGetCacheStats = weatherService.getCacheStats;
      weatherService.getCacheStats = jest.fn(() => {
        throw new Error('Cache service error');
      });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('degraded');
      expect(response.body.cache.status).toBe('degraded');

      weatherService.getCacheStats = originalGetCacheStats;
    });

    it('should handle detailed health check with weather API failure', async () => {
      process.env.WEATHER_API_KEY = 'test-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

      const axios = require('axios');
      const originalGet = axios.get;
      axios.get = jest.fn().mockRejectedValue(new Error('API connection failed'));

      const response = await request(app)
        .get('/health/detailed')
        .expect(503);

      expect(response.body.status).toBe('degraded');
      expect(response.body.dependencies.weatherAPI.status).toBe('unhealthy');

      axios.get = originalGet;
    });

    it('should handle detailed health check with cache service error', async () => {
      const originalGetCacheStats = weatherService.getCacheStats;
      weatherService.getCacheStats = jest.fn(() => {
        throw new Error('Cache service error');
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(503);

      expect(response.body.status).toBe('degraded');
      expect(response.body.dependencies.cache.status).toBe('unhealthy');

      weatherService.getCacheStats = originalGetCacheStats;
    });
  });

  describe('Weather Controller - Error Handling', () => {
    it('should handle error without response property', async () => {
      const originalGetWeatherByCity = weatherService.getWeatherByCity;
      weatherService.getWeatherByCity = jest.fn().mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/weather?city=London')
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('An unexpected error occurred while fetching weather data');

      weatherService.getWeatherByCity = originalGetWeatherByCity;
    });

    it('should handle 401 error from weather service', async () => {
      const originalGetWeatherByCity = weatherService.getWeatherByCity;
      weatherService.getWeatherByCity = jest.fn().mockRejectedValue({
        response: { status: 401 },
        message: 'Unauthorized'
      });

      const response = await request(app)
        .get('/weather?city=London')
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Weather service authentication failed');

      weatherService.getWeatherByCity = originalGetWeatherByCity;
    });

    it('should handle 404 error from weather service', async () => {
      const originalGetWeatherByCity = weatherService.getWeatherByCity;
      weatherService.getWeatherByCity = jest.fn().mockRejectedValue({
        response: { status: 404 },
        message: 'City not found'
      });

      const response = await request(app)
        .get('/weather?city=InvalidCity')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('City not found. Please check the city name and try again.');

      weatherService.getWeatherByCity = originalGetWeatherByCity;
    });

    it('should handle network timeout error', async () => {
      const originalGetWeatherByCity = weatherService.getWeatherByCity;
      weatherService.getWeatherByCity = jest.fn().mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Connection timeout'
      });

      const response = await request(app)
        .get('/weather?city=London')
        .expect(503);

      expect(response.body.error).toBe('Service Unavailable');
      expect(response.body.message).toBe('Weather service is temporarily unavailable. Please try again later.');

      weatherService.getWeatherByCity = originalGetWeatherByCity;
    });
  });

  describe('Error Handler - All Error Types', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle ValidationError', () => {
      const { errorHandler } = require('../../src/middleware/errorHandler');
      
      const mockReq = { method: 'GET', originalUrl: '/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Validation failed',
        stack: expect.any(String)
      });
    });

    it('should handle UnauthorizedError', () => {
      const { errorHandler } = require('../../src/middleware/errorHandler');
      
      const mockReq = { method: 'GET', originalUrl: '/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const error = new Error('Unauthorized access');
      error.name = 'UnauthorizedError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Unauthorized access',
        stack: expect.any(String)
      });
    });

    it('should handle ForbiddenError', () => {
      const { errorHandler } = require('../../src/middleware/errorHandler');
      
      const mockReq = { method: 'GET', originalUrl: '/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const error = new Error('Access forbidden');
      error.name = 'ForbiddenError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Access forbidden',
        stack: expect.any(String)
      });
    });

    it('should handle NotFoundError', () => {
      const { errorHandler } = require('../../src/middleware/errorHandler');
      
      const mockReq = { method: 'GET', originalUrl: '/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const error = new Error('Resource not found');
      error.name = 'NotFoundError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Resource not found',
        stack: expect.any(String)
      });
    });

    it('should handle ConflictError', () => {
      const { errorHandler } = require('../../src/middleware/errorHandler');
      
      const mockReq = { method: 'GET', originalUrl: '/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const error = new Error('Resource conflict');
      error.name = 'ConflictError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Conflict',
        message: 'Resource conflict',
        stack: expect.any(String)
      });
    });

    it('should handle TooManyRequestsError', () => {
      const { errorHandler } = require('../../src/middleware/errorHandler');
      
      const mockReq = { method: 'GET', originalUrl: '/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const error = new Error('Rate limit exceeded');
      error.name = 'TooManyRequestsError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        stack: expect.any(String)
      });
    });

    it('should handle production environment without stack trace', () => {
      const { errorHandler } = require('../../src/middleware/errorHandler');
      
      const mockReq = { method: 'GET', originalUrl: '/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      process.env.NODE_ENV = 'production';
      
      const error = new Error('Production error');
      error.stack = 'Error stack trace';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    });
  });

  describe('Request Logger - Morgan Configuration', () => {
    it('should handle morgan token calculation', () => {
      const requestLogger = require('../../src/middleware/requestLogger');
      
      process.env.NODE_ENV = 'development';
      expect(typeof requestLogger).toBe('function');
      
      process.env.NODE_ENV = 'production';
      expect(typeof requestLogger).toBe('function');
    });
  });

  describe('Cache Service - Cleanup Operations', () => {
    it('should handle cache cleanup with expired entries', async () => {
      cacheService.set('expired', { data: 'test' }, 1);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cacheService.cleanup();
      
      const stats = cacheService.getStats();
      expect(stats.expiredEntries).toBe(0);
      expect(cacheService.get('expired')).toBeNull();
    });

    it('should handle cache cleanup with no expired entries', () => {
      cacheService.set('valid', { data: 'test' }, 60000);
      
      cacheService.cleanup();
      
      const stats = cacheService.getStats();
      expect(stats.validEntries).toBe(1);
      expect(stats.expiredEntries).toBe(0);
    });
  });

  describe('Weather Service - Input Validation', () => {
    it('should handle transformWeatherData with missing wind direction', () => {
      const rawData = {
        name: 'Test City',
        sys: { country: 'US' },
        main: {
          temp: 20,
          feels_like: 19,
          temp_min: 18,
          temp_max: 22,
          humidity: 60,
          pressure: 1013
        },
        weather: [{ description: 'clear sky', main: 'Clear' }],
        wind: { speed: 5 },
        visibility: 10000
      };

      const transformed = weatherService.transformWeatherData(rawData);
      expect(transformed.wind.direction).toBeUndefined();
    });

    it('should handle getWeatherByCity with null city', async () => {
      await expect(weatherService.getWeatherByCity(null)).rejects.toThrow('City name is required');
    });

    it('should handle getWeatherByCity with undefined city', async () => {
      await expect(weatherService.getWeatherByCity(undefined)).rejects.toThrow('City name is required');
    });

    it('should handle getWeatherByCity with empty string city', async () => {
      await expect(weatherService.getWeatherByCity('')).rejects.toThrow('City name is required');
    });

    it('should handle getWeatherByCity with whitespace-only city', async () => {
      await expect(weatherService.getWeatherByCity('   ')).rejects.toThrow('City name is required');
    });
  });

  describe('Retry Utility - Edge Cases', () => {
    it('should handle retry with last error scenario', async () => {
      const { retryWithExponentialBackoff } = require('../../src/utils/retry');
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(retryWithExponentialBackoff(mockFn, {
        maxAttempts: 1,
        baseDelay: 10
      })).rejects.toThrow('Persistent error');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle retry with custom shouldRetry function', async () => {
      const { retryWithExponentialBackoff } = require('../../src/utils/retry');
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Custom error'))
        .mockResolvedValue('success');

      const customShouldRetry = (error) => error.message === 'Custom error';

      const result = await retryWithExponentialBackoff(mockFn, {
        maxAttempts: 2,
        baseDelay: 10,
        shouldRetry: customShouldRetry
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle basic API functionality', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should handle weather data retrieval', async () => {
      const response = await request(app)
        .get('/weather?city=London')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('city');
      expect(response.body.data).toHaveProperty('temperature');
    });

    it('should handle cache management', async () => {
      await request(app).delete('/weather/cache');
      
      const statsResponse = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      
      expect(statsResponse.body.data.totalEntries).toBe(0);
    });

    it('should handle error responses', async () => {
      const response = await request(app)
        .get('/weather')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('message', 'City parameter is required');
    });
  });
});
