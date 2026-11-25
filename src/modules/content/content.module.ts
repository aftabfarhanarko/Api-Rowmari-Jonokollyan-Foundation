import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page, NewsEvent, GalleryItem, Announcement } from './entities/content.entity';
import { WebsiteSetting } from './entities/website-setting.entity';
import { MediaFile } from './entities/media-file.entity';
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
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService, TypeOrmModule],
})
export class ContentModule {}
