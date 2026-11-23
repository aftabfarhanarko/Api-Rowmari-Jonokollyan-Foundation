import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  TrackApplicationDto,
  AddDocumentDto,
} from './dto/application.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { PERMISSION_KEYS, ApplicationStatus } from '../../common/constants';

@ApiTags('Assistance Applications')
@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @Post('assistance-applications')
  @ApiOperation({ summary: 'Submit an assistance request (Public with anti-abuse)' })
  async create(@Body() dto: CreateApplicationDto) {
    const application = await this.applicationsService.create(dto);
    return {
      id: application.id,
      referenceCode: application.referenceCode,
      status: application.status,
      createdAt: application.createdAt,
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('application-tracking/verify')
  @ApiOperation({ summary: 'Track an application status with reference code & phone' })
  async track(@Body() dto: TrackApplicationDto) {
    return this.applicationsService.track(dto);
  }

  @Public()
  @Post('assistance-applications/:id/documents')
  @ApiOperation({ summary: 'Upload/attach supporting document metadata to application' })
  async addDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddDocumentDto,
  ) {
    return this.applicationsService.addDocument(id, dto);
  }

  // --- Admin Endpoints ---

  @Get('admin/assistance-applications')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.APPLICATIONS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all applications with filters (Staff only)' })
  @ApiQuery({ name: 'status', enum: ApplicationStatus, required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAllAdmin(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: ApplicationStatus,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.applicationsService.findAll(query, { status, category, search });
  }

  @Get('admin/assistance-applications/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.APPLICATIONS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full application details including documents and history' })
  async findByIdAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.findById(id);
  }

  @Patch('admin/assistance-applications/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.APPLICATIONS_REVIEW)
  @AuditLog({ action: 'UPDATE_APPLICATION_STATUS', entityType: 'HelpApplication' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update application review status and add notes' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser('id') staffUserId: string,
  ) {
    return this.applicationsService.updateStatus(id, dto, staffUserId);
  }

  @Post('admin/assistance-applications/:id/assign')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.APPLICATIONS_ASSIGN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign application to a staff case worker' })
  async assignStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('staffUserId', ParseUUIDPipe) staffUserId: string,
  ) {
    return this.applicationsService.assignStaff(id, staffUserId);
  }
}
