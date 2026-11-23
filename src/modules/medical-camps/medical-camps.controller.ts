import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalCampsService } from './medical-camps.service';
import {
  CreateMedicalCampDto,
  AddCampStaffDto,
  RecordCampAttendanceDto,
} from './dto/medical-camp.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Medical Camps')
@Controller('medical-camps')
export class MedicalCampsController {
  constructor(private readonly campsService: MedicalCampsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List scheduled and completed medical camps' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.campsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get medical camp details, assigned staff, and attendance summary' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.campsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CAMPS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Plan and schedule a new medical camp' })
  async create(@Body() dto: CreateMedicalCampDto) {
    return this.campsService.create(dto);
  }

  @Post(':id/staff')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CAMPS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a doctor, nurse, or volunteer to medical camp' })
  async addStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCampStaffDto,
  ) {
    return this.campsService.addStaff(id, dto);
  }

  @Post(':id/attendance-summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CAMPS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record minimal patient statistics and summary for medical camp' })
  async recordAttendanceSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordCampAttendanceDto,
  ) {
    return this.campsService.recordAttendanceSummary(id, dto);
  }
}
