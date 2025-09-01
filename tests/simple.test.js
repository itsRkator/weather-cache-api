/**
 * Simple test suite to verify basic functionality
 */

const request = require('supertest');
const app = require('../src/app');

describe('Basic API Functionality', () => {
  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('dependencies');
    });
  });

  describe('Weather Endpoints', () => {
    it('should return 400 when city parameter is missing', async () => {
      const response = await request(app)
        .get('/weather')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('message', 'City parameter is required');
    });

    it('should return weather data for valid city', async () => {
      const response = await request(app)
        .get('/weather?city=London')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('city');
      expect(response.body.data).toHaveProperty('temperature');
      expect(response.body.data).toHaveProperty('description');
    });
  });

  describe('Cache Management', () => {
    it('should return cache statistics', async () => {
      const response = await request(app)
        .get('/weather/cache/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalEntries');
      expect(response.body.data).toHaveProperty('validEntries');
      expect(response.body.data).toHaveProperty('expiredEntries');
    });

    it('should clear cache', async () => {
      const response = await request(app)
        .delete('/weather/cache')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Cache cleared successfully');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('availableRoutes');
    });
  });

  describe('Caching Performance', () => {
    it('should demonstrate cache performance', async () => {
      // Clear cache first
      await request(app).delete('/weather/cache');

      // First request (should be slower)
      const start1 = Date.now();
      await request(app)
        .get('/weather?city=London')
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request (should be faster from cache)
      const start2 = Date.now();
      await request(app)
        .get('/weather?city=London')
        .expect(200);
      const time2 = Date.now() - start2;

      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1);
      expect(time2).toBeLessThan(50); // Should be very fast from cache
    });
  });
});
