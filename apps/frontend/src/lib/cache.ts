interface CacheItem<T> {
  data: T;
  expiry: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  /**
   * Set a value in the cache
   * @param key Unique string identifier for the cache item
   * @param data The data to store
   * @param ttlHours Time to live in hours (default: 24)
   */
  set(key: string, data: any, ttlHours: number = 24): void {
    const expiry = Date.now() + ttlHours * 60 * 60 * 1000;
    this.cache.set(key, { data, expiry });
  }

  /**
   * Get a value from the cache
   * @param key Unique string identifier
   * @returns The stored data or null if expired/not-found
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * Clear the entire cache manually
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global instance for application-wide caching
export const graphCache = new InMemoryCache();
