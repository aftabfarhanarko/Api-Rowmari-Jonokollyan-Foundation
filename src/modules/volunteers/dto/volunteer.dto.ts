import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Matches, IsEmail, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterVolunteerDto {
  @ApiProperty({ example: 'Tanvir Ahmed' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+8801912345678' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone: string;

  @ApiPropertyOptional({ example: 'tanvir@example.com' })
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

  @ApiPropertyOptional({ example: 'First aid, event coordination, photography' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  availabilityHoursPerWeek?: number;
}

export class CreateAssignmentDto {
  @ApiProperty({ example: 'uuid-of-volunteer' })
  @IsUUID()
  volunteerId: string;

  @ApiProperty({ example: 'Medical Camp Patient Registration' })
  @IsString()
  @IsNotEmpty()
  taskTitle: string;

  @ApiPropertyOptional({ example: 'uuid-camp-id' })
  @IsOptional()
  @IsString()
  eventOrCampId?: string;

  @ApiProperty({ example: 'Registration Lead' })
  @IsString()
  @IsNotEmpty()
  assignedRole: string;

  @ApiProperty({ example: '2026-11-28T09:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-11-28T17:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
