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
import { BloodRequestsService } from './blood-requests.service';
import {
  CreateBloodRequestDto,
  MatchDonorDto,
  UpdateMatchStatusDto,
  RecordOutcomeDto,
} from './dto/blood-request.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { PERMISSION_KEYS, BloodRequestStatus } from '../../common/constants';

@ApiTags('Blood Requests & Matching')
@Controller('blood/requests')
export class BloodRequestsController {
  constructor(private readonly bloodRequestsService: BloodRequestsService) {}

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @Post()
  @ApiOperation({ summary: 'Submit a blood request (Public or verified patient)' })
  async create(@Body() dto: CreateBloodRequestDto) {
    return this.bloodRequestsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List open / active blood requests' })
  @ApiQuery({ name: 'status', enum: BloodRequestStatus, required: false })
  @ApiQuery({ name: 'bloodGroup', required: false })
  @ApiQuery({ name: 'district', required: false })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: BloodRequestStatus,
    @Query('bloodGroup') bloodGroup?: string,
    @Query('district') district?: string,
  ) {
    return this.bloodRequestsService.findAll(query, { status, bloodGroup, district });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a blood request and matched donors' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.bloodRequestsService.findById(id);
  }

  @Post(':id/matches')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.BLOOD_REQUESTS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Match a donor to a blood request (Blood coordinator only)' })
  async matchDonor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MatchDonorDto,
    @CurrentUser('id') coordinatorUserId: string,
  ) {
    return this.bloodRequestsService.matchDonor(id, dto, coordinatorUserId);
  }

  @Patch('matches/:matchId/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.BLOOD_REQUESTS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update outreach status of a matched donor' })
  async updateMatchStatus(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: UpdateMatchStatusDto,
  ) {
    return this.bloodRequestsService.updateMatchStatus(matchId, dto);
  }

  @Post('matches/:matchId/outcomes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.BLOOD_REQUESTS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record confirmed donation outcome for a match' })
  async recordOutcome(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: RecordOutcomeDto,
  ) {
    return this.bloodRequestsService.recordOutcome(matchId, dto);
  }
}
