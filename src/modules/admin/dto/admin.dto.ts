import { IsString, IsOptional, IsEnum, IsNotEmpty, IsEmail, MinLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../common/constants';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AdminUserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateUserStatusDto {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class CreateAdminUserDto {
  @ApiProperty({ example: 'মোহাম্মদ রফিকুল ইসলাম' })
  @IsString()
  @IsNotEmpty({ message: 'নাম প্রদান করা আবশ্যক' })
  fullName: string;

  @ApiProperty({ example: 'admin@rjf.org' })
  @IsEmail({}, { message: 'সঠিক ইমেইল ঠিকানা প্রদান করুন' })
  email: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @IsNotEmpty({ message: 'ফোন নম্বর প্রদান করা আবশ্যক' })
  phone: string;

  @ApiProperty({ example: 'SuperAdmin@2026!' })
  @IsString()
  @MinLength(8, { message: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে' })
  password: string;

  @ApiPropertyOptional({ example: ['SUPER_ADMIN'] })
  @IsOptional()
  @IsArray({ message: 'রোলগুলো অ্যারে আকারে থাকতে হবে' })
  roles?: string[];

  @ApiPropertyOptional({ example: 'Kurigram' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Roumari' })
  @IsOptional()
  @IsString()
  upazila?: string;

  @ApiPropertyOptional({ example: 'রৌমারী বাজার, কুড়িগ্রাম' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateAdminUserRolesDto {
  @ApiProperty({ example: ['SUPER_ADMIN'] })
  @IsArray({ message: 'roles must be an array of role names' })
  roles: string[];
}
