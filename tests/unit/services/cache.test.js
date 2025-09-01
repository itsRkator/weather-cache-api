/**
 * Tests for cache service
 */

const cacheService = require('../../../src/services/cache');

describe('Cache Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.clear();
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const result = cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return cached data for valid key', () => {
      const testData = { city: 'London', temp: 15 };
      cacheService.set('london', testData, 60000); // 1 minute TTL
      
      const result = cacheService.get('london');
      expect(result).toEqual(testData);
    });

    it('should return null for expired data', () => {
      const testData = { city: 'London', temp: 15 };
      cacheService.set('london', testData, 1); // 1ms TTL
      
      // Wait for expiration
      setTimeout(() => {
        const result = cacheService.get('london');
        expect(result).toBeNull();
      }, 10);
    });
  });

  describe('set', () => {
    it('should store data with TTL', () => {
      const testData = { city: 'Paris', temp: 20 };
      cacheService.set('paris', testData, 60000);
      
      const result = cacheService.get('paris');
      expect(result).toEqual(testData);
    });

    it('should overwrite existing data', () => {
      const initialData = { city: 'Tokyo', temp: 25 };
      const updatedData = { city: 'Tokyo', temp: 30 };
      
      cacheService.set('tokyo', initialData, 60000);
      cacheService.set('tokyo', updatedData, 60000);
      
      const result = cacheService.get('tokyo');
      expect(result).toEqual(updatedData);
    });
  });

  describe('delete', () => {
    it('should remove cached data', () => {
      const testData = { city: 'Berlin', temp: 18 };
      cacheService.set('berlin', testData, 60000);
      
      expect(cacheService.get('berlin')).toEqual(testData);
      
      cacheService.delete('berlin');
      expect(cacheService.get('berlin')).toBeNull();
    });

    it('should handle deletion of non-existent key', () => {
      expect(() => {
        cacheService.delete('non-existent');
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all cached data', () => {
      cacheService.set('city1', { data: 'test1' }, 60000);
      cacheService.set('city2', { data: 'test2' }, 60000);
      cacheService.set('city3', { data: 'test3' }, 60000);
      
      expect(cacheService.getStats().totalEntries).toBe(3);
      
      cacheService.clear();
      
      expect(cacheService.getStats().totalEntries).toBe(0);
      expect(cacheService.get('city1')).toBeNull();
      expect(cacheService.get('city2')).toBeNull();
      expect(cacheService.get('city3')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics for empty cache', () => {
      const stats = cacheService.getStats();
      
      expect(stats).toEqual({
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0
      });
    });

    it('should return correct statistics for cache with data', (done) => {
      cacheService.set('city1', { data: 'test1' }, 60000);
      cacheService.set('city2', { data: 'test2' }, 1); // Will expire quickly
      
      // Wait for expiration
      setTimeout(() => {
        const stats = cacheService.getStats();
        
        expect(stats.totalEntries).toBe(2);
        expect(stats.validEntries).toBe(1);
        expect(stats.expiredEntries).toBe(1);
        done();
      }, 10);
    });

    it('should update statistics after expiration', (done) => {
      cacheService.set('temp', { data: 'test' }, 1); // 1ms TTL
      
      setTimeout(() => {
        const stats = cacheService.getStats();
        expect(stats.totalEntries).toBe(1);
        expect(stats.validEntries).toBe(0);
        expect(stats.expiredEntries).toBe(1);
        done();
      }, 10);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      cacheService.set('valid', { data: 'test' }, 60000);
      cacheService.set('expired', { data: 'test' }, 1);
      
      setTimeout(() => {
        cacheService.cleanup();
        
        const stats = cacheService.getStats();
        expect(stats.totalEntries).toBe(1);
        expect(stats.validEntries).toBe(1);
        expect(stats.expiredEntries).toBe(0);
        
        expect(cacheService.get('valid')).toEqual({ data: 'test' });
        expect(cacheService.get('expired')).toBeNull();
        
        done();
      }, 10);
    });
  });

  describe('TTL behavior', () => {
    it('should handle different TTL values', () => {
      const shortTTL = 100; // 100ms
      const longTTL = 60000; // 1 minute
      
      cacheService.set('short', { data: 'short' }, shortTTL);
      cacheService.set('long', { data: 'long' }, longTTL);
      
      expect(cacheService.get('short')).toEqual({ data: 'short' });
      expect(cacheService.get('long')).toEqual({ data: 'long' });
      
      setTimeout(() => {
        expect(cacheService.get('short')).toBeNull();
        expect(cacheService.get('long')).toEqual({ data: 'long' });
      }, 150);
    });
  });
});
