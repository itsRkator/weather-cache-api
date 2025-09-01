/**
 * Integration tests for API routes
 */

const request = require('supertest');
const app = require('../../src/app');
const weatherService = require('../../src/services/weatherService');

// Mock the weather service
jest.mock('../../src/services/weatherService');

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Weather Cache API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('weather');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const mockCacheStats = {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0
      };
      weatherService.getCacheStats.mockReturnValue(mockCacheStats);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const mockCacheStats = {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0
      };
      weatherService.getCacheStats.mockReturnValue(mockCacheStats);

      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body.dependencies).toHaveProperty('weatherAPI');
      expect(response.body.dependencies).toHaveProperty('cache');
    });
  });

  describe('GET /weather', () => {
    it('should return 400 when city parameter is missing', async () => {
      const response = await request(app)
        .get('/weather')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('message', 'City parameter is required');
    });

    it('should return weather data when city is provided', async () => {
      const mockWeatherData = {
        city: 'London',
        country: 'GB',
        temperature: { current: 15 },
        description: 'clear sky',
        source: 'openweathermap'
      };
      weatherService.getWeatherByCity.mockResolvedValue(mockWeatherData);

      const response = await request(app)
        .get('/weather?city=London')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data', mockWeatherData);
      expect(weatherService.getWeatherByCity).toHaveBeenCalledWith('London');
    });

    it('should handle service errors', async () => {
      weatherService.getWeatherByCity.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/weather?city=London')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
  });

  describe('GET /weather/cache/stats', () => {
    it('should return cache statistics', async () => {
      const mockStats = {
        totalEntries: 5,
        validEntries: 4,
        expiredEntries: 1
      };
      weatherService.getCacheStats.mockReturnValue(mockStats);

      const response = await request(app)
        .get('/weather/cache/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data', mockStats);
    });

    it('should handle cache stats errors', async () => {
      weatherService.getCacheStats.mockImplementation(() => {
        throw new Error('Cache error');
      });

      const response = await request(app)
        .get('/weather/cache/stats')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
  });

  describe('DELETE /weather/cache', () => {
    it('should clear cache successfully', async () => {
      weatherService.clearCache.mockImplementation(() => {});

      const response = await request(app)
        .delete('/weather/cache')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Cache cleared successfully');
      expect(weatherService.clearCache).toHaveBeenCalled();
    });

    it('should handle cache clear errors', async () => {
      weatherService.clearCache.mockImplementation(() => {
        throw new Error('Clear cache error');
      });

      const response = await request(app)
        .delete('/weather/cache')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('availableRoutes');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet.js adds various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });
});
