import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisConnectionOptions } from '../../config/redis-connection';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly config: ConfigService) {
    this.initClient();
  }

  private initClient() {
    try {
      const connection = getRedisConnectionOptions(this.config);

      this.client = new Redis({
        ...connection,
        retryStrategy: (times) => {
          // If Redis isn't up locally during development, retry gracefully without crash
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        this.logger.log('Connected to Redis.');
      }).catch((err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection deferred/offline: ${err.message}. Operating in in-memory fallback mode.`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });
    } catch (e: any) {
      this.logger.warn(`Failed initializing Redis client: ${e.message}`);
    }
  }

  // In-memory fallback map if redis is offline in dev
  private fallbackMemoryStore = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fall back to memory
      }
    }
    const item = this.fallbackMemoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.fallbackMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // Fall back to memory
      }
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.fallbackMemoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {}
    }
    this.fallbackMemoryStore.delete(key);
  }

  async incr(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.incr(key);
      } catch {}
    }
    const current = parseInt(this.fallbackMemoryStore.get(key)?.value || '0', 10);
    const next = current + 1;
    this.fallbackMemoryStore.set(key, { value: next.toString(), expiresAt: Date.now() + 60000 });
    return next;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.expire(key, ttlSeconds);
      } catch {}
    }
    const item = this.fallbackMemoryStore.get(key);
    if (item) {
      item.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async ping(): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client is unavailable.');
    }
    const response = await this.client.ping();
    if (response !== 'PONG') {
      throw new Error('Redis did not return a healthy response.');
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
