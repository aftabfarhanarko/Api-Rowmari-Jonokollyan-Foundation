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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { RecordDonationDto } from './dto/donation.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('record')
  @ApiOperation({ summary: 'Record a donation contribution and generate receipt (Public / Donor)' })
  async record(@Body() dto: RecordDonationDto) {
    return this.donationsService.record(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.DONATIONS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all donations with financial summaries (Finance only)' })
  @ApiQuery({ name: 'campaignId', required: false })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.donationsService.findAll(query, campaignId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.DONATIONS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donation and receipt details' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.donationsService.findById(id);
  }
}
