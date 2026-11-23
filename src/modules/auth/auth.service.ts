import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { DonorsService } from '../donors/donors.service';
import { VolunteersService } from '../volunteers/volunteers.service';
import { RegisterDto } from './dto/auth.dto';
import { UserStatus, RoleName } from '../../common/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly donorsService: DonorsService,
    private readonly volunteersService: VolunteersService,
    private readonly config: ConfigService,
  ) {}

  async validateUserCredentials(email: string, password: string) {
    const user = await this.usersService.findByEmail(email, true);

    if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
      return null;
    }

    const isMatch = await argon2.verify(user.passwordHash, password);
    if (!isMatch) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      roles: user.roles?.map((r) => r.name) || [],
      permissions: Array.from(
        new Set(
          user.roles?.flatMap((r) => r.permissions?.map((p) => p.key) || []) || [],
        ),
      ),
    };
  }

  async register(
    dto: RegisterDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('A user with this email address already exists.');
    }

    const existingPhone = await this.usersService.findByPhone(dto.phone);
    if (existingPhone) {
      throw new ConflictException('A user with this phone number already exists.');
    }

    const user = await this.usersService.create(
      {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: dto.password,
        district: dto.district,
        upazila: dto.upazila,
        address: dto.address,
      },
      [RoleName.COMMUNITY_MEMBER],
      meta?.ipAddress,
    );

    // If blood group specified, enroll in donor registry
    if (dto.bloodGroup) {
      try {
        await this.donorsService.register(
          {
            fullName: dto.fullName,
            phone: dto.phone,
            bloodGroup: dto.bloodGroup,
            district: dto.district || 'Kurigram',
            upazila: dto.upazila || 'Roumari',
            consentToContact: true,
          },
          user.id,
        );
      } catch (err) {
        this.logger.warn(`Could not auto-register donor profile for user ${user.id}: ${err.message}`);
      }
    }

    // If volunteer interest checked, enroll in volunteer registry
    if (dto.isVolunteerInterest) {
      try {
        await this.volunteersService.register(
          {
            fullName: dto.fullName,
            phone: dto.phone,
            email: dto.email,
            district: dto.district || 'Kurigram',
            upazila: dto.upazila || 'Roumari',
            availabilityHoursPerWeek: 5,
          },
          user.id,
        );
      } catch (err) {
        this.logger.warn(`Could not auto-register volunteer profile for user ${user.id}: ${err.message}`);
      }
    }

    const roles = user.roles?.map((r) => r.name) || [RoleName.COMMUNITY_MEMBER];

    const tokens = await this.issueTokens(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        roles,
      },
      meta,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles,
        district: user.district,
        upazila: user.upazila,
        address: user.address,
      },
    };
  }

  async issueTokens(
    user: { id: string; email?: string; phone: string; roles: string[] },
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl', '15m'),
    });

    const refreshToken = await this.refreshTokensService.createAndSign(user.id, 7, meta);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  async refresh(refreshToken: string, meta?: { userAgent?: string; ipAddress?: string }) {
    const { userId, newRefreshToken } = await this.refreshTokensService.validateAndRotate(
      refreshToken,
      meta,
    );

    const user = await this.usersService.findById(userId);
    const roles = user.roles?.map((r) => r.name) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl', '15m'),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles,
      },
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokensService.revoke(refreshToken);
    }
    return { success: true, message: 'Logged out successfully.' };
  }
}
