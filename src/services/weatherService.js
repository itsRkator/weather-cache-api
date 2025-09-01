/**
 * Weather service for fetching weather data from external APIs
 */

const axios = require('axios');
const { retryWithExponentialBackoff } = require('../utils/retry');
const cacheService = require('./cache');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.apiUrl = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5/weather';
    this.cacheTtl = (parseInt(process.env.CACHE_TTL_MINUTES) || 3) * 60 * 1000; // Convert to milliseconds
    this.maxRetryAttempts = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;
  }

  /**
   * Get weather data for a city
   * @param {string} city - City name
   * @returns {Promise<Object>} Weather data
   */
  async getWeatherByCity(city) {
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new Error('City name is required and must be a non-empty string');
    }

    const normalizedCity = city.trim().toLowerCase();
    const cacheKey = `weather:${normalizedCity}`;

    // Try to get from cache first
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for city: ${city}`);
      return cachedData;
    }

    console.log(`Cache miss for city: ${city}, fetching from API...`);

    try {
      const weatherData = await this.fetchWeatherFromAPI(normalizedCity);
      
      // Cache the result
      cacheService.set(cacheKey, weatherData, this.cacheTtl);
      
      return weatherData;
    } catch (error) {
      console.error(`Error fetching weather for city ${city}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch weather data from external API with retry logic
   * @param {string} city - City name
   * @returns {Promise<Object>} Weather data
   */
  async fetchWeatherFromAPI(city) {
    if (!this.apiKey) {
      // If no API key is provided, return mock data
      console.log('No API key provided, returning mock weather data');
      return this.getMockWeatherData(city);
    }

    const fetchWeather = async () => {
      const response = await axios.get(this.apiUrl, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric'
        },
        timeout: 10000 // 10 second timeout
      });

      return this.transformWeatherData(response.data);
    };

    return await retryWithExponentialBackoff(fetchWeather, {
      maxAttempts: this.maxRetryAttempts,
      baseDelay: 1000,
      maxDelay: 8000
    });
  }

  /**
   * Transform raw weather API response to our standard format
   * @param {Object} rawData - Raw API response
   * @returns {Object} Transformed weather data
   */
  transformWeatherData(rawData) {
    return {
      city: rawData.name,
      country: rawData.sys.country,
      temperature: {
        current: Math.round(rawData.main.temp),
        feelsLike: Math.round(rawData.main.feels_like),
        min: Math.round(rawData.main.temp_min),
        max: Math.round(rawData.main.temp_max)
      },
      humidity: rawData.main.humidity,
      pressure: rawData.main.pressure,
      description: rawData.weather[0].description,
      main: rawData.weather[0].main,
      wind: {
        speed: rawData.wind.speed,
        direction: rawData.wind.deg
      },
      visibility: rawData.visibility,
      timestamp: new Date().toISOString(),
      source: 'openweathermap'
    };
  }

  /**
   * Get mock weather data for testing/development
   * @param {string} city - City name
   * @returns {Object} Mock weather data
   */
  getMockWeatherData(city) {
    const mockTemperatures = [15, 18, 22, 25, 28, 30, 32, 35];
    const mockDescriptions = ['clear sky', 'few clouds', 'scattered clouds', 'broken clouds', 'shower rain', 'rain', 'thunderstorm', 'snow'];
    
    const randomTemp = mockTemperatures[Math.floor(Math.random() * mockTemperatures.length)];
    const randomDesc = mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)];
    
    return {
      city: city.charAt(0).toUpperCase() + city.slice(1),
      country: 'US',
      temperature: {
        current: randomTemp,
        feelsLike: randomTemp + Math.floor(Math.random() * 3) - 1,
        min: randomTemp - 5,
        max: randomTemp + 5
      },
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      pressure: Math.floor(Math.random() * 100) + 1000, // 1000-1100 hPa
      description: randomDesc,
      main: randomDesc.split(' ')[0],
      wind: {
        speed: Math.floor(Math.random() * 10) + 1, // 1-10 m/s
        direction: Math.floor(Math.random() * 360)
      },
      visibility: Math.floor(Math.random() * 5000) + 5000, // 5-10 km
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return cacheService.getStats();
  }

  /**
   * Clear weather cache
   */
  clearCache() {
    cacheService.clear();
  }
}

module.exports = new WeatherService();
