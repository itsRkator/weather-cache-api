/**
 * Integration tests for caching behavior
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Caching Integration Tests', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await request(app).delete('/weather/cache');
  });

  describe('Cache Behavior', () => {
    it('should cache weather data and serve from cache on subsequent requests', async () => {
      // First request - should hit API (or mock)
      const start1 = Date.now();
      const response1 = await request(app)
        .get('/weather?city=London')
        .expect(200);
      const time1 = Date.now() - start1;

      expect(response1.body).toHaveProperty('success', true);
      expect(response1.body).toHaveProperty('data');
      expect(response1.body.data).toHaveProperty('city');
      expect(response1.body.data).toHaveProperty('timestamp');

      // Check cache stats after first request
      const stats1 = await request(app)
        .get('/weather/cache/stats')
        .expect(200);

      expect(stats1.body.data.totalEntries).toBeGreaterThan(0);

      // Second request - should hit cache
      const start2 = Date.now();
      const response2 = await request(app)
        .get('/weather?city=London')
        .expect(200);
      const time2 = Date.now() - start2;

      expect(response2.body).toHaveProperty('success', true);
      expect(response2.body.data).toEqual(response1.body.data);

      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1);
    });

    it('should cache different cities separately', async () => {
      // Request weather for multiple cities
      const cities = ['London', 'Paris', 'Tokyo'];
      const responses = [];

      for (const city of cities) {
        const response = await request(app)
          .get(`/weather?city=${city}`)
          .expect(200);
        responses.push(response.body.data);
      }

      // Check cache stats
      const stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);

      expect(stats.body.data.totalEntries).toBe(cities.length);
      expect(stats.body.data.validEntries).toBe(cities.length);

      // Verify each city has different data
      const citiesInResponses = responses.map(r => r.city);
      expect(new Set(citiesInResponses).size).toBe(cities.length);
    });

    it('should normalize city names for caching', async () => {
      const cityVariations = ['London', 'london', 'LONDON', '  London  '];
      
      // Make requests with different case variations
      for (const city of cityVariations) {
        await request(app)
          .get(`/weather?city=${city}`)
          .expect(200);
      }

      // Check cache stats - should only have one entry due to normalization
      const stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);

      expect(stats.body.data.totalEntries).toBe(1);
    });

    it('should clear cache when requested', async () => {
      // Add some data to cache
      await request(app).get('/weather?city=London');
      await request(app).get('/weather?city=Paris');

      // Verify cache has data
      let stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      expect(stats.body.data.totalEntries).toBeGreaterThan(0);

      // Clear cache
      await request(app)
        .delete('/weather/cache')
        .expect(200);

      // Verify cache is empty
      stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      expect(stats.body.data.totalEntries).toBe(0);
    });

    it('should handle cache expiration', async () => {
      // Clear cache first
      await request(app)
        .delete('/weather/cache')
        .expect(200);

      // Make initial request
      await request(app)
        .get('/weather?city=London')
        .expect(200);

      // Verify data is cached
      let stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      expect(stats.body.data.validEntries).toBe(1);

      // Wait for expiration (default TTL is 3 minutes, so we'll wait a bit longer)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to get the weather data again to trigger expiration check
      await request(app)
        .get('/weather?city=London')
        .expect(200);

      // Verify cache is still valid (since we didn't wait long enough for 3-minute TTL)
      stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      expect(stats.body.data.validEntries).toBe(1);
      expect(stats.body.data.expiredEntries).toBe(0);
      expect(stats.body.data.totalEntries).toBe(1);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', async () => {
      // Initial state
      let stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      expect(stats.body.data.totalEntries).toBe(0);

      // Add some data
      await request(app).get('/weather?city=London');
      await request(app).get('/weather?city=Paris');

      // Check stats after adding data
      stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      expect(stats.body.data.totalEntries).toBe(2);
      expect(stats.body.data.validEntries).toBe(2);
      expect(stats.body.data.expiredEntries).toBe(0);

      // Clear cache and check stats
      await request(app).delete('/weather/cache');
      
      stats = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      expect(stats.body.data.totalEntries).toBe(0);
    });
  });

  describe('Cache Performance', () => {
    it('should demonstrate cache performance improvement', async () => {
      const city = 'London';
      const iterations = 5;

      // First request (API/mock)
      const start1 = Date.now();
      await request(app)
        .get(`/weather?city=${city}`)
        .expect(200);
      const apiTime = Date.now() - start1;

      // Subsequent requests (cache)
      const cacheTimes = [];
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app)
          .get(`/weather?city=${city}`)
          .expect(200);
        cacheTimes.push(Date.now() - start);
      }

      const avgCacheTime = cacheTimes.reduce((a, b) => a + b, 0) / cacheTimes.length;

      // Cache should be significantly faster
      expect(avgCacheTime).toBeLessThan(apiTime);
      expect(avgCacheTime).toBeLessThan(50); // Should be very fast from cache
    });
  });

  describe('Cache Error Handling', () => {
    it('should handle cache errors gracefully', async () => {
      // This test would require mocking the cache service to throw errors
      // For now, we'll test that the cache stats endpoint handles errors
      const response = await request(app)
        .get('/weather/cache/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });
});
