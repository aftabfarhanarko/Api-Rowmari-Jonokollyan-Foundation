export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/romonijon_db',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    name: process.env.DATABASE_NAME || 'romonijon_db',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_for_dev_mode_only',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev_mode_only',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  cors: {
    webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  },
  storage: {
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    bucket: process.env.OBJECT_STORAGE_BUCKET || 'romonijon-documents',
    accessKey: process.env.OBJECT_STORAGE_ACCESS_KEY,
    secretKey: process.env.OBJECT_STORAGE_SECRET_KEY,
  },
  sms: {
    apiKey: process.env.SMS_PROVIDER_API_KEY,
    senderId: process.env.SMS_SENDER_ID || 'RKF_ALERT',
  },
  email: {
    apiKey: process.env.EMAIL_PROVIDER_API_KEY,
    from: process.env.EMAIL_FROM || 'notifications@romonijon.org',
  },
});
