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
import { DonorsService } from './donors.service';
import { RegisterDonorDto, UpdateDonorAvailabilityDto } from './dto/donor.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { BloodGroup, PERMISSION_KEYS } from '../../common/constants';

@ApiTags('Blood Donors')
@Controller('blood/donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @Post()
  @ApiOperation({ summary: 'Register as a voluntary blood donor' })
  async register(@Body() dto: RegisterDonorDto) {
    return this.donorsService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('search')
  @ApiOperation({ summary: 'Public donor search (Private contact details are masked)' })
  @ApiQuery({ name: 'bloodGroup', enum: BloodGroup, required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'upazila', required: false })
  async searchPublic(
    @Query() query: PaginationQueryDto,
    @Query('bloodGroup') bloodGroup?: BloodGroup,
    @Query('district') district?: string,
    @Query('upazila') upazila?: string,
  ) {
    return this.donorsService.searchPublic(query, { bloodGroup, district, upazila });
  }

  // --- Protected Coordinator Endpoints ---

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.DONORS_VIEW_PRIVATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Authorized blood coordinators search with full contact info' })
  @ApiQuery({ name: 'bloodGroup', enum: BloodGroup, required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'isAvailable', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAllAuthorized(
    @Query() query: PaginationQueryDto,
    @Query('bloodGroup') bloodGroup?: BloodGroup,
    @Query('district') district?: string,
    @Query('isAvailable') isAvailable?: boolean,
    @Query('search') search?: string,
  ) {
    return this.donorsService.findAllAuthorized(query, {
      bloodGroup,
      district,
      isAvailable,
      search,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.DONORS_VIEW_PRIVATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full donor profile (Blood coordinator only)' })
  async findByIdAuthorized(@Param('id', ParseUUIDPipe) id: string) {
    return this.donorsService.findByIdAuthorized(id);
  }

  @Patch(':id/availability')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.DONORS_VIEW_PRIVATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update donor availability status' })
  async updateAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDonorAvailabilityDto,
  ) {
    return this.donorsService.updateAvailability(id, dto);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_KEYS.DONORS_VERIFY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify donor record after screening' })
  async verifyDonor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isVerified') isVerified: boolean,
  ) {
    return this.donorsService.verifyDonor(id, isVerified);
  }
}
