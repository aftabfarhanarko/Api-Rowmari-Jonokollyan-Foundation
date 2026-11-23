import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './entities/user.entity';
import { Role } from '../access-control/entities/role.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { UserStatus, RoleName } from '../../common/constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto, roleNames: string[] = [], ipAddress?: string): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])],
    });

    if (existing) {
      throw new ConflictException('User with this phone or email already exists.');
    }

    let passwordHash: string | null = null;
    if (dto.password) {
      passwordHash = await argon2.hash(dto.password);
    }

    let roles: Role[] = [];
    if (roleNames.length > 0) {
      roles = await this.roleRepo.find({
        where: roleNames.map((name) => ({ name })),
      });
    }

    const now = new Date();
    const user = this.userRepo.create({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      district: dto.district || 'Kurigram',
      upazila: dto.upazila || 'Roumari',
      address: dto.address || null,
      passwordHash,
      status: UserStatus.ACTIVE,
      roles,
      registrationIp: ipAddress || null,
      lastLoginIp: ipAddress || null,
      lastLoginAt: now,
    });

    return this.userRepo.save(user);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<User>> {
    const [items, total] = await this.userRepo.findAndCount({
      skip: query.skip,
      take: query.limit,
      order: { createdAt: 'DESC' },
      relations: ['roles'],
    });

    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async findByPhone(phone: string, includePassword = false): Promise<User | null> {
    const qb = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.phone = :phone', { phone });

    if (includePassword) {
      qb.addSelect('user.passwordHash');
    }

    return qb.getOne();
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const qb = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('LOWER(user.email) = LOWER(:email)', { email });

    if (includePassword) {
      qb.addSelect('user.passwordHash');
    }

    return qb.getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async assignRoles(userId: string, roleNames: (RoleName | string)[]): Promise<User> {
    const user = await this.findById(userId);

    // If roleNames is empty (all unchecked in panel), assign default COMMUNITY_MEMBER
    const namesToAssign = roleNames.length === 0 ? [RoleName.COMMUNITY_MEMBER] : roleNames;

    const roles = await this.roleRepo.find({
      where: namesToAssign.map((name) => ({ name: name as RoleName })),
    });

    if (namesToAssign.length > 0 && roles.length !== namesToAssign.length) {
      const found = new Set(roles.map((r) => r.name));
      const missing = namesToAssign.filter((n) => !found.has(n as RoleName));
      throw new BadRequestException(`Role(s) not found in system: ${missing.join(', ')}`);
    }

    user.roles = roles;
    await this.userRepo.save(user);

    return this.findById(userId);
  }

  async updateStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.findById(userId);
    user.status = status;
    return this.userRepo.save(user);
  }

  async updateLoginMeta(userId: string, ipAddress?: string): Promise<void> {
    await this.userRepo.update(userId, {
      lastLoginIp: ipAddress || null,
      lastLoginAt: new Date(),
    });
  }
}
