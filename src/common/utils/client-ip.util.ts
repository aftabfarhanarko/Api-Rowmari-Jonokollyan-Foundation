import { Request } from 'express';

/**
 * Robustly extracts the true client IP address from an incoming HTTP request.
 * Handles reverse proxies, CDNs, multiple comma-separated x-forwarded-for headers,
 * and falls back to socket/connection addresses.
 */
export function extractClientIp(req: Request | Record<string, any> | undefined | null): string {
  if (!req) return '127.0.0.1';

  // Express resolves the address using the configured trusted proxy chain. Never
  // prefer raw forwarding headers here: clients can supply spoofed XFF values.
  const resolvedIp = req.ip || (Array.isArray(req.ips) ? req.ips[0] : undefined);
  if (resolvedIp) return resolvedIp.replace(/^::ffff:/, '');

  // 1. Check X-Forwarded-For (standard de-facto header)
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : String(forwarded);
    const firstIp = raw.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  // 2. Check X-Real-IP (commonly set by NGINX / Cloudflare)
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    const rawReal = Array.isArray(realIp) ? realIp[0] : String(realIp);
    const trimmed = rawReal.trim();
    if (trimmed) return trimmed;
  }

  // 3. Express req.ips array (populated when 'trust proxy' is enabled)
  if (Array.isArray(req.ips) && req.ips.length > 0) {
    const first = req.ips[0]?.trim();
    if (first) return first;
  }

  // 4. Direct socket / connection address
  const directIp =
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress;

  if (directIp) {
    // Strip IPv6-mapped IPv4 prefix (e.g., ::ffff:192.168.1.1)
    return directIp.replace(/^::ffff:/, '');
  }

  return '127.0.0.1';
}
