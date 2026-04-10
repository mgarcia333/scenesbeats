/**
 * Utility to retry an async function with exponential backoff.
 * 
 * @param {Function} fn - The async function to retry.
 * @param {Object} options - Retry options.
 * @param {number} options.retries - Maximum number of retries.
 * @param {number} options.delay - Initial delay in ms.
 * @param {string} options.context - Text context for logging.
 * @returns {Promise<any>}
 */
export const withRetry = async (fn, { retries = 3, delay = 1000, context = "AI call" } = {}) => {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      if (i > 0) {
        console.log(`🔄 [${context}] Retry attempt ${i}/${retries}...`);
      }
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Determine if we should retry
      const status = error.status || error.response?.status;
      const isQuota = error.message?.includes('QUOTA') || error.message?.includes('429');
      const isTransient = status === 503 || status === 504 || status === 502 || status === 429 || isQuota || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';

      if (i === retries || !isTransient) {
        throw error;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      console.warn(`⚠️ [${context}] Failed with ${status || error.message}. Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};
