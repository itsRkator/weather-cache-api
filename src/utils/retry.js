/**
 * Utility for implementing exponential backoff retry logic
 */

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a function with exponential backoff retry logic
 * @param {Function} fn - Function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of retry attempts
 * @param {number} options.baseDelay - Base delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @returns {Promise} Promise that resolves with the function result or rejects with the final error
 */
const retryWithExponentialBackoff = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => {
      // Retry on 5xx errors, timeouts, and network errors
      return error.response?.status >= 500 || 
             error.code === 'ECONNABORTED' || 
             error.code === 'ENOTFOUND' ||
             error.code === 'ECONNRESET';
    }
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's the last attempt or if the error shouldn't be retried
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

module.exports = {
  retryWithExponentialBackoff,
  sleep
};
