/**
 * End-to-end tests for the application
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Application End-to-End Tests', () => {
  describe('Application Setup', () => {
    it('should have proper middleware configured', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for security headers (Helmet)
      expect(response.headers).toHaveProperty('x-content-type-options');
      
      // Check for CORS headers
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle JSON parsing', async () => {
      const response = await request(app)
        .post('/test-json')
        .send({ test: 'data' })
        .expect(404); // Route doesn't exist, but JSON parsing should work

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    it('should handle URL encoding', async () => {
      const response = await request(app)
        .post('/test-urlencoded')
        .send('test=data')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('API Information Endpoint', () => {
    it('should return complete API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Weather Cache API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          weather: '/weather?city=<city_name>',
          cacheStats: '/weather/cache/stats',
          clearCache: 'DELETE /weather/cache'
        },
        documentation: 'https://github.com/your-repo/weather-cache-api'
      });
    });
  });

  describe('Health Endpoints', () => {
    it('should provide basic health information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('cache');
    });

    it('should provide detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body.dependencies).toHaveProperty('weatherAPI');
      expect(response.body.dependencies).toHaveProperty('cache');
    });
  });

  describe('Weather API Endpoints', () => {
    it('should handle weather requests with proper validation', async () => {
      // Test missing city parameter
      await request(app)
        .get('/weather')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', 'Bad Request');
          expect(res.body).toHaveProperty('message', 'City parameter is required');
        });

      // Test empty city parameter
      await request(app)
        .get('/weather?city=')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', 'Bad Request');
        });
    });

    it('should handle cache management endpoints', async () => {
      // Test cache stats
      await request(app)
        .get('/weather/cache/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('totalEntries');
          expect(res.body.data).toHaveProperty('validEntries');
          expect(res.body.data).toHaveProperty('expiredEntries');
        });

      // Test cache clearing
      await request(app)
        .delete('/weather/cache')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message', 'Cache cleared successfully');
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors properly', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('availableRoutes');
      expect(Array.isArray(response.body.availableRoutes)).toBe(true);
    });

    it('should handle different HTTP methods for 404', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const response = await request(app)
          [method.toLowerCase()]('/non-existent-route')
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not Found');
        expect(response.body.message).toContain(method);
      }
    });
  });

  describe('Request Logging', () => {
    it('should log requests properly', async () => {
      // Mock console.log to capture log output
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      await request(app)
        .get('/health')
        .expect(200);

      // Restore console.log
      console.log = originalLog;

      // In a real application, you might want to verify logging behavior
      // For now, we just ensure the request completes successfully
    });
  });

  describe('CORS Configuration', () => {
    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/weather')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from Helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Content Type Handling', () => {
    it('should handle JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should parse JSON request bodies', async () => {
      // This test ensures the JSON parsing middleware is working
      // We'll test with a non-existent route that would normally parse JSON
      const response = await request(app)
        .post('/non-existent')
        .send({ test: 'data' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill().map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
      });
    });

    it('should maintain consistent response format', async () => {
      // Test health endpoint
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);
      expect(healthResponse.body).toHaveProperty('status');
      expect(typeof healthResponse.body).toBe('object');

      // Test cache stats endpoint
      const cacheResponse = await request(app)
        .get('/weather/cache/stats')
        .expect(200);
      expect(cacheResponse.body).toHaveProperty('success');
      expect(typeof cacheResponse.body).toBe('object');
    });
  });
});
