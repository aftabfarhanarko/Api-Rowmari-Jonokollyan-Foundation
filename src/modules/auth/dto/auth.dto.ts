import { IsString, Matches, MinLength, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodGroup } from '../../../common/constants';

export class LoginDto {
  @ApiProperty({ example: 'admin@romonijon.org', description: 'Registered email address' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SuperAdmin2026!' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Md. Abdur Rahim', description: 'Full name of user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'rahim@example.com', description: 'Valid email address' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+8801712345678', description: 'Contact phone number' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Phone must be a valid international phone number' })
  phone: string;

  @ApiProperty({ example: 'SecurePassword123', description: 'Password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

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

  @ApiPropertyOptional({ enum: BloodGroup, example: BloodGroup.O_POSITIVE, description: 'Optional blood donor group' })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: false, description: 'Whether the user wants to enroll as a volunteer' })
  @IsOptional()
  @IsBoolean()
  isVolunteerInterest?: boolean;
}
