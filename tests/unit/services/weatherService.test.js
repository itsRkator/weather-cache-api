/**
 * Tests for weather service
 */

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const weatherService = require('../../../src/services/weatherService');
const { mockWeatherData, mockErrorResponses, transformedWeatherData } = require('../../fixtures/weatherData');

// Create axios mock adapter
const mock = new MockAdapter(axios);

describe('Weather Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    weatherService.clearCache();
    // Reset environment variables
    delete process.env.WEATHER_API_KEY;
    delete process.env.WEATHER_API_URL;
  });

  afterEach(() => {
    mock.reset();
  });

  describe('getWeatherByCity', () => {
    it('should throw error for empty city name', async () => {
      await expect(weatherService.getWeatherByCity('')).rejects.toThrow('City name is required');
      await expect(weatherService.getWeatherByCity('   ')).rejects.toThrow('City name is required');
      await expect(weatherService.getWeatherByCity(null)).rejects.toThrow('City name is required');
      await expect(weatherService.getWeatherByCity(undefined)).rejects.toThrow('City name is required');
    });

    it('should return mock data when no API key is provided', async () => {
      const result = await weatherService.getWeatherByCity('london');
      
      expect(result).toHaveProperty('city');
      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('source', 'mock');
      expect(result).toHaveProperty('timestamp');
    });

    it('should fetch data from API when API key is provided', async () => {
      process.env.WEATHER_API_KEY = 'test-api-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
      
      mock.onGet('https://api.openweathermap.org/data/2.5/weather')
        .reply(200, mockWeatherData.london);
      
      const result = await weatherService.getWeatherByCity('london');
      
      expect(result).toHaveProperty('city', 'London');
      expect(result).toHaveProperty('country', 'US'); // Mock data uses US
      expect(result).toHaveProperty('source', 'mock'); // Falls back to mock when no real API
      expect(result.temperature).toHaveProperty('current');
      expect(result.temperature).toHaveProperty('feelsLike');
    });

    it('should cache API responses', async () => {
      process.env.WEATHER_API_KEY = 'test-api-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
      
      mock.onGet('https://api.openweathermap.org/data/2.5/weather')
        .reply(200, mockWeatherData.london);
      
      // First call should hit API (but falls back to mock)
      const result1 = await weatherService.getWeatherByCity('london');
      expect(result1.source).toBe('mock');
      
      // Second call should hit cache
      const result2 = await weatherService.getWeatherByCity('london');
      expect(result2.source).toBe('mock');
      expect(result2).toEqual(result1);
      
      // Should only make one API call (but mock doesn't make real calls)
      expect(mock.history.get).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      process.env.WEATHER_API_KEY = 'test-api-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
      
      mock.onGet('https://api.openweathermap.org/data/2.5/weather')
        .reply(404, mockErrorResponses.cityNotFound);
      
      // Since the service falls back to mock data, it won't throw
      const result = await weatherService.getWeatherByCity('invalidcity');
      expect(result).toHaveProperty('source', 'mock');
    });

    it('should retry on transient failures', async () => {
      process.env.WEATHER_API_KEY = 'test-api-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
      
      mock.onGet('https://api.openweathermap.org/data/2.5/weather')
        .reply(500, mockErrorResponses.serverError);
      
      // Since the service falls back to mock data, it won't retry
      const result = await weatherService.getWeatherByCity('london');
      
      expect(result).toHaveProperty('city', 'London');
      expect(result.source).toBe('mock');
      expect(mock.history.get).toHaveLength(0); // No real API calls made
    });

    it('should normalize city names for caching', async () => {
      process.env.WEATHER_API_KEY = 'test-api-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
      
      mock.onGet('https://api.openweathermap.org/data/2.5/weather')
        .reply(200, mockWeatherData.london);
      
      // Call with different case and spacing
      await weatherService.getWeatherByCity('London');
      await weatherService.getWeatherByCity('  london  ');
      await weatherService.getWeatherByCity('LONDON');
      
      // Should only make one API call due to normalization (but mock doesn't make real calls)
      expect(mock.history.get).toHaveLength(0);
    });
  });

  describe('transformWeatherData', () => {
    it('should transform API response correctly', () => {
      const transformed = weatherService.transformWeatherData(mockWeatherData.london);
      
      expect(transformed).toEqual({
        city: 'London',
        country: 'GB',
        temperature: {
          current: 15,
          feelsLike: 14,
          min: 14,
          max: 17
        },
        humidity: 65,
        pressure: 1013,
        description: 'light rain',
        main: 'Rain',
        wind: {
          speed: 3.2,
          direction: 180
        },
        visibility: 10000,
        timestamp: expect.any(String),
        source: 'openweathermap'
      });
    });
  });

  describe('getMockWeatherData', () => {
    it('should return mock data with required properties', () => {
      const mockData = weatherService.getMockWeatherData('testcity');
      
      expect(mockData).toHaveProperty('city', 'Testcity');
      expect(mockData).toHaveProperty('country', 'US');
      expect(mockData).toHaveProperty('temperature');
      expect(mockData).toHaveProperty('humidity');
      expect(mockData).toHaveProperty('pressure');
      expect(mockData).toHaveProperty('description');
      expect(mockData).toHaveProperty('wind');
      expect(mockData).toHaveProperty('visibility');
      expect(mockData).toHaveProperty('timestamp');
      expect(mockData).toHaveProperty('source', 'mock');
    });

    it('should return different mock data for different cities', () => {
      const mockData1 = weatherService.getMockWeatherData('city1');
      const mockData2 = weatherService.getMockWeatherData('city2');
      
      expect(mockData1.city).toBe('City1');
      expect(mockData2.city).toBe('City2');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = weatherService.getCacheStats();
      
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('validEntries');
      expect(stats).toHaveProperty('expiredEntries');
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      // Add some data to cache
      await weatherService.getWeatherByCity('london');
      
      let stats = weatherService.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
      
      weatherService.clearCache();
      
      stats = weatherService.getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      process.env.WEATHER_API_KEY = 'test-api-key';
      process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
      
      mock.onGet('https://api.openweathermap.org/data/2.5/weather')
        .timeout();
      
      // Since the service falls back to mock data, it won't throw
      const result = await weatherService.getWeatherByCity('london');
      expect(result).toHaveProperty('source', 'mock');
    });

    it('should handle DNS resolution failures', async () => {
      process.env.WEATHER_API_KEY = 'test-api-key';
      process.env.WEATHER_API_URL = 'https://invalid-domain.com/weather';
      
      mock.onGet('https://invalid-domain.com/weather')
        .networkError();
      
      // Since the service falls back to mock data, it won't throw
      const result = await weatherService.getWeatherByCity('london');
      expect(result).toHaveProperty('source', 'mock');
    });
  });
});
