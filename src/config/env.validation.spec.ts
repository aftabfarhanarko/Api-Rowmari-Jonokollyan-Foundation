import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('should pass with valid environment variables and provide defaults', () => {
    const config = {
      NODE_ENV: 'development',
      PORT: '4000',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      REDIS_HOST: '127.0.0.1',
      JWT_ACCESS_SECRET: 'supersecret',
      JWT_REFRESH_SECRET: 'superrefreshsecret',
    };

    const validated = validateEnvironment(config);
    expect(validated.PORT).toBe(4000);
    expect(validated.NODE_ENV).toBe('development');
    expect(validated.REDIS_PORT).toBe(6379);
    expect(validated.THROTTLE_LIMIT).toBe(100);
  });

  it('should throw an error if NODE_ENV is an invalid enum value', () => {
    const config = {
      NODE_ENV: 'invalid_env',
    };

    expect(() => validateEnvironment(config)).toThrow();
  });

  it('requires strong distinct JWT secrets and a database URL in production', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(/Production requires distinct JWT/);
    expect(() => validateEnvironment({
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
    })).toThrow(/DATABASE_URL/);
  });
});
