/**
 * Tests for error handling middleware
 */

const { errorHandler, notFoundHandler } = require('../../../src/middleware/errorHandler');

describe('Error Handling Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/test-route'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    // Reset environment
    process.env.NODE_ENV = 'development';
  });

  describe('errorHandler', () => {
    it('should handle generic errors with 500 status', () => {
      const error = new Error('Generic error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Generic error',
        stack: expect.any(String)
      });
    });

    it('should handle ValidationError with 400 status', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Validation failed',
        stack: expect.any(String)
      });
    });

    it('should handle UnauthorizedError with 401 status', () => {
      const error = new Error('Unauthorized access');
      error.name = 'UnauthorizedError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Unauthorized access',
        stack: expect.any(String)
      });
    });

    it('should handle ForbiddenError with 403 status', () => {
      const error = new Error('Access forbidden');
      error.name = 'ForbiddenError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Access forbidden',
        stack: expect.any(String)
      });
    });

    it('should handle NotFoundError with 404 status', () => {
      const error = new Error('Resource not found');
      error.name = 'NotFoundError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Resource not found',
        stack: expect.any(String)
      });
    });

    it('should handle ConflictError with 409 status', () => {
      const error = new Error('Resource conflict');
      error.name = 'ConflictError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Conflict',
        message: 'Resource conflict',
        stack: expect.any(String)
      });
    });

    it('should handle TooManyRequestsError with 429 status', () => {
      const error = new Error('Rate limit exceeded');
      error.name = 'TooManyRequestsError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        stack: expect.any(String)
      });
    });

    it('should include stack trace in development environment', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Development error');
      error.stack = 'Error stack trace';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Development error',
        stack: 'Error stack trace'
      });
    });

    it('should not include stack trace in production environment', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');
      error.stack = 'Error stack trace';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with route information', () => {
      notFoundHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Route GET /test-route not found',
        availableRoutes: [
          'GET /health',
          'GET /health/detailed',
          'GET /weather?city=<city_name>',
          'GET /weather/cache/stats',
          'DELETE /weather/cache'
        ]
      });
    });

    it('should handle different HTTP methods', () => {
      mockReq.method = 'POST';
      mockReq.originalUrl = '/api/test';
      
      notFoundHandler(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Route POST /api/test not found',
        availableRoutes: [
          'GET /health',
          'GET /health/detailed',
          'GET /weather?city=<city_name>',
          'GET /weather/cache/stats',
          'DELETE /weather/cache'
        ]
      });
    });
  });
});
