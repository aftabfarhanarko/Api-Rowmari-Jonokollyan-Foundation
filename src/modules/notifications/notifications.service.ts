import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ) {}

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
