/**
 * Tests for retry utility functions
 */

const { retryWithExponentialBackoff, sleep } = require('../../../src/utils/retry');

describe('Retry Utility Functions', () => {
  describe('sleep', () => {
    it('should sleep for the specified number of milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90);
      expect(end - start).toBeLessThan(200);
    });

    it('should handle zero sleep time', async () => {
      const start = Date.now();
      await sleep(0);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('retryWithExponentialBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn();
      mockFn
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(mockFn, {
        maxAttempts: 3,
        baseDelay: 10
      });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const mockFn = jest.fn().mockRejectedValue({ code: 'ECONNRESET' });
      
      try {
        await retryWithExponentialBackoff(mockFn, {
          maxAttempts: 2,
          baseDelay: 10
        });
        fail('Expected function to throw');
      } catch (error) {
        expect(error.code).toBe('ECONNRESET');
      }
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry if shouldRetry returns false', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Client error'));
      
      await expect(retryWithExponentialBackoff(mockFn, {
        maxAttempts: 3,
        baseDelay: 10,
        shouldRetry: (error) => error.message !== 'Client error'
      })).rejects.toThrow('Client error');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff delay', async () => {
      const mockFn = jest.fn();
      mockFn
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');
      
      const start = Date.now();
      await retryWithExponentialBackoff(mockFn, {
        maxAttempts: 3,
        baseDelay: 50,
        maxDelay: 200
      });
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(50); // At least first delay
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should respect max delay', async () => {
      const mockFn = jest.fn();
      mockFn
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');
      
      const start = Date.now();
      await retryWithExponentialBackoff(mockFn, {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 100
      });
      const end = Date.now();
      
      // Should not exceed max delay significantly
      expect(end - start).toBeLessThan(300);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should handle axios errors correctly', async () => {
      const axiosError = {
        response: { status: 500 },
        code: 'ECONNABORTED'
      };
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(axiosError)
        .mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(mockFn, {
        maxAttempts: 2,
        baseDelay: 10
      });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry 4xx errors by default', async () => {
      const clientError = {
        response: { status: 400 },
        code: 'BAD_REQUEST'
      };
      
      const mockFn = jest.fn().mockRejectedValue(clientError);
      
      await expect(retryWithExponentialBackoff(mockFn, {
        maxAttempts: 3,
        baseDelay: 10
      })).rejects.toEqual(clientError);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry 5xx errors by default', async () => {
      const serverError = {
        response: { status: 500 },
        code: 'INTERNAL_SERVER_ERROR'
      };
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(mockFn, {
        maxAttempts: 2,
        baseDelay: 10
      });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry network errors by default', async () => {
      const networkError = {
        code: 'ENOTFOUND'
      };
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(mockFn, {
        maxAttempts: 2,
        baseDelay: 10
      });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});
