import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Audit Logs')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSION_KEYS.AUDIT_LOGS_VIEW)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'View immutable audit trail of sensitive system actions' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type (e.g. HelpApplication, Expense)' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action name' })
  @ApiQuery({ name: 'actorId', required: false, description: 'Filter by actor/user ID' })
  @ApiQuery({ name: 'ipAddress', required: false, description: 'Filter by client IP address' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('ipAddress') ipAddress?: string,
  ) {
    return this.auditService.findAll(query, { entityType, action, actorId, ipAddress });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific audit log record' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findById(id);
  }
}
