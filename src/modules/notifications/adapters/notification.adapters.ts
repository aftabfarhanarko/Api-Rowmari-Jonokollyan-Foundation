import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsPayload {
  to: string;
  message: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class SmsAdapter {
  private readonly logger = new Logger(SmsAdapter.name);

  constructor(private readonly config: ConfigService) {}

  async sendSms(payload: SmsPayload): Promise<{ success: boolean; messageId?: string }> {
    // In production, integrate with local telecom SMS Gateway (e.g., Teletalk, Banglalink, Grameenphone, or BulkSMS provider)
    this.logger.log(`[SMS Gateway Mock] Dispatched SMS to ${payload.to.slice(0, 5)}***: "${payload.message}"`);
    return { success: true, messageId: `sms_${Date.now()}` };
  }
}

@Injectable()
export class EmailAdapter {
  private readonly logger = new Logger(EmailAdapter.name);

  constructor(private readonly config: ConfigService) {}

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }> {
    // In production, integrate with SMTP / SendGrid / Postmark / Amazon SES
    this.logger.log(`[Email Mock] Sent email to ${payload.to} | Subject: "${payload.subject}"`);
    return { success: true, messageId: `email_${Date.now()}` };
  }
}
