import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { DonorsService } from '../donors/donors.service';
import { VolunteersService } from '../volunteers/volunteers.service';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { BloodGroup, UserStatus, RoleName } from '../../common/constants';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let refreshTokensService: Partial<RefreshTokensService>;
  let donorsService: Partial<DonorsService>;
  let volunteersService: Partial<VolunteersService>;

  beforeEach(async () => {
    usersService = {
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-access-token'),
    };
    refreshTokensService = {
      createAndSign: jest.fn().mockResolvedValue('mock-refresh-token'),
      validateAndRotate: jest.fn(),
      revoke: jest.fn(),
    };
    donorsService = {
      register: jest.fn().mockResolvedValue({ id: 'donor-1' } as any),
    };
    volunteersService = {
      register: jest.fn().mockResolvedValue({ id: 'vol-1' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshTokensService, useValue: refreshTokensService },
        { provide: DonorsService, useValue: donorsService },
        { provide: VolunteersService, useValue: volunteersService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('mock-secret'),
            get: jest.fn().mockReturnValue('15m'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should issue access and refresh tokens properly', async () => {
    const tokens = await authService.issueTokens({
      id: 'user-uuid-1',
      email: 'user@example.com',
      phone: '+8801700000000',
      roles: ['SUPER_ADMIN'],
    });

    expect(tokens.accessToken).toBe('mock-jwt-access-token');
    expect(tokens.refreshToken).toBe('mock-refresh-token');
    expect(tokens.tokenType).toBe('Bearer');
    expect(tokens.expiresIn).toBe(900);
  });

  describe('validateUserCredentials', () => {
    it('should return safe user object when email and password match', async () => {
      const passwordHash = await argon2.hash('Secret1234');
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        phone: '+8801711111111',
        fullName: 'Test User',
        status: UserStatus.ACTIVE,
        passwordHash,
        roles: [{ name: RoleName.COMMUNITY_MEMBER, permissions: [] }],
      });

      const result = await authService.validateUserCredentials('user@example.com', 'Secret1234');
      expect(result).toBeDefined();
      expect(result?.email).toBe('user@example.com');
      expect(result?.roles).toContain(RoleName.COMMUNITY_MEMBER);
    });

    it('should return null if user is not found or password incorrect', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      const res1 = await authService.validateUserCredentials('unknown@example.com', 'pass');
      expect(res1).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new community user and issue tokens', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.findByPhone as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        fullName: 'New Rahim',
        email: 'newrahim@example.com',
        phone: '+8801722222222',
        district: 'Kurigram',
        upazila: 'Roumari',
        roles: [{ name: RoleName.COMMUNITY_MEMBER }],
      });

      const res = await authService.register({
        fullName: 'New Rahim',
        email: 'newrahim@example.com',
        phone: '+8801722222222',
        password: 'Password123!',
        bloodGroup: BloodGroup.A_POSITIVE,
      });

      expect(res.accessToken).toBe('mock-jwt-access-token');
      expect(res.user.email).toBe('newrahim@example.com');
      expect(donorsService.register).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          fullName: 'Duplicate',
          email: 'duplicate@example.com',
          phone: '+8801733333333',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
