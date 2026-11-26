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
import { DonationsService } from './donations.service';
import { RecordDonationDto, ReviewDonationDto } from './dto/donation.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('record')
  @ApiOperation({ summary: 'Submit a donation (Public / Donor)' })
  async record(@Body() dto: RecordDonationDto) {
    const donation = await this.donationsService.record(dto);
    return {
      success: true,
      message: 'আপনার অনুদান সফলভাবে জমা নেওয়া হয়েছে। যাচাইকরণের পর এটি অনুমোদিত হবে। ধন্যবাদ!',
      donationId: donation.id,
      status: donation.status,
      createdAt: donation.createdAt,
    };
  }

  @Public()
  @Get('public/stats')
  @ApiOperation({ summary: 'Get approved public donation statistics' })
  async getPublicStats() {
    return this.donationsService.getPublicStats();
  }

  @Public()
  @Get('public/showcase')
  @ApiOperation({ summary: 'Get approved donor showcase for homepage' })
  async getPublicShowcase(@Query('limit') limit?: number) {
    return this.donationsService.getPublicApprovedDonations(limit ? Number(limit) : 10);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user donation history and receipts' })
  async findMyDonations(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.donationsService.findByDonor(query, user.phone, user.email);
  }

  // --- Super Admin Management Endpoints ---

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all donations with filters (Super Admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  async findAllAdmin(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.donationsService.findAll(query, status, campaignId);
  }

  @Patch('admin/:id/review')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a donation (Super Admin)' })
  async reviewDonation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDonationDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.donationsService.review(id, dto, adminId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donation details by ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.donationsService.findById(id);
  }
}
