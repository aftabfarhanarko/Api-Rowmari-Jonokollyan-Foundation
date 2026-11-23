import { ConfigService } from '@nestjs/config';
import { getRedisConnectionOptions } from './redis-connection';

describe('getRedisConnectionOptions', () => {
  const config = (values: Record<string, unknown>) => ({
    get: (key: string, fallback?: unknown) => values[key] ?? fallback,
  }) as ConfigService;

  it('parses Render-style Redis URLs and enables TLS for rediss', () => {
    const options = getRedisConnectionOptions(config({
      'redis.url': 'rediss://rkf-user:p%40ss@redis.example:6380/2',
    }));

    expect(options).toMatchObject({
      host: 'redis.example',
      port: 6380,
      username: 'rkf-user',
      password: 'p@ss',
      db: 2,
      tls: {},
    });
  });

  it('preserves host and password configuration for local Redis', () => {
    expect(getRedisConnectionOptions(config({
      'redis.host': 'localhost',
      'redis.port': 6381,
      'redis.password': 'local-secret',
    }))).toMatchObject({
      host: 'localhost',
      port: 6381,
      password: 'local-secret',
    });
  });

  it('rejects unsupported or malformed Redis URLs', () => {
    expect(() => getRedisConnectionOptions(config({ 'redis.url': 'http://redis.local' })))
      .toThrow(/REDIS_URL/);
  });
});
