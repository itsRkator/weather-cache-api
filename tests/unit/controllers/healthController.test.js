/**
 * Tests for health controller
 */

const healthController = require('../../../src/controllers/healthController');
const weatherService = require('../../../src/services/weatherService');

// Mock the weather service
jest.mock('../../../src/services/weatherService');

describe('Health Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.WEATHER_API_KEY;
    delete process.env.WEATHER_API_URL;
    delete process.env.NODE_ENV;
  });

  describe('getHealth', () => {
    it('should return healthy status with basic information', async () => {
      const mockCacheStats = {
        totalEntries: 3,
        validEntries: 2,
        expiredEntries: 1
      };
      weatherService.getCacheStats.mockReturnValue(mockCacheStats);

      await healthController.getHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        version: '1.0.0',
        environment: 'development',
        services: {
          weather: 'operational',
          cache: 'operational'
        },
        cache: {
          status: 'operational',
          stats: mockCacheStats
        }
      });
    });

    it('should return degraded status when cache fails', async () => {
      weatherService.getCacheStats.mockImplementation(() => {
        throw new Error('Cache error');
      });

      await healthController.getHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'degraded',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        version: '1.0.0',
        environment: 'development',
        services: {
          weather: 'operational',
          cache: 'operational'
        },
        cache: {
          status: 'degraded',
          error: 'Cache error'
        }
      });
    });

    it('should handle unexpected errors', async () => {
      // Mock process.uptime to throw an error
      const originalUptime = process.uptime;
      process.uptime = jest.fn(() => {
        throw new Error('Uptime error');
      });

      await healthController.getHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: 'Health check failed',
        message: 'Uptime error'
      });

      // Restore original function
      process.uptime = originalUptime;
    });
  });

  describe('getDetailedHealth', () => {
    it('should return healthy status when all services are operational', async () => {
      const mockCacheStats = {
        totalEntries: 2,
        validEntries: 2,
        expiredEntries: 0
      };
      weatherService.getCacheStats.mockReturnValue(mockCacheStats);

      await healthController.getDetailedHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        version: '1.0.0',
        environment: 'development',
        dependencies: {
          weatherAPI: {
            status: 'healthy',
            message: 'Using mock data (no API key configured)',
            type: 'mock'
          },
          cache: {
            status: 'healthy',
            stats: mockCacheStats
          }
        }
      });
    });

    it('should return degraded status when weather API fails', async () => {
      process.env.WEATHER_API_KEY = 'test-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
      
      const mockCacheStats = {
        totalEntries: 1,
        validEntries: 1,
        expiredEntries: 0
      };
      weatherService.getCacheStats.mockReturnValue(mockCacheStats);

      // Mock axios to simulate API failure
      const axios = require('axios');
      const originalGet = axios.get;
      axios.get = jest.fn().mockRejectedValue(new Error('API connection failed'));

      await healthController.getDetailedHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'degraded',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        version: '1.0.0',
        environment: 'development',
        dependencies: {
          weatherAPI: {
            status: 'unhealthy',
            error: 'API connection failed',
            type: 'external'
          },
          cache: {
            status: 'healthy',
            stats: mockCacheStats
          }
        }
      });

      // Restore original axios.get
      axios.get = originalGet;
    });

    it('should return degraded status when cache fails', async () => {
      weatherService.getCacheStats.mockImplementation(() => {
        throw new Error('Cache service error');
      });

      await healthController.getDetailedHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'degraded',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        version: '1.0.0',
        environment: 'development',
        dependencies: {
          weatherAPI: {
            status: 'healthy',
            message: 'Using mock data (no API key configured)',
            type: 'mock'
          },
          cache: {
            status: 'unhealthy',
            error: 'Cache service error'
          }
        }
      });
    });

    it('should handle unexpected errors in detailed health check', async () => {
      // Mock process.uptime to throw an error
      const originalUptime = process.uptime;
      process.uptime = jest.fn(() => {
        throw new Error('System error');
      });

      await healthController.getDetailedHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: 'Detailed health check failed',
        message: 'System error'
      });

      // Restore original function
      process.uptime = originalUptime;
    });

    it('should test weather API connectivity when API key is provided', async () => {
      process.env.WEATHER_API_KEY = 'test-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
      
      const mockCacheStats = {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0
      };
      weatherService.getCacheStats.mockReturnValue(mockCacheStats);

      // Mock axios to simulate successful API call
      const axios = require('axios');
      const originalGet = axios.get;
      axios.get = jest.fn().mockResolvedValue({
        data: { cod: 200 },
        headers: { 'x-response-time': '250ms' }
      });

      await healthController.getDetailedHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        version: '1.0.0',
        environment: 'development',
        dependencies: {
          weatherAPI: {
            status: 'healthy',
            responseTime: '250ms',
            type: 'external'
          },
          cache: {
            status: 'healthy',
            stats: mockCacheStats
          }
        }
      });

      // Restore original axios.get
      axios.get = originalGet;
    });
  });
});
