import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
      const firstIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
      if (firstIp) return firstIp;
    }

    if (req.ips && req.ips.length > 0) {
      return req.ips[0];
    }

    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
  }
}
