import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../../common/constants';

interface JwtPayload {
  sub: string;
  email?: string;
  phone: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Malformed token payload: subject missing.');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is suspended or inactive.');
    }

    const roles = user.roles?.map((r) => r.name) || [];
    const permissions = Array.from(
      new Set(
        user.roles?.flatMap((r) => r.permissions?.map((p) => p.key) || []) || [],
      ),
    );

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      roles,
      permissions,
    };
  }
}
