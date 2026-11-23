import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsAdapter, EmailAdapter } from './adapters/notification.adapters';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmsAdapter, EmailAdapter],
  exports: [NotificationsService, SmsAdapter, EmailAdapter, TypeOrmModule],
})
export class NotificationsModule {}
