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
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, CreateCampaignUpdateDto } from './dto/campaign.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PERMISSION_KEYS, CampaignStatus } from '../../common/constants';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published active campaigns (Public)' })
  async findAllPublic(@Query() query: PaginationQueryDto) {
    return this.campaignsService.findAllPublic(query);
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get campaign details by slug (Public)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.campaignsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details by ID or UUID' })
  async findById(@Param('id') id: string) {
    return this.campaignsService.findById(id);
  }

  // --- Admin Endpoints ---

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CAMPAIGNS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all campaigns including drafts (Admin only)' })
  @ApiQuery({ name: 'status', enum: CampaignStatus, required: false })
  async findAllAdmin(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: CampaignStatus,
  ) {
    return this.campaignsService.findAllAdmin(query, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CAMPAIGNS_CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new campaign' })
  async create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Post(':id/updates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CAMPAIGNS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a progress update/milestone to a campaign' })
  async addUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCampaignUpdateDto,
  ) {
    return this.campaignsService.addUpdate(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CAMPAIGNS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update campaign status (Publish, Pause, Complete, Archive)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: CampaignStatus,
  ) {
    return this.campaignsService.updateStatus(id, status);
  }
}
