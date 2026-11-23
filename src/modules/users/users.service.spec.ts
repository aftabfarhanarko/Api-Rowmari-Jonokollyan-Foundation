import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../access-control/entities/role.entity';
import { RoleName, UserStatus } from '../../common/constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let roleRepo: any;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '+8801700000000',
    passwordHash: 'hash',
    district: 'Kurigram',
    upazila: 'Roumari',
    address: 'Bamondanga',
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isPhoneVerified: true,
    avatarUrl: null,
    registrationIp: '127.0.0.1',
    lastLoginIp: '127.0.0.1',
    lastLoginAt: new Date(),
    roles: [
      {
        id: 'role-1',
        name: RoleName.COMMUNITY_MEMBER,
        description: 'Community Member',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
      findAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      create: jest.fn((dto) => dto as any),
      save: jest.fn((u) => Promise.resolve(u as any)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    roleRepo = {
      find: jest.fn().mockImplementation((options) => {
        const requestedNames = options.where.map((w: any) => w.name);
        return Promise.resolve(
          requestedNames.map((name: string) => ({
            id: `role-${name}`,
            name,
            description: `${name} role`,
            permissions: [],
          })),
        );
      }),
      findOne: jest.fn().mockResolvedValue({
        id: 'role-cm',
        name: RoleName.COMMUNITY_MEMBER,
        description: 'Community Member',
        permissions: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assignRoles', () => {
    it('should assign roles to user when Super Admin specifies them', async () => {
      const updated = await service.assignRoles(mockUser.id, [
        RoleName.BLOOD_COORDINATOR,
        RoleName.VOLUNTEER_MANAGER,
        RoleName.CONTENT_MANAGER,
      ]);

      expect(roleRepo.find).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(updated).toBeDefined();
    });

    it('should assign default COMMUNITY_MEMBER if roles array is empty', async () => {
      await service.assignRoles(mockUser.id, []);

      expect(roleRepo.find).toHaveBeenCalledWith({
        where: [{ name: RoleName.COMMUNITY_MEMBER }],
      });
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if a requested role does not exist', async () => {
      (roleRepo.find as jest.Mock).mockResolvedValueOnce([
        { id: 'role-1', name: RoleName.BLOOD_COORDINATOR },
      ]);

      await expect(
        service.assignRoles(mockUser.id, [
          RoleName.BLOOD_COORDINATOR,
          'NON_EXISTENT_ROLE' as any,
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.assignRoles('unknown-id', [RoleName.BLOOD_COORDINATOR]),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLoginMeta', () => {
    it('should update user last login IP and timestamp', async () => {
      await service.updateLoginMeta(mockUser.id, '103.205.10.5');
      expect(userRepo.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          lastLoginIp: '103.205.10.5',
          lastLoginAt: expect.any(Date),
        }),
      );
    });
  });

  describe('create', () => {
    it('should set registration IP and last login IP on user creation', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      await service.create(
        {
          fullName: 'New User',
          phone: '+8801799999999',
          email: 'new@example.com',
          password: 'password123',
        },
        [RoleName.COMMUNITY_MEMBER],
        '103.205.10.5',
      );

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          registrationIp: '103.205.10.5',
          lastLoginIp: '103.205.10.5',
          lastLoginAt: expect.any(Date),
        }),
      );
    });
  });
});
