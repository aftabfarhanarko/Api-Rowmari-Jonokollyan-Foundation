import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ContentModule } from '../content/content.module';
import { UsersModule } from '../users/users.module';

import { User } from '../users/entities/user.entity';
import { Page, NewsEvent, GalleryItem, Announcement } from '../content/entities/content.entity';
import { WebsiteSetting } from '../content/entities/website-setting.entity';
import { MediaFile } from '../content/entities/media-file.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Donation } from '../donations/entities/donation.entity';
import { HelpApplication } from '../applications/entities/help-application.entity';
import { BloodRequest } from '../blood-requests/entities/blood-request.entity';
import { ContactMessage } from '../contact/entities/contact-message.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Page,
      NewsEvent,
      GalleryItem,
      Announcement,
      WebsiteSetting,
      MediaFile,
      Campaign,
      Donation,
      HelpApplication,
      BloodRequest,
      ContactMessage,
      AuditLog,
    ]),
    ContentModule,
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
