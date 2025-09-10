import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) {
      logger.error('Redis connection failed', { times });
      return null;
    }
    return Math.min(times * 200, 1000);
  }
};

class RedisCache {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(redisConfig);
    
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error('Redis error', err);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis get error', { error, key });
      return null;
    }
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    try {
      if (!this.isConnected) return;
      const stringValue = JSON.stringify(value);
      if (ttlMs) {
        await this.client.set(key, stringValue, 'PX', ttlMs);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      logger.error('Redis set error', { error, key });
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error', { error, key });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Redis pattern invalidation error', { error, pattern });
    }
  }
}

export const redisCache = new RedisCache();
