import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { SmsAdapter, EmailAdapter } from '../adapters/notification.adapters';

export interface SendSmsJobPayload {
  to: string;
  message: string;
}

export interface SendEmailJobPayload {
  to: string;
  subject: string;
  html: string;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly smsAdapter: SmsAdapter,
    private readonly emailAdapter: EmailAdapter,
  ) {
    super();
  }

  onModuleInit() {
    if (this.worker) {
      this.worker.on('error', (err) => {
        this.logger.warn(`Notification worker connection warning: ${err.message}`);
      });
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing notification queue job [${job.id}] - Action: ${job.name}`);

    switch (job.name) {
      case 'send-sms': {
        const payload = job.data as SendSmsJobPayload;
        return this.smsAdapter.sendSms({
          to: payload.to,
          message: payload.message,
        });
      }

      case 'send-email': {
        const payload = job.data as SendEmailJobPayload;
        return this.emailAdapter.sendEmail({
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        });
      }

      default:
        this.logger.warn(`Unrecognized job action in notifications queue: ${job.name}`);
        return null;
    }
  }
}
