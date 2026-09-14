type CacheEntry<T> = {
  data: T;
  expiryTime: number;
};

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiryTime = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data: value, expiryTime });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiryTime) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const inMemoryCache = new InMemoryCache();
