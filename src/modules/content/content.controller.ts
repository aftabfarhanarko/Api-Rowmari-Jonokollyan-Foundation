import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import {
  CreatePageDto,
  CreateNewsEventDto,
  CreateGalleryItemDto,
  CreateAnnouncementDto,
} from './dto/content.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Content Management (CMS)')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // --- Public Read ---
  @Public()
  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get static/CMS page content by slug (Public)' })
  async getPage(@Param('slug') slug: string) {
    return this.contentService.getPageBySlug(slug);
  }

  @Public()
  @Get('news-events')
  @ApiOperation({ summary: 'List published news articles and events (Public)' })
  @ApiQuery({ name: 'type', required: false, enum: ['NEWS', 'EVENT'] })
  async findAllNewsEvents(
    @Query() query: PaginationQueryDto,
    @Query('type') type?: string,
  ) {
    return this.contentService.findAllNewsEvents(query, type);
  }

  @Public()
  @Get('news-events/:slug')
  @ApiOperation({ summary: 'Get single news or event details by slug (Public)' })
  async getNewsEvent(@Param('slug') slug: string) {
    return this.contentService.getNewsEventBySlug(slug);
  }

  @Public()
  @Get('gallery')
  @ApiOperation({ summary: 'List gallery media items (Public)' })
  @ApiQuery({ name: 'category', required: false })
  async findAllGallery(
    @Query() query: PaginationQueryDto,
    @Query('category') category?: string,
  ) {
    return this.contentService.findAllGallery(query, category);
  }

  @Public()
  @Get('announcements')
  @ApiOperation({ summary: 'Get current active announcements/alerts (Public)' })
  async getAnnouncements() {
    return this.contentService.getActiveAnnouncements();
  }

  // --- Admin Endpoints ---
  @Post('admin/pages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update a CMS page (Staff only)' })
  async createPage(@Body() dto: CreatePageDto) {
    return this.contentService.createPage(dto);
  }

  @Post('admin/news-events')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a news item or event (Staff only)' })
  async createNewsEvent(@Body() dto: CreateNewsEventDto) {
    return this.contentService.createNewsEvent(dto);
  }

  @Post('admin/gallery')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a photo or media to gallery (Staff only)' })
  async createGalleryItem(@Body() dto: CreateGalleryItemDto) {
    return this.contentService.createGalleryItem(dto);
  }

  @Post('admin/announcements')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast a new announcement (Staff only)' })
  async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.contentService.createAnnouncement(dto);
  }
}
