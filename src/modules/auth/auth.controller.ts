import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { extractClientIp } from '../../common/utils/client-ip.util';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private getRefreshTokenCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new community member with email, password & profile details' })
  @ApiResponse({ status: 201, description: 'User registered successfully and tokens issued' })
  async register(
    @Req() req: Request,
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = extractClientIp(req);
    const meta = {
      userAgent: req.headers['user-agent'] as string | undefined,
      ipAddress,
    };

    const result = await this.authService.register(dto, meta);

    res.cookie('rkf_refresh', result.refreshToken, this.getRefreshTokenCookieOptions());

    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(
    @Req() req: Request,
    @Body() _dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as any;
    const ipAddress = extractClientIp(req);
    const meta = {
      userAgent: req.headers['user-agent'] as string | undefined,
      ipAddress,
    };

    const tokens = await this.authService.issueTokens(user, meta);
    await this.usersService.updateLoginMeta(user.id, ipAddress);

    res.cookie('rkf_refresh', tokens.refreshToken, this.getRefreshTokenCookieOptions());

    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['rkf_refresh'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing from cookie.');
    }

    const ipAddress = extractClientIp(req);
    const meta = {
      userAgent: req.headers['user-agent'] as string | undefined,
      ipAddress,
    };

    const result = await this.authService.refresh(refreshToken, meta);
    await this.usersService.updateLoginMeta(result.user.id, ipAddress);

    res.cookie('rkf_refresh', result.refreshToken, this.getRefreshTokenCookieOptions());

    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['rkf_refresh'];
    await this.authService.logout(refreshToken);

    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
    res.clearCookie('rkf_refresh', {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/api/v1/auth',
    });

    return { success: true, message: 'Logged out successfully.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user details' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
