import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ImagesService } from '../images/images.service';
import { CreateUserDto, UpdateUserDto, UpdateUserRolesDto, UpdateUserStatusDto } from './dto/create-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { RoleName } from '../../common/constants';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly imagesService: ImagesService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @Post('profile/avatar')
  @ApiOperation({ summary: 'Upload profile image to ImgBB and save avatar URL to user in database' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file received. Please provide a file in the "image" field.');
    }
    const uploadResult = await this.imagesService.handleImageUpload(file);
    const updatedUser = await this.usersService.update(userId, {
      avatarUrl: uploadResult.url,
    });
    return {
      message: 'Profile image uploaded and saved successfully',
      avatarUrl: uploadResult.url,
      user: updatedUser,
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Get user details by ID (Admin only)' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/roles')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get assigned roles for a user (Super Admin only)' })
  async getUserRoles(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!currentUser.roles?.includes(RoleName.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin is authorized to view or manage user roles.');
    }
    const user = await this.usersService.findById(id);
    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles?.map((r) => r.name) || [],
    };
  }

  @Put(':id/roles')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @AuditLog({ action: 'UPDATE_USER_ROLES', entityType: 'User' })
  @ApiOperation({ summary: 'Update/tick user roles from Super Admin panel (Super Admin ONLY)' })
  async updateRoles(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    if (!currentUser.roles?.includes(RoleName.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin is authorized to update user roles.');
    }
    return this.usersService.assignRoles(id, dto.roles);
  }

  @Patch(':id/roles')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @AuditLog({ action: 'UPDATE_USER_ROLES', entityType: 'User' })
  @ApiOperation({ summary: 'Patch user roles from Super Admin panel (Super Admin ONLY)' })
  async patchRoles(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    if (!currentUser.roles?.includes(RoleName.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin is authorized to update user roles.');
    }
    return this.usersService.assignRoles(id, dto.roles);
  }

  @Post(':id/roles')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @AuditLog({ action: 'UPDATE_USER_ROLES', entityType: 'User' })
  @ApiOperation({ summary: 'Assign user roles (Super Admin ONLY)' })
  async assignRoles(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    if (!currentUser.roles?.includes(RoleName.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin is authorized to update user roles.');
    }
    return this.usersService.assignRoles(id, dto.roles);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Update user status (Active/Suspended)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, dto.status);
  }
}
