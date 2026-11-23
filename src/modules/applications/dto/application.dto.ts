import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  ValidateNested,
  Matches,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationCategory, ApplicationStatus } from '../../../common/constants';

class ApplicantInfoDto {
  @ApiProperty({ example: 'Rahim Uddin' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiPropertyOptional({ example: 'rahim@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Kurigram' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Roumari' })
  @IsOptional()
  @IsString()
  upazila?: string;

  @ApiPropertyOptional({ example: 'Bamondanga, Roumari' })
  @IsOptional()
  @IsString()
  address?: string;
}

class ConsentDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  privacyAccepted: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  contactAllowed: boolean;
}

export class CreateApplicationDto {
  @ApiProperty({ type: ApplicantInfoDto })
  @ValidateNested()
  @Type(() => ApplicantInfoDto)
  applicant: ApplicantInfoDto;

  @ApiProperty({ enum: ApplicationCategory, example: ApplicationCategory.MEDICAL })
  @IsEnum(ApplicationCategory)
  category: ApplicationCategory;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber()
  requestedAmount?: number;

  @ApiProperty({ example: 'Urgent medical assistance needed for hospital operation.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: ConsentDto })
  @ValidateNested()
  @Type(() => ConsentDto)
  consent: ConsentDto;
}

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.UNDER_REVIEW })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ example: 'Documents verified by local field volunteer.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: 20000 })
  @IsOptional()
  @IsNumber()
  approvedAmount?: number;
}

export class TrackApplicationDto {
  @ApiProperty({ example: 'RKF-2026-000123' })
  @IsString()
  @IsNotEmpty()
  referenceCode: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone: string;
}

export class AddDocumentDto {
  @ApiProperty({ example: 'PRESCRIPTION' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: 'prescription_dr_hossain.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'https://storage.romonijon.org/documents/uuid.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ example: 1048576 })
  @IsOptional()
  @IsNumber()
  fileSizeBytes?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
