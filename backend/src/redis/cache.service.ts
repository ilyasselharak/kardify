import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfig } from '../config/app-config.js';

/**
 * Small key/value cache backed by Redis when REDIS_URL is configured,
 * falling back to an in-process map (single instance / development only).
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis?: Redis;
  private readonly memory = new Map<string, { value: string; expiresAt: number }>();

  constructor(config: AppConfig) {
    if (config.redisUrl) {
      this.redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 2, lazyConnect: false });
      this.redis.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
    } else {
      this.logger.warn('REDIS_URL not set: using in-memory cache (not suitable for multiple instances)');
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const raw = this.redis ? await this.safe(() => this.redis!.get(key)) : this.memGet(key);
    if (raw == null) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (this.redis) {
      await this.safe(() => this.redis!.set(key, raw, 'EX', ttlSeconds));
      return;
    }
    this.memory.set(key, { value: raw, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  /** Atomically set a key only if it does not exist. Returns true if it was set. */
  async setIfAbsent(key: string, ttlSeconds: number): Promise<boolean> {
    if (this.redis) {
      const res = await this.safe(() => this.redis!.set(key, '1', 'EX', ttlSeconds, 'NX'));
      return res === 'OK' || res === undefined; // on redis failure, don't drop events
    }
    if (this.memGet(key) != null) return false;
    this.memory.set(key, { value: '1', expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (this.redis) {
      await this.safe(() => this.redis!.del(...keys));
      return;
    }
    keys.forEach((k) => this.memory.delete(k));
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => undefined);
  }

  private memGet(key: string): string | undefined {
    const entry = this.memory.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private async safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      return await fn();
    } catch (err) {
      this.logger.warn(`Cache operation failed: ${(err as Error).message}`);
      return undefined;
    }
  }
}
