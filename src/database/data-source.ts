import * as net from 'net';
if (typeof (net as any).setDefaultAutoSelectFamily === 'function') {
  (net as any).setDefaultAutoSelectFamily(false);
}

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/romonijon_db';
const requiresSsl =
  process.env.NODE_ENV === 'production' ||
  databaseUrl.includes('sslmode=require') ||
  databaseUrl.includes('neon.tech');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  synchronize: false,
  ssl: requiresSsl ? { rejectUnauthorized: false } : false,
  extra: {
    max: 10,
    connectionTimeoutMillis: 10000,
  },
  logging: process.env.NODE_ENV !== 'production',
});
