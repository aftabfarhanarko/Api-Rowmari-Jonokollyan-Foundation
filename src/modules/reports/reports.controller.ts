import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Reports & Executive Dashboard')
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Public()
  @Get('reports/public-summary')
  @ApiOperation({ summary: 'Get public foundation impact summary metrics (Public)' })
  async getPublicSummary() {
    return this.reportsService.getPublicSummary();
  }

  @Get('admin/reports/dashboard')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.REPORTS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get foundation high-level metrics & financial summary (Staff only)' })
  async getDashboard() {
    return this.reportsService.getExecutiveDashboard();
  }
}
