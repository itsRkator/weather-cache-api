/**
 * Tests for weather controller
 */

const weatherController = require('../../../src/controllers/weatherController');
const weatherService = require('../../../src/services/weatherService');

// Mock the weather service
jest.mock('../../../src/services/weatherService');

describe('Weather Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getWeather', () => {
    it('should return 400 when city parameter is missing', async () => {
      await weatherController.getWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'City parameter is required',
        example: '/weather?city=London'
      });
    });

    it('should return 400 when city parameter is empty', async () => {
      mockReq.query.city = '';

      await weatherController.getWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'City parameter is required',
        example: '/weather?city=London'
      });
    });

    it('should return weather data successfully', async () => {
      const mockWeatherData = {
        city: 'London',
        country: 'GB',
        temperature: { current: 15 },
        description: 'clear sky',
        source: 'openweathermap'
      };

      weatherService.getWeatherByCity.mockResolvedValue(mockWeatherData);
      mockReq.query.city = 'London';

      await weatherController.getWeather(mockReq, mockRes);

      expect(weatherService.getWeatherByCity).toHaveBeenCalledWith('London');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockWeatherData
      });
    });

    it('should return 404 when city is not found', async () => {
      const error = {
        response: { status: 404 },
        message: 'City not found'
      };
      weatherService.getWeatherByCity.mockRejectedValue(error);
      mockReq.query.city = 'InvalidCity';

      await weatherController.getWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'City not found. Please check the city name and try again.'
      });
    });

    it('should return 500 when API key is invalid', async () => {
      const error = {
        response: { status: 401 },
        message: 'Unauthorized'
      };
      weatherService.getWeatherByCity.mockRejectedValue(error);
      mockReq.query.city = 'London';

      await weatherController.getWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Weather service authentication failed'
      });
    });

    it('should return 503 when service is unavailable', async () => {
      const error = {
        code: 'ECONNABORTED',
        message: 'Connection timeout'
      };
      weatherService.getWeatherByCity.mockRejectedValue(error);
      mockReq.query.city = 'London';

      await weatherController.getWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Service Unavailable',
        message: 'Weather service is temporarily unavailable. Please try again later.'
      });
    });

    it('should return 500 for unexpected errors', async () => {
      const error = new Error('Unexpected error');
      weatherService.getWeatherByCity.mockRejectedValue(error);
      mockReq.query.city = 'London';

      await weatherController.getWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while fetching weather data'
      });
    });

    it('should handle city name validation errors', async () => {
      const error = new Error('City name is required and must be a non-empty string');
      weatherService.getWeatherByCity.mockRejectedValue(error);
      mockReq.query.city = '';

      await weatherController.getWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'City parameter is required',
        example: '/weather?city=London'
      });
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics successfully', async () => {
      const mockStats = {
        totalEntries: 5,
        validEntries: 4,
        expiredEntries: 1
      };
      weatherService.getCacheStats.mockReturnValue(mockStats);

      await weatherController.getCacheStats(mockReq, mockRes);

      expect(weatherService.getCacheStats).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle errors when getting cache stats', async () => {
      const error = new Error('Cache error');
      weatherService.getCacheStats.mockImplementation(() => {
        throw error;
      });

      await weatherController.getCacheStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to retrieve cache statistics'
      });
    });
  });

  describe('clearCache', () => {
    it('should clear cache successfully', async () => {
      weatherService.clearCache.mockImplementation(() => {});

      await weatherController.clearCache(mockReq, mockRes);

      expect(weatherService.clearCache).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cache cleared successfully'
      });
    });

    it('should handle errors when clearing cache', async () => {
      const error = new Error('Clear cache error');
      weatherService.clearCache.mockImplementation(() => {
        throw error;
      });

      await weatherController.clearCache(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to clear cache'
      });
    });
  });
});
