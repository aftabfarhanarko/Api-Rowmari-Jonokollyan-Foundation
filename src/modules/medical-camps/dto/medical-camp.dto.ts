import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalCampDto {
  @ApiProperty({ example: 'Roumari Flood Relief Free Medical Camp' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Providing comprehensive medical checkup, general doctor consultation, and free pediatric aid.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2026-12-05' })
  @IsDateString()
  campDate: string;

  @ApiProperty({ example: 'Roumari High School Field' })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiPropertyOptional({ example: 'Kurigram' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Roumari' })
  @IsOptional()
  @IsString()
  upazila?: string;
}

export class AddCampStaffDto {
  @ApiProperty({ example: 'Dr. Rafiqul Islam, MBBS' })
  @IsString()
  @IsNotEmpty()
  staffName: string;

  @ApiProperty({ example: 'DOCTOR', enum: ['DOCTOR', 'NURSE', 'PHARMACIST', 'VOLUNTEER_LEAD', 'REGISTRATION'] })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ example: 'General Medicine & Pediatrics' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: 'uuid-user-if-registered' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class RecordCampAttendanceDto {
  @ApiProperty({ example: 450 })
  @IsInt()
  @Min(0)
  totalPatients: number;

  @ApiProperty({ example: 150 })
  @IsInt()
  @Min(0)
  maleCount: number;

  @ApiProperty({ example: 200 })
  @IsInt()
  @Min(0)
  femaleCount: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  childCount: number;

  @ApiProperty({ example: 430 })
  @IsInt()
  @Min(0)
  prescriptionsGiven: number;

  @ApiPropertyOptional({ example: 35000 })
  @IsOptional()
  @IsNumber()
  freeMedicineDistributedValue?: number;

  @ApiPropertyOptional({ example: 'Camp concluded successfully with good local turnout.' })
  @IsOptional()
  @IsString()
  summaryNotes?: string;
}
