export class CacheService {
  private readonly kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Get a JSON-serializable value from cache.
   */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.kv.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // For safety in case legacy callers set raw strings
      return raw as unknown as T;
    }
  }

  /**
   * Set a JSON-serializable value with optional TTL in seconds.
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    await this.kv.put(key, str, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
  }

  /** Remove a single key. */
  async del(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  /** Remove multiple keys. */
  async mdelete(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.kv.delete(k)));
  }

  /** Build a namespaced key like: ns:part1:part2 */
  key(...parts: Array<string | number>): string {
    return parts.join(":");
  }
}

export default CacheService;
