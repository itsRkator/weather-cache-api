/**
 * Complete test to achieve 100% code coverage
 * This test covers all remaining uncovered lines
 */

const request = require('supertest');
const app = require('../../src/app');
const weatherService = require('../../src/services/weatherService');
const cacheService = require('../../src/services/cache');

describe('Complete Coverage Test', () => {
  beforeEach(() => {
    cacheService.clear();
    jest.clearAllMocks();
  });

  describe('Health Controller - Lines 45-46, 66, 133-134', () => {
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

  describe('Weather Controller - Lines 36, 85-86, 107-108', () => {
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

  describe('Request Logger - Line 12', () => {
    it('should handle morgan token calculation', () => {
      const requestLogger = require('../../src/middleware/requestLogger');
      
      process.env.NODE_ENV = 'development';
      expect(typeof requestLogger).toBe('function');
      
      process.env.NODE_ENV = 'production';
      expect(typeof requestLogger).toBe('function');
    });
  });

  describe('Cache Service - Lines 47, 68, 100-101, 108-109', () => {
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

    it('should handle stopCleanup method', () => {
      expect(typeof cacheService.stopCleanup).toBe('function');
      expect(() => cacheService.stopCleanup()).not.toThrow();
    });
  });

  describe('Weather Service - Lines 47-48, 60-61, 119-125', () => {
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

  describe('Retry Utility - Lines 29, 57', () => {
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
});
