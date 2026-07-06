/**
 * Highly optimized, O(1) Least Recently Used (LRU) Cache utilizing the insertion order property of JS Map.
 */
export class LRUCache {
  /**
   * @param {number} capacity - Maximum number of cache entries to store.
   */
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Retrieves an item from the cache and updates its recency.
   * @param {string} key - Cache key.
   * @returns {*} Cached value or null if not found.
   */
  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    // Delete and re-set to move key to the end of the insertion order (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Inserts or updates an item in the cache, evicting the oldest key if capacity is exceeded.
   * @param {string} key - Cache key.
   * @param {*} value - Cache value.
   */
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // The keys().next().value returns the first key in the Map, which is the oldest (LRU)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Clears all cache entries.
   */
  clear() {
    this.cache.clear();
  }
}
