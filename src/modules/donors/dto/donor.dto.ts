import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodGroup } from '../../../common/constants';

export class RegisterDonorDto {
  @ApiProperty({ example: 'Al Amin' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+8801812345678' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({ enum: BloodGroup, example: BloodGroup.O_POSITIVE })
  @IsEnum(BloodGroup)
  bloodGroup: BloodGroup;

  @ApiPropertyOptional({ example: 'Kurigram' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Roumari' })
  @IsOptional()
  @IsString()
  upazila?: string;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsDateString()
  lastDonationDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  consentToContact?: boolean;
}

export class UpdateDonorAvailabilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional({ example: '2026-11-20' })
  @IsOptional()
  @IsDateString()
  lastDonationDate?: string;
}

export class PublicDonorSearchResultDto {
  id: string;
  bloodGroup: BloodGroup;
  district: string;
  upazila: string;
  isAvailable: boolean;
  isVerified: boolean;
  lastDonationDate: string | null;
}
