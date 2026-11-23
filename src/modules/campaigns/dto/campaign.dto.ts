import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '../../../common/constants';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Winter Blanket Distribution 2026' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'winter-blanket-distribution-2026' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Providing warmth and warm clothes to flood-affected families in Roumari and Char areas.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Disaster Relief' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 100000, minimum: 1 })
  @IsNumber()
  @Min(1)
  targetAmount: number;

  @ApiProperty({ example: '2026-11-25T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'https://storage.romonijon.org/campaigns/winter.jpg' })
  @IsOptional()
  @IsString()
  bannerImageUrl?: string;

  @ApiPropertyOptional({ enum: CampaignStatus, default: CampaignStatus.DRAFT })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class CreateCampaignUpdateDto {
  @ApiProperty({ example: 'First batch of 500 blankets procured!' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Thanks to generous donors, the first batch has reached our Roumari hub.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'https://storage.romonijon.org/updates/batch1.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
