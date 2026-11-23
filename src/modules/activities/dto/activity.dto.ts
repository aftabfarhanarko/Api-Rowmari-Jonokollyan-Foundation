import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({ example: 'Free Medical Consultation Day' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Provided free consultation and essential medicines to over 350 rural patients.' })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiProperty({ example: 'Detailed report of the day, doctors involved, and treatments provided...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'https://storage.romonijon.org/activities/cover.jpg' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({ example: '2026-11-20' })
  @IsDateString()
  activityDate: string;

  @ApiProperty({ example: 'Roumari Model College Grounds' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ example: 350 })
  @IsOptional()
  @IsInt()
  @Min(0)
  beneficiariesCount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
