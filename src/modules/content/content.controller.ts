import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ContentStatus } from '../../common/constants';

@ApiTags('Content Management (Public CMS)')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // --- Public Read Endpoints ---
  @Public()
  @Get('pages')
  @ApiOperation({ summary: 'List all published CMS pages (Public)' })
  async findAllPages(@Query() query: PaginationQueryDto) {
    return this.contentService.findAllPages(query, ContentStatus.PUBLISHED);
  }

  @Public()
  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get published CMS page content by slug (Public)' })
  async getPage(@Param('slug') slug: string) {
    return this.contentService.getPageBySlug(slug);
  }

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Get public website settings and configurations (Public)' })
  @ApiQuery({ name: 'group', required: false })
  async getSettings(@Query('group') group?: string) {
    return this.contentService.getSettings(group);
  }

  @Public()
  @Get('news-events')
  @ApiOperation({ summary: 'List published news articles, notices, and events (Public)' })
  @ApiQuery({ name: 'type', required: false, enum: ['NEWS', 'EVENT', 'NOTICE'] })
  async findAllNewsEvents(
    @Query() query: PaginationQueryDto,
    @Query('type') type?: string,
  ) {
    return this.contentService.findAllNewsEvents(query, type, ContentStatus.PUBLISHED);
  }

  @Public()
  @Get('news-events/:slug')
  @ApiOperation({ summary: 'Get single published news or event details by slug (Public)' })
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
  @ApiOperation({ summary: 'Get current active announcements and alerts (Public)' })
  async getAnnouncements() {
    return this.contentService.getActiveAnnouncements();
  }
}
