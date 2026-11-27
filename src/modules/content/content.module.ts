import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page, NewsEvent, GalleryItem, Announcement } from './entities/content.entity';
import { WebsiteSetting } from './entities/website-setting.entity';
import { MediaFile } from './entities/media-file.entity';
import { NoticeModal } from './entities/notice-modal.entity';
import { HeroSlide } from './entities/hero-slide.entity';
import { FooterConfig } from './entities/footer-config.entity';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Page,
      NewsEvent,
      GalleryItem,
      Announcement,
      WebsiteSetting,
      MediaFile,
      NoticeModal,
      HeroSlide,
      FooterConfig,
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService, TypeOrmModule],
})
export class ContentModule {}
