import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';
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

  @ApiProperty({ example: 'Romonijon Kallyan Foundation is a dedicated charitable NGO...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.PUBLISHED })
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

  @ApiProperty({ example: 'NEWS', enum: ['NEWS', 'EVENT'] })
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

  @ApiProperty({ example: 'https://storage.romonijon.org/gallery/med_camp_1.jpg' })
  @IsString()
  @IsNotEmpty()
  mediaUrl: string;

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

  @ApiPropertyOptional({ example: '2026-12-01T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
