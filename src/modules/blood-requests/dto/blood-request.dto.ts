import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Matches,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BloodGroup,
  BloodRequestUrgency,
  BloodRequestStatus,
  DonorMatchStatus,
} from '../../../common/constants';

export class CreateBloodRequestDto {
  @ApiProperty({ example: 'Fatema Begum' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ enum: BloodGroup, example: BloodGroup.B_POSITIVE })
  @IsEnum(BloodGroup)
  bloodGroup: BloodGroup;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  unitsNeeded: number;

  @ApiProperty({ enum: BloodRequestUrgency, example: BloodRequestUrgency.URGENT })
  @IsEnum(BloodRequestUrgency)
  urgency: BloodRequestUrgency;

  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' })
  @IsDateString()
  requiredDate: string;

  @ApiProperty({ example: 'Roumari Upazila Health Complex' })
  @IsString()
  @IsNotEmpty()
  hospitalName: string;

  @ApiPropertyOptional({ example: 'Ward 4, Bed 12' })
  @IsOptional()
  @IsString()
  hospitalAddress?: string;

  @ApiPropertyOptional({ example: 'Kurigram' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Roumari' })
  @IsOptional()
  @IsString()
  upazila?: string;

  @ApiProperty({ example: 'Siddiqur Rahman (Brother)' })
  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  contactPhone: string;

  @ApiPropertyOptional({ example: 'Emergency surgery blood requirement' })
  @IsOptional()
  @IsString()
  medicalReason?: string;
}

export class MatchDonorDto {
  @ApiProperty({ example: 'uuid-donor-profile-id' })
  @IsUUID()
  donorProfileId: string;

  @ApiPropertyOptional({ example: 'Initial coordinator outreach' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMatchStatusDto {
  @ApiProperty({ enum: DonorMatchStatus, example: DonorMatchStatus.AGREED })
  @IsEnum(DonorMatchStatus)
  status: DonorMatchStatus;

  @ApiPropertyOptional({ example: 'Donor confirmed arrival at 2:00 PM' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordOutcomeDto {
  @ApiProperty({ example: '2026-11-24' })
  @IsDateString()
  donationDate: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  unitsDonated: number;

  @ApiPropertyOptional({ example: 'Successful donation, donor and patient well' })
  @IsOptional()
  @IsString()
  feedback?: string;
}
