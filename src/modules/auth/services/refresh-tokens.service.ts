import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createAndSign(
    userId: string,
    ttlDays: number = 7,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    const refreshToken = this.refreshTokenRepo.create({
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta?.userAgent || null,
      ipAddress: meta?.ipAddress || null,
    });

    await this.refreshTokenRepo.save(refreshToken);
    return rawToken;
  }

  async validateAndRotate(
    rawToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ userId: string; newRefreshToken: string }> {
    const tokenHash = this.hashToken(rawToken);
    const existing = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (existing.revokedAt) {
      // Possible token reuse attempt: revoke all tokens for this user for security
      await this.revokeAllForUser(existing.userId);
      throw new UnauthorizedException('Compromised refresh token reused. All sessions revoked.');
    }

    if (new Date() > existing.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    // Revoke old token
    existing.revokedAt = new Date();
    await this.refreshTokenRepo.save(existing);

    // Issue new rotated refresh token
    const newRefreshToken = await this.createAndSign(existing.userId, 7, meta);

    return {
      userId: existing.userId,
      newRefreshToken,
    };
  }

  async revoke(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    const existing = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });

    if (existing) {
      existing.revokedAt = new Date();
      await this.refreshTokenRepo.save(existing);
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
