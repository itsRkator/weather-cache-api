/**
 * In-memory cache service for weather data
 */

class CacheService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data by key
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Set data in cache with TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttlMs - Time to live in milliseconds
   */
  set(key, data, ttlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Delete cached data by key
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Clean up expired entries every 5 minutes (only in non-test environments)
let cleanupInterval;
if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(() => {
    cacheService.cleanup();
  }, 5 * 60 * 1000);
}

// Add cleanup method for tests
cacheService.stopCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

module.exports = cacheService;
