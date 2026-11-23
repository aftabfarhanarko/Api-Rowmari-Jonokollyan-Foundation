import { IsString, IsNotEmpty, Matches, IsOptional, IsEmail, MinLength, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '../../../common/constants';

export class CreateUserDto {
  @ApiProperty({ example: 'Rahim Uddin' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'rahim@example.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiPropertyOptional({ example: 'SecurePassword123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

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

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Rahim Uddin' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'user@romonijon.org' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone?: string;

  @ApiPropertyOptional({ example: 'Kurigram' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Roumari' })
  @IsOptional()
  @IsString()
  upazila?: string;

  @ApiPropertyOptional({ example: 'Village...' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateUserRolesDto {
  @ApiProperty({
    example: [RoleName.BLOOD_COORDINATOR, RoleName.VOLUNTEER_MANAGER],
    enum: RoleName,
    isArray: true,
    description: 'Array of role names selected from Super Admin panel checkboxes',
  })
  @IsArray({ message: 'roles must be an array of role names' })
  @IsEnum(RoleName, { each: true, message: 'Each role must be a valid system role name' })
  roles: RoleName[];
}
