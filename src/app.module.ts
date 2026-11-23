import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from './config/configuration';
import { getTypeOrmConfig } from './config/typeorm.config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuditLoggerInterceptor } from './common/interceptors/audit-logger.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

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

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
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
          host: config.get<string>('redis.host', '127.0.0.1'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password') || undefined,
          maxRetriesPerRequest: null,
          lazyConnect: true,
          enableOfflineQueue: false,
          retryStrategy: () => 5000,
        },
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
    ]),

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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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
