import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('database.url');
  const isProduction = configService.get<string>('nodeEnv') === 'production';
  const requiresSsl =
    isProduction ||
    Boolean(databaseUrl?.includes('sslmode=require') || databaseUrl?.includes('neon.tech'));

  return {
    type: 'postgres',
    url: databaseUrl,
    autoLoadEntities: true,
    synchronize: !isProduction, // In development, sync is permitted for initial setup, migrations for prod
    logging: !isProduction ? ['error', 'warn'] : ['error'],
    ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    extra: {
      max: 20,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    },
  };
};
