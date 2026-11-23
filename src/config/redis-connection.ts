import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

/** Build a single Redis connection configuration for ioredis and BullMQ. */
export function getRedisConnectionOptions(config: ConfigService): RedisOptions {
  const redisUrl = config.get<string>('redis.url');
  if (!redisUrl) {
    return {
      host: config.get<string>('redis.host', '127.0.0.1'),
      port: config.get<number>('redis.port', 6379),
      password: config.get<string>('redis.password') || undefined,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(redisUrl);
  } catch {
    throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL.');
  }

  if (!['redis:', 'rediss:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL.');
  }

  const databasePath = parsed.pathname.replace(/^\//, '');
  const database = databasePath ? Number(databasePath) : undefined;
  if (database !== undefined && (!Number.isInteger(database) || database < 0)) {
    throw new Error('REDIS_URL path must be a non-negative integer database index.');
  }

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: database,
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}
