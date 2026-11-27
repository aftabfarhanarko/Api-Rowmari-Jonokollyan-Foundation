import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { ContentService } from '../content/content.service';
import {
  CreatePageDto,
  UpdatePageDto,
  CreateNewsEventDto,
  UpdateNewsEventDto,
  CreateGalleryItemDto,
  CreateAnnouncementDto,
  BulkUpdateWebsiteSettingsDto,
} from '../content/dto/content.dto';
import {
  CreateNoticeModalDto,
  UpdateNoticeModalDto,
  CreateHeroSlideDto,
  UpdateHeroSlideDto,
  UpdateFooterConfigDto,
} from '../content/dto/modal-hero-footer.dto';
import { AdminUserQueryDto, UpdateUserStatusDto, CreateAdminUserDto, UpdateAdminUserRolesDto } from './dto/admin.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Super Admin Management System')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly contentService: ContentService,
  ) { }

  // 1. Dashboard Overview & Analytics
  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated live KPIs and overview statistics (Super Admin)' })
  async getDashboard() {
    return this.adminService.getDashboardOverview();
  }

  // 2. CMS: Page Management
  @Get('pages')
  @ApiOperation({ summary: 'List all CMS pages including drafts (Super Admin)' })
  async findAllPages(@Query() query: PaginationQueryDto) {
    return this.contentService.findAllPages(query);
  }

  @Post('pages')
  @ApiOperation({ summary: 'Create a new CMS page (Super Admin)' })
  async createPage(@Body() dto: CreatePageDto) {
    return this.contentService.createPage(dto);
  }

  @Get('pages/:id')
  @ApiOperation({ summary: 'Get single page details for editing (Super Admin)' })
  async getPageById(@Param('id') id: string) {
    return this.contentService.getPageById(id);
  }

  @Put('pages/:id')
  @ApiOperation({ summary: 'Update a CMS page (Super Admin)' })
  async updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.contentService.updatePage(id, dto);
  }

  @Delete('pages/:id')
  @ApiOperation({ summary: 'Delete a CMS page (Super Admin)' })
  async deletePage(@Param('id') id: string) {
    return this.contentService.deletePage(id);
  }

  // 3. News, Notices & Events
  @Get('news-events')
  @ApiOperation({ summary: 'List all news, notices, and events (Super Admin)' })
  @ApiQuery({ name: 'type', required: false })
  async findAllNewsEvents(
    @Query() query: PaginationQueryDto,
    @Query('type') type?: string,
  ) {
    return this.contentService.findAllNewsEvents(query, type);
  }

  @Post('news-events')
  @ApiOperation({ summary: 'Publish news, notice, or event (Super Admin)' })
  async createNewsEvent(@Body() dto: CreateNewsEventDto) {
    return this.contentService.createNewsEvent(dto);
  }

  @Get('news-events/:id')
  @ApiOperation({ summary: 'Get single news or event details (Super Admin)' })
  async getNewsEventById(@Param('id') id: string) {
    return this.contentService.getNewsEventById(id);
  }

  @Put('news-events/:id')
  @ApiOperation({ summary: 'Update news or event (Super Admin)' })
  async updateNewsEvent(@Param('id') id: string, @Body() dto: UpdateNewsEventDto) {
    return this.contentService.updateNewsEvent(id, dto);
  }

  @Delete('news-events/:id')
  @ApiOperation({ summary: 'Delete news or event (Super Admin)' })
  async deleteNewsEvent(@Param('id') id: string) {
    return this.contentService.deleteNewsEvent(id);
  }

  // 4. Gallery & Media Management
  @Get('gallery')
  @ApiOperation({ summary: 'List gallery items (Super Admin)' })
  @ApiQuery({ name: 'category', required: false })
  async findAllGallery(
    @Query() query: PaginationQueryDto,
    @Query('category') category?: string,
  ) {
    return this.contentService.findAllGallery(query, category);
  }

  @Get('gallery/:id')
  @ApiOperation({ summary: 'Get single gallery item details (Super Admin)' })
  async getGalleryItemById(@Param('id') id: string) {
    return this.contentService.getGalleryItemById(id);
  }

  @Post('gallery')
  @ApiOperation({ summary: 'Add image/media to gallery (Super Admin)' })
  async createGalleryItem(@Body() dto: CreateGalleryItemDto) {
    return this.contentService.createGalleryItem(dto);
  }

  @Put('gallery/:id')
  @ApiOperation({ summary: 'Update gallery item (Super Admin)' })
  async updateGalleryItem(
    @Param('id') id: string,
    @Body() dto: Partial<CreateGalleryItemDto>,
  ) {
    return this.contentService.updateGalleryItem(id, dto);
  }

  @Delete('gallery/:id')
  @ApiOperation({ summary: 'Delete gallery item (Super Admin)' })
  async deleteGalleryItem(@Param('id') id: string) {
    return this.contentService.deleteGalleryItem(id);
  }

  // 5. Announcements / Urgent Notices
  @Get('announcements')
  @ApiOperation({ summary: 'Get active alerts and announcements (Super Admin)' })
  async getAnnouncements() {
    return this.contentService.getActiveAnnouncements();
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Broadcast a new announcement (Super Admin)' })
  async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.contentService.createAnnouncement(dto);
  }

  @Delete('announcements/:id')
  @ApiOperation({ summary: 'Delete announcement (Super Admin)' })
  async deleteAnnouncement(@Param('id') id: string) {
    return this.contentService.deleteAnnouncement(id);
  }

  // 6. Website Settings & Global SEO
  @Get('settings')
  @ApiOperation({ summary: 'Get all dynamic website settings (Super Admin)' })
  async getSettings() {
    return this.contentService.getSettings();
  }

  @Get('settings/raw')
  @ApiOperation({ summary: 'Get structured list of website settings (Super Admin)' })
  async getRawSettings() {
    return this.contentService.getRawSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update website settings in bulk (Super Admin)' })
  async updateSettings(@Body() dto: BulkUpdateWebsiteSettingsDto) {
    return this.contentService.updateSettings(dto.settings);
  }

  // --- 6.1 Notice / Popup Modal Management (Super Admin) ---
  @Get('content/modals')
  @ApiOperation({ summary: 'List all emergency popup notice modals (Super Admin)' })
  async findAllNoticeModals() {
    return this.contentService.findAllNoticeModals();
  }

  @Get('content/modals/:id')
  @ApiOperation({ summary: 'Get single notice modal by ID (Super Admin)' })
  async getNoticeModalById(@Param('id') id: string) {
    return this.contentService.getNoticeModalById(id);
  }

  @Post('content/modals')
  @ApiOperation({ summary: 'Create new notice modal (Super Admin)' })
  async createNoticeModal(@Body() dto: CreateNoticeModalDto) {
    return this.contentService.createNoticeModal(dto);
  }

  @Put('content/modals/:id')
  @ApiOperation({ summary: 'Update notice modal (Super Admin)' })
  async updateNoticeModal(@Param('id') id: string, @Body() dto: UpdateNoticeModalDto) {
    return this.contentService.updateNoticeModal(id, dto);
  }

  @Patch('content/modals/:id/toggle')
  @ApiOperation({ summary: 'Toggle notice modal active/inactive status (Super Admin)' })
  async toggleNoticeModalStatus(@Param('id') id: string) {
    return this.contentService.toggleNoticeModalStatus(id);
  }

  @Delete('content/modals/:id')
  @ApiOperation({ summary: 'Delete notice modal (Super Admin)' })
  async deleteNoticeModal(@Param('id') id: string) {
    return this.contentService.deleteNoticeModal(id);
  }

  // --- 6.2 Hero Slider Management (Super Admin) ---
  @Get('content/hero-slides')
  @ApiOperation({ summary: 'List all hero slides (Super Admin)' })
  async findAllHeroSlides() {
    return this.contentService.findAllHeroSlides();
  }

  @Get('content/hero-slides/:id')
  @ApiOperation({ summary: 'Get single hero slide by ID (Super Admin)' })
  async getHeroSlideById(@Param('id') id: string) {
    return this.contentService.getHeroSlideById(id);
  }

  @Post('content/hero-slides')
  @ApiOperation({ summary: 'Create new hero slide (Super Admin)' })
  async createHeroSlide(@Body() dto: CreateHeroSlideDto) {
    return this.contentService.createHeroSlide(dto);
  }

  @Put('content/hero-slides/:id')
  @ApiOperation({ summary: 'Update hero slide (Super Admin)' })
  async updateHeroSlide(@Param('id') id: string, @Body() dto: UpdateHeroSlideDto) {
    return this.contentService.updateHeroSlide(id, dto);
  }

  @Patch('content/hero-slides/:id/toggle')
  @ApiOperation({ summary: 'Toggle hero slide active/inactive status (Super Admin)' })
  async toggleHeroSlideStatus(@Param('id') id: string) {
    return this.contentService.toggleHeroSlideStatus(id);
  }

  @Delete('content/hero-slides/:id')
  @ApiOperation({ summary: 'Delete hero slide (Super Admin)' })
  async deleteHeroSlide(@Param('id') id: string) {
    return this.contentService.deleteHeroSlide(id);
  }

  // --- 6.3 Footer Configuration Management (Super Admin) ---
  @Get('content/footer')
  @ApiOperation({ summary: 'Get footer configuration (Super Admin)' })
  async getFooterConfig() {
    return this.contentService.getFooterConfig();
  }

  @Put('content/footer')
  @ApiOperation({ summary: 'Update footer configuration (Super Admin)' })
  async updateFooterConfig(@Body() dto: UpdateFooterConfigDto) {
    return this.contentService.updateFooterConfig(dto);
  }

  // 7. Media Library
  @Get('media')
  @ApiOperation({ summary: 'List media files in library (Super Admin)' })
  @ApiQuery({ name: 'category', required: false })
  async findAllMedia(
    @Query() query: PaginationQueryDto,
    @Query('category') category?: string,
  ) {
    return this.contentService.findAllMedia(query, category);
  }

  @Delete('media/:id')
  @ApiOperation({ summary: 'Delete media file from library (Super Admin)' })
  async deleteMedia(@Param('id') id: string) {
    return this.contentService.deleteMedia(id);
  }

  // 8. User Management
  @Get('users')
  @ApiOperation({ summary: 'List registered community members (Super Admin)' })
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get details of a user with roles, stats and history (Super Admin)' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user or administrator with roles (Super Admin)' })
  async createUser(@Body() dto: CreateAdminUserDto) {
    return this.adminService.createUser(dto);
  }

  @Put('users/:id/roles')
  @ApiOperation({ summary: 'Update user roles (Super Admin)' })
  async updateUserRoles(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserRolesDto,
  ) {
    return this.adminService.updateUserRoles(id, dto.roles);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activate or deactivate a user account (Super Admin)' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto.status);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user account (Super Admin)' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.adminService.deleteUser(id, currentUserId);
  }

  // 9. Contact Message Inquiries
  @Get('contact-messages')
  @ApiOperation({ summary: 'List received contact inquiries (Super Admin)' })
  async getContactMessages(@Query() query: PaginationQueryDto) {
    return this.adminService.getContactMessages(query);
  }

  @Get('contact-messages/:id')
  @ApiOperation({ summary: 'Get single contact inquiry details (Super Admin)' })
  async getContactMessageById(@Param('id') id: string) {
    return this.adminService.getContactMessageById(id);
  }



  @Delete('contact-messages/:id')
  @ApiOperation({ summary: 'Delete a contact inquiry (Super Admin)' })
  async deleteContactMessage(@Param('id') id: string) {
    return this.adminService.deleteContactMessage(id);
  }

  // 10. Activity & Audit Logs
  @Get('activity-logs')
  @ApiOperation({ summary: 'View immutable system activity and audit logs (Super Admin)' })
  async getActivityLogs(@Query() query: PaginationQueryDto) {
    return this.adminService.getActivityLogs(query);
  }
}
