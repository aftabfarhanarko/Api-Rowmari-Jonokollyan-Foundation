import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { PERMISSION_KEYS, RoleName } from '../../common/constants';

@Injectable()
export class AccessControlService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async onModuleInit() {
    // Initial seed check if empty
    const count = await this.permissionRepo.count();
    if (count === 0) {
      await this.seedPermissionsAndRoles();
    }
  }

  async seedPermissionsAndRoles() {
    const permissionsToSeed = Object.entries(PERMISSION_KEYS).map(([_, key]) => {
      const [resource, action] = key.split('.');
      return this.permissionRepo.create({
        key,
        resource: resource || 'general',
        action: action || 'manage',
        description: `Permission to ${action} ${resource}`,
      });
    });

    const savedResult = await this.permissionRepo.save(permissionsToSeed);
    const savedPermissions = Array.isArray(savedResult) ? savedResult : [savedResult];
    const permMap = new Map(savedPermissions.map((p) => [p.key, p]));

    // Default Roles
    const superAdminRole = this.roleRepo.create({
      name: RoleName.SUPER_ADMIN,
      description: 'Super Administrator with unlimited access',
      permissions: savedPermissions,
    });

    const adminRole = this.roleRepo.create({
      name: RoleName.ADMIN,
      description: 'System Administrator',
      permissions: savedPermissions.filter((p) => !p.key.startsWith('roles.')),
    });

    const financeRole = this.roleRepo.create({
      name: RoleName.FINANCE_MANAGER,
      description: 'Finance Manager with donation & expense access',
      permissions: [
        PERMISSION_KEYS.DONATIONS_VIEW,
        PERMISSION_KEYS.EXPENSES_CREATE,
        PERMISSION_KEYS.EXPENSES_APPROVE,
        PERMISSION_KEYS.REPORTS_VIEW,
      ].map((k) => permMap.get(k)).filter(Boolean) as Permission[],
    });

    const bloodRole = this.roleRepo.create({
      name: RoleName.BLOOD_COORDINATOR,
      description: 'Blood Donation Coordinator',
      permissions: [
        PERMISSION_KEYS.DONORS_VIEW_PRIVATE,
        PERMISSION_KEYS.DONORS_VERIFY,
        PERMISSION_KEYS.BLOOD_REQUESTS_MANAGE,
      ].map((k) => permMap.get(k)).filter(Boolean) as Permission[],
    });

    const medicalRole = this.roleRepo.create({
      name: RoleName.MEDICAL_COORDINATOR,
      description: 'Medical Camp & Healthcare Assistance Coordinator',
      permissions: [
        PERMISSION_KEYS.CAMPS_MANAGE,
        PERMISSION_KEYS.APPLICATIONS_VIEW,
        PERMISSION_KEYS.APPLICATIONS_REVIEW,
      ].map((k) => permMap.get(k)).filter(Boolean) as Permission[],
    });

    const educationRole = this.roleRepo.create({
      name: RoleName.EDUCATION_COORDINATOR,
      description: 'Education Assistance & Student Campaign Coordinator',
      permissions: [
        PERMISSION_KEYS.APPLICATIONS_VIEW,
        PERMISSION_KEYS.APPLICATIONS_REVIEW,
        PERMISSION_KEYS.CAMPAIGNS_MANAGE,
      ].map((k) => permMap.get(k)).filter(Boolean) as Permission[],
    });

    const volunteerRole = this.roleRepo.create({
      name: RoleName.VOLUNTEER_MANAGER,
      description: 'Volunteer Network & Field Operations Manager',
      permissions: [
        PERMISSION_KEYS.VOLUNTEERS_MANAGE,
        PERMISSION_KEYS.CAMPS_MANAGE,
      ].map((k) => permMap.get(k)).filter(Boolean) as Permission[],
    });

    const contentRole = this.roleRepo.create({
      name: RoleName.CONTENT_MANAGER,
      description: 'Website Content & Public Campaign Manager',
      permissions: [
        PERMISSION_KEYS.CONTENT_MANAGE,
        PERMISSION_KEYS.CAMPAIGNS_CREATE,
        PERMISSION_KEYS.CAMPAIGNS_MANAGE,
      ].map((k) => permMap.get(k)).filter(Boolean) as Permission[],
    });

    const caseWorkerRole = this.roleRepo.create({
      name: RoleName.CASE_WORKER,
      description: 'Assistance Application Reviewer',
      permissions: [
        PERMISSION_KEYS.APPLICATIONS_VIEW,
        PERMISSION_KEYS.APPLICATIONS_ASSIGN,
        PERMISSION_KEYS.APPLICATIONS_REVIEW,
      ].map((k) => permMap.get(k)).filter(Boolean) as Permission[],
    });

    const memberRole = this.roleRepo.create({
      name: RoleName.COMMUNITY_MEMBER,
      description: 'General Community Member',
      permissions: [],
    });

    await this.roleRepo.save([
      superAdminRole,
      adminRole,
      financeRole,
      bloodRole,
      medicalRole,
      educationRole,
      volunteerRole,
      contentRole,
      caseWorkerRole,
      memberRole,
    ]);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepo.find({ relations: ['permissions'] });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { name }, relations: ['permissions'] });
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find();
  }

  async createRole(name: string, description: string, permissionKeys: string[]): Promise<Role> {
    const existing = await this.roleRepo.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException(`Role '${name}' already exists.`);
    }

    const permissions = await this.permissionRepo.find({
      where: { key: In(permissionKeys) },
    });

    const role = this.roleRepo.create({
      name,
      description,
      permissions,
    });

    return this.roleRepo.save(role);
  }
}
