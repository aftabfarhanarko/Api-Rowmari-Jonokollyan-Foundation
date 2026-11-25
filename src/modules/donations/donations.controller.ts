import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { RecordDonationDto } from './dto/donation.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async record(@Body() _dto: RecordDonationDto) {
    throw new BadRequestException(
      'অনলাইন অনুদান সেবা সম্পূর্ণ বন্ধ রয়েছে। রৌমারী জনকল্যাণ ফাউন্ডেশন বর্তমানে কোনো আর্থিক অনুদান গ্রহণ করে না।',
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user donation history and receipts' })
  async findMyDonations(
    @Query() query: PaginationQueryDto,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    return { items: [], total: 0, page: query.page || 1, limit: query.limit || 10, totalPages: 0 };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.DONATIONS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all donations with financial summaries (Finance only)' })
  @ApiQuery({ name: 'campaignId', required: false })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('campaignId') _campaignId?: string,
  ) {
    return { items: [], total: 0, page: query.page || 1, limit: query.limit || 10, totalPages: 0 };
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
