/**
 * Test to cover root endpoint and signal handlers for 100% coverage
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Root Endpoint and Signal Handlers Coverage', () => {
  describe('Root Endpoint - Line 45', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Weather Cache API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('documentation');
    });
  });

  describe('Signal Handlers - Lines 66-67, 71-72', () => {
    it('should handle SIGTERM signal', () => {
      const originalExit = process.exit;
      const originalLog = console.log;
      
      // Mock process.exit to prevent actual exit
      process.exit = jest.fn();
      console.log = jest.fn();
      
      // Trigger SIGTERM
      process.emit('SIGTERM');
      
      expect(console.log).toHaveBeenCalledWith('SIGTERM received, shutting down gracefully');
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Restore original functions
      process.exit = originalExit;
      console.log = originalLog;
    });

    it('should handle SIGINT signal', () => {
      const originalExit = process.exit;
      const originalLog = console.log;
      
      // Mock process.exit to prevent actual exit
      process.exit = jest.fn();
      console.log = jest.fn();
      
      // Trigger SIGINT
      process.emit('SIGINT');
      
      expect(console.log).toHaveBeenCalledWith('SIGINT received, shutting down gracefully');
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Restore original functions
      process.exit = originalExit;
      console.log = originalLog;
    });
  });
});
