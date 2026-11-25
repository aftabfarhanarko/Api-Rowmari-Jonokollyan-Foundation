import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
