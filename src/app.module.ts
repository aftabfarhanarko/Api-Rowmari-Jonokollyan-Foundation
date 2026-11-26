import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { getTypeOrmConfig } from './config/typeorm.config';
import { getRedisConnectionOptions } from './config/redis-connection';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuditLoggerInterceptor } from './common/interceptors/audit-logger.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';

import { RedisModule } from './modules/redis/redis.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { DonorsModule } from './modules/donors/donors.module';
import { BloodRequestsModule } from './modules/blood-requests/blood-requests.module';
import { VolunteersModule } from './modules/volunteers/volunteers.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { MedicalCampsModule } from './modules/medical-camps/medical-camps.module';
import { DonationsModule } from './modules/donations/donations.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ContentModule } from './modules/content/content.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import { ContactModule } from './modules/contact/contact.module';
import { AdminModule } from './modules/admin/admin.module';
import { RoumariModule } from './modules/roumari/roumari.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),

    // PostgreSQL / TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),

    // Redis
    RedisModule,

    // BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          ...getRedisConnectionOptions(config),
          maxRetriesPerRequest: null,
          lazyConnect: true,
          enableOfflineQueue: false,
          retryStrategy: () => 5000,
        },
      }),
    }),

    // Rate Limiting (Multi-tier Throttler)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('throttle.ttl', 60000),
          limit: config.get<number>('throttle.limit', 100),
        },
        {
          name: 'short',
          ttl: 1000,
          limit: 10,
        },
        {
          name: 'strict',
          ttl: 60000,
          limit: 5,
        },
      ],
    }),

    // Domain Modules
    AccessControlModule,
    UsersModule,
    AuthModule,
    ApplicationsModule,
    DonorsModule,
    BloodRequestsModule,
    VolunteersModule,
    CampaignsModule,
    ActivitiesModule,
    MedicalCampsModule,
    DonationsModule,
    ExpensesModule,
    ContentModule,
    NotificationsModule,
    AuditModule,
    ReportsModule,
    HealthModule,
    ContactModule,
    AdminModule,
    RoumariModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
