import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsDateString, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '../../../common/constants';

export class CreatePageDto {
  @ApiProperty({ example: 'About Us' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'about-us' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Learn about our mission and vision' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'Summary description for the page' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Romonijon Kallyan Foundation is a dedicated charitable NGO...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsOptional()
  @IsString()
  bannerImageUrl?: string;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  sections?: any[];

  @ApiPropertyOptional({ example: 'About Us - Romonijon Janakalyan Foundation' })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional({ example: 'Official about page of RJF...' })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSystemPage?: boolean;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdatePageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  sections?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSystemPage?: boolean;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class CreateNewsEventDto {
  @ApiProperty({ example: 'Annual Winter Relief Campaign Inauguration' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'annual-winter-relief-inauguration' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'NEWS', enum: ['NEWS', 'EVENT', 'NOTICE'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Brief summary of the relief launch event...' })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiProperty({ example: 'Full article text and details...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'https://storage.romonijon.org/news/inauguration.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '2026-11-28T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateNewsEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ enum: ['NEWS', 'EVENT', 'NOTICE'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class CreateGalleryItemDto {
  @ApiProperty({ example: 'Medical Camp 2026 Doctors Team' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Medical Camp' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'https://storage.romonijon.org/gallery/med_camp_1.jpg' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ example: 'https://storage.romonijon.org/gallery/med_camp_1.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'IMAGE', enum: ['IMAGE', 'VIDEO'] })
  @IsOptional()
  @IsString()
  mediaType?: string;

  @ApiPropertyOptional({ example: 'Dedicated doctors volunteering in Roumari' })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Flood Warning & Emergency Shelter Ready' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'All flood affected families can reach out via our 24/7 hotline.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: 'URGENT', enum: ['INFO', 'WARNING', 'URGENT'] })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-12-01T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class WebsiteSettingDto {
  @ApiProperty({ example: 'site_title' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'রৌমারী জনকল্যাণ ফাউন্ডেশন' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class BulkUpdateWebsiteSettingsDto {
  @ApiProperty({ type: [WebsiteSettingDto] })
  @IsArray()
  settings: WebsiteSettingDto[];
}
