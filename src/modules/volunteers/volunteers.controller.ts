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
import { VolunteersService } from './volunteers.service';
import { RegisterVolunteerDto, CreateAssignmentDto } from './dto/volunteer.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Volunteers')
@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register as a foundation volunteer' })
  async register(@Body() dto: RegisterVolunteerDto) {
    return this.volunteersService.register(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.VOLUNTEERS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List volunteers with approval filter (Staff only)' })
  @ApiQuery({ name: 'isApproved', required: false, type: Boolean })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('isApproved') isApproved?: boolean,
  ) {
    return this.volunteersService.findAll(query, isApproved);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.VOLUNTEERS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get volunteer profile with assignment history' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.volunteersService.findById(id);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.VOLUNTEERS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject volunteer registration' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isApproved') isApproved: boolean,
  ) {
    return this.volunteersService.approve(id, isApproved);
  }

  @Post('assignments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.VOLUNTEERS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign volunteer to an activity, campaign, or medical camp' })
  async assign(@Body() dto: CreateAssignmentDto) {
    return this.volunteersService.assign(dto);
  }
}
