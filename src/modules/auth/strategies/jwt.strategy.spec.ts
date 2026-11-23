import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { UserStatus, RoleName } from '../../../common/constants';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test_32_byte_secret_key_1234567890'),
          },
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should validate and return active user with roles and permissions', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({
      id: 'user-uuid-1',
      email: 'admin@romonijon.org',
      phone: '+8801700000000',
      fullName: 'Super Admin',
      status: UserStatus.ACTIVE,
      roles: [
        {
          name: RoleName.SUPER_ADMIN,
          permissions: [{ key: 'roles.manage' }, { key: 'users.manage' }],
        },
      ],
    });

    const result = await strategy.validate({
      sub: 'user-uuid-1',
      email: 'admin@romonijon.org',
      phone: '+8801700000000',
      roles: [RoleName.SUPER_ADMIN],
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('user-uuid-1');
    expect(result.roles).toContain(RoleName.SUPER_ADMIN);
    expect(result.permissions).toContain('roles.manage');
  });

  it('should throw UnauthorizedException if user is suspended', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({
      id: 'user-uuid-2',
      status: UserStatus.SUSPENDED,
      roles: [],
    });

    await expect(
      strategy.validate({
        sub: 'user-uuid-2',
        phone: '+8801700000000',
        roles: [],
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is not found in database', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'user-deleted',
        phone: '+8801700000000',
        roles: [],
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
