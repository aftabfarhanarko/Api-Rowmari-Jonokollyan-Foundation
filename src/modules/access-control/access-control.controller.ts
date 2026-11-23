import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessControlService } from './access-control.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants';

@ApiTags('Access Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('access-control')
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('roles')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Get all system roles and their permissions' })
  async getRoles() {
    return this.accessControlService.findAllRoles();
  }

  @Get('permissions')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Get all available system permissions' })
  async getPermissions() {
    return this.accessControlService.findAllPermissions();
  }

  @Post('roles')
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new custom role' })
  async createRole(
    @Body() body: { name: string; description: string; permissions: string[] },
  ) {
    return this.accessControlService.createRole(body.name, body.description, body.permissions);
  }
}
