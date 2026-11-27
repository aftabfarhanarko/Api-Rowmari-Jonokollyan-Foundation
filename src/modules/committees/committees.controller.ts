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
import { CommitteesService } from './committees.service';
import {
  CreateCommitteeDto,
  CreateDesignationDto,
  CreateMemberDto,
  AssignMembershipDto,
} from './dto/committee.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Committees & Member Verification')
@Controller('committees')
export class CommitteesController {
  constructor(private readonly committeesService: CommitteesService) {}

  // --- Public Endpoints ---

  @Public()
  @Get('public/list')
  @ApiOperation({ summary: 'Get published committees with members' })
  async getPublicCommittees() {
    return this.committeesService.getCommittees('PUBLISHED');
  }

  @Public()
  @Get('public/designations')
  @ApiOperation({ summary: 'Get all active designations' })
  async getPublicDesignations() {
    return this.committeesService.getDesignations();
  }

  @Public()
  @Get('public/verify/:memberId')
  @ApiOperation({ summary: 'Verify member by unique RJF Member ID' })
  async verifyMember(@Param('memberId') memberId: string) {
    return this.committeesService.verifyMemberById(memberId);
  }

  // --- Super Admin Endpoints ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Get('admin/all')
  async getAllCommitteesAdmin() {
    return this.committeesService.getCommittees('ALL');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Post('admin/committee')
  async createCommittee(@Body() dto: CreateCommitteeDto) {
    return this.committeesService.createCommittee(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Put('admin/committee/:id')
  async updateCommittee(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCommitteeDto>,
  ) {
    return this.committeesService.updateCommittee(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Get('admin/committee/:id')
  async getCommitteeById(@Param('id') id: string) {
    return this.committeesService.getCommitteeById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Delete('admin/committee/:id')
  async deleteCommittee(@Param('id') id: string) {
    return this.committeesService.deleteCommittee(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Post('admin/designation')
  async createDesignation(@Body() dto: CreateDesignationDto) {
    return this.committeesService.createDesignation(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Put('admin/designation/:id')
  async updateDesignation(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDesignationDto>,
  ) {
    return this.committeesService.updateDesignation(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Delete('admin/designation/:id')
  async deleteDesignation(@Param('id') id: string) {
    return this.committeesService.deleteDesignation(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Get('admin/members')
  async getMembers(
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.committeesService.getMembers(search, limit, page);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Get('admin/members/:id')
  async getMemberById(@Param('id') id: string) {
    return this.committeesService.getMemberById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Post('admin/member')
  async createMember(@Body() dto: CreateMemberDto) {
    return this.committeesService.createMember(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Put('admin/members/:id')
  async updateMember(
    @Param('id') id: string,
    @Body() dto: Partial<CreateMemberDto>,
  ) {
    return this.committeesService.updateMember(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Delete('admin/members/:id')
  async deleteMember(@Param('id') id: string) {
    return this.committeesService.deleteMember(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Post('admin/membership')
  async assignMembership(@Body() dto: AssignMembershipDto) {
    return this.committeesService.assignMembership(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.CONTENT_MANAGE)
  @Delete('admin/membership/:id')
  async removeMembership(@Param('id') id: string) {
    return this.committeesService.removeMembership(id);
  }
}
