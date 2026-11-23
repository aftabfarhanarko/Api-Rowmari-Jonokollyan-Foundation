import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import configuration from '../config/configuration';
import { validateEnvironment } from '../config/env.validation';
import { getTypeOrmConfig } from '../config/typeorm.config';
import { getRedisConnectionOptions } from '../config/redis-connection';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          ...getRedisConnectionOptions(config),
          maxRetriesPerRequest: null,
          lazyConnect: true,
          enableOfflineQueue: false,
        },
      }),
    }),
    NotificationsModule,
  ],
})
export class WorkerModule {}
