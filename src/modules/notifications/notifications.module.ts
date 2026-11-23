import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsAdapter, EmailAdapter } from './adapters/notification.adapters';
import { NotificationProcessor } from './processors/notification.processor';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    SmsAdapter,
    EmailAdapter,
    NotificationProcessor,
  ],
  exports: [
    NotificationsService,
    SmsAdapter,
    EmailAdapter,
    BullModule,
    TypeOrmModule,
  ],
})
export class NotificationsModule {}
