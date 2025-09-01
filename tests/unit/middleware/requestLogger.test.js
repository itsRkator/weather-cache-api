/**
 * Tests for request logging middleware
 */

const requestLogger = require('../../../src/middleware/requestLogger');

describe('Request Logger Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/test',
      _startAt: [1234567890, 123456789],
      headers: {
        'user-agent': 'test-agent',
        'referer': 'http://test.com'
      }
    };
    mockRes = {
      statusCode: 200,
      _startAt: [1234567890, 123456800],
      getHeader: jest.fn().mockReturnValue('1024')
    };
    mockNext = jest.fn();
    
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  it('should be a function', () => {
    expect(typeof requestLogger).toBe('function');
  });

  it('should call next middleware', () => {
    requestLogger(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should work in development environment', () => {
    process.env.NODE_ENV = 'development';
    
    expect(() => {
      requestLogger(mockReq, mockRes, mockNext);
    }).not.toThrow();
    
    expect(mockNext).toHaveBeenCalled();
  });

  it('should work in production environment', () => {
    process.env.NODE_ENV = 'production';
    
    expect(() => {
      requestLogger(mockReq, mockRes, mockNext);
    }).not.toThrow();
    
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle requests without _startAt', () => {
    delete mockReq._startAt;
    delete mockRes._startAt;
    
    expect(() => {
      requestLogger(mockReq, mockRes, mockNext);
    }).not.toThrow();
    
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle different HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    methods.forEach(method => {
      mockReq.method = method;
      expect(() => {
        requestLogger(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });
  });

  it('should handle different status codes', () => {
    const statusCodes = [200, 201, 400, 404, 500];
    
    statusCodes.forEach(statusCode => {
      mockRes.statusCode = statusCode;
      expect(() => {
        requestLogger(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });
  });
});
