import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { SmsAdapter, EmailAdapter } from './adapters/notification.adapters';
import { NotificationChannel, NotificationStatus } from '../../common/constants';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    private readonly smsAdapter: SmsAdapter,
    private readonly emailAdapter: EmailAdapter,
    @Optional()
    @InjectQueue('notifications')
    private readonly notificationQueue?: Queue,
  ) {}

  async queueSmsNotification(phone: string, message: string): Promise<void> {
    if (this.notificationQueue) {
      await this.notificationQueue.add(
        'send-sms',
        { to: phone, message },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );
      this.logger.log(`Enqueued background SMS job for recipient: ${phone}`);
    } else {
      await this.sendSmsNotification(phone, message);
    }
  }

  async queueEmailNotification(email: string, subject: string, html: string): Promise<void> {
    if (this.notificationQueue) {
      await this.notificationQueue.add(
        'send-email',
        { to: email, subject, html },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );
      this.logger.log(`Enqueued background Email job for recipient: ${email}`);
    } else {
      await this.sendEmailNotification(email, subject, html);
    }
  }

  async sendSmsNotification(phone: string, message: string): Promise<Notification> {
    const notif = this.notifRepo.create({
      recipientIdentifier: phone,
      channel: NotificationChannel.SMS,
      content: message,
      status: NotificationStatus.PENDING,
    });
    const saved = await this.notifRepo.save(notif);

    try {
      await this.smsAdapter.sendSms({ to: phone, message });
      saved.status = NotificationStatus.SENT;
      saved.sentAt = new Date();
    } catch (err: any) {
      saved.status = NotificationStatus.FAILED;
      saved.errorMessage = err.message;
      this.logger.error(`Failed sending SMS to ${phone}: ${err.message}`);
    }

    return this.notifRepo.save(saved);
  }

  async sendEmailNotification(email: string, subject: string, html: string): Promise<Notification> {
    const notif = this.notifRepo.create({
      recipientIdentifier: email,
      channel: NotificationChannel.EMAIL,
      subject,
      content: html,
      status: NotificationStatus.PENDING,
    });
    const saved = await this.notifRepo.save(notif);

    try {
      await this.emailAdapter.sendEmail({ to: email, subject, html });
      saved.status = NotificationStatus.SENT;
      saved.sentAt = new Date();
    } catch (err: any) {
      saved.status = NotificationStatus.FAILED;
      saved.errorMessage = err.message;
      this.logger.error(`Failed sending email to ${email}: ${err.message}`);
    }

    return this.notifRepo.save(saved);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Notification>> {
    const [items, total] = await this.notifRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return createPaginationResult(items, total, query.page, query.limit);
  }
}
