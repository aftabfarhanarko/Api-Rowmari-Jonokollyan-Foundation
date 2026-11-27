import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoumariService } from './roumari.service';
import {
  CreateRoumariDirectoryDto,
  CreateRoumariTouristPlaceDto,
  CreateRoumariNewsDto,
} from './dto/roumari.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Our Roumari Portal')
@Controller('roumari')
export class RoumariController {
  constructor(private readonly roumariService: RoumariService) {}

  // --- Public Endpoints ---

  @Public()
  @Get('overview')
  @ApiOperation({ summary: 'Get Roumari portal homepage overview data' })
  async getOverview() {
    return this.roumariService.getPortalOverview();
  }

  @Public()
  @Get('emergency-contacts')
  @ApiOperation({ summary: 'Get list of emergency contacts' })
  async getEmergencyContacts() {
    return this.roumariService.getEmergencyContacts();
  }

  @Public()
  @Get('directory')
  @ApiOperation({ summary: 'Get public directories with filter' })
  async getDirectories(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.roumariService.getDirectories(category, search);
  }

  @Public()
  @Get('directory/:id')
  @ApiOperation({ summary: 'Get directory entry details by ID' })
  async getDirectoryById(@Param('id') id: string) {
    return this.roumariService.getDirectoryById(id);
  }

  @Public()
  @Get('tourist-places')
  @ApiOperation({ summary: 'Get tourist places in Roumari' })
  async getTouristPlaces() {
    return this.roumariService.getTouristPlaces();
  }

  @Public()
  @Get('tourist-places/:slug')
  @ApiOperation({ summary: 'Get single tourist place details' })
  async getTouristPlaceBySlug(@Param('slug') slug: string) {
    return this.roumariService.getTouristPlaceBySlug(slug);
  }

  @Public()
  @Get('news')
  @ApiOperation({ summary: 'Get local news articles' })
  async getNews(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.roumariService.getNews(category, search, limit, page);
  }

  @Public()
  @Get('news/:slug')
  @ApiOperation({ summary: 'Get single news article by slug' })
  async getNewsBySlug(@Param('slug') slug: string) {
    return this.roumariService.getNewsBySlug(slug);
  }

  // --- Super Admin Endpoints ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Post('admin/directory')
  async createDirectory(@Body() dto: CreateRoumariDirectoryDto) {
    return this.roumariService.createDirectory(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Put('admin/directory/:id')
  async updateDirectory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRoumariDirectoryDto>,
  ) {
    return this.roumariService.updateDirectory(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Delete('admin/directory/:id')
  async deleteDirectory(@Param('id') id: string) {
    return this.roumariService.deleteDirectory(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Post('admin/tourist-places')
  async createTouristPlace(@Body() dto: CreateRoumariTouristPlaceDto) {
    return this.roumariService.createTouristPlace(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Put('admin/tourist-places/:id')
  async updateTouristPlace(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRoumariTouristPlaceDto>,
  ) {
    return this.roumariService.updateTouristPlace(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Delete('admin/tourist-places/:id')
  async deleteTouristPlace(@Param('id') id: string) {
    return this.roumariService.deleteTouristPlace(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Post('admin/news')
  async createNews(@Body() dto: CreateRoumariNewsDto) {
    return this.roumariService.createNews(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Put('admin/news/:id')
  async updateNews(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRoumariNewsDto>,
  ) {
    return this.roumariService.updateNews(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Delete('admin/news/:id')
  async deleteNews(@Param('id') id: string) {
    return this.roumariService.deleteNews(id);
  }
}
