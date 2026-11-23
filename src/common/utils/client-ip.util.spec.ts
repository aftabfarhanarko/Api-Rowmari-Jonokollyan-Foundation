import { extractClientIp } from './client-ip.util';

describe('extractClientIp', () => {
  it('should extract first IP from comma-separated x-forwarded-for header', () => {
    const req = {
      headers: {
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      },
    };
    expect(extractClientIp(req as any)).toBe('203.0.113.195');
  });

  it('should extract IP from x-forwarded-for array header', () => {
    const req = {
      headers: {
        'x-forwarded-for': ['103.205.10.25', '172.68.1.1'],
      },
    };
    expect(extractClientIp(req as any)).toBe('103.205.10.25');
  });

  it('should fallback to x-real-ip if x-forwarded-for is missing', () => {
    const req = {
      headers: {
        'x-real-ip': '103.205.10.50',
      },
    };
    expect(extractClientIp(req as any)).toBe('103.205.10.50');
  });

  it('should use req.ips if available', () => {
    const req = {
      headers: {},
      ips: ['103.205.10.75', '10.0.0.1'],
    };
    expect(extractClientIp(req as any)).toBe('103.205.10.75');
  });

  it('should strip ::ffff: prefix from IPv6-mapped IPv4 addresses', () => {
    const req = {
      headers: {},
      ip: '::ffff:192.168.1.15',
    };
    expect(extractClientIp(req as any)).toBe('192.168.1.15');
  });

  it('should return 127.0.0.1 when no IP can be resolved', () => {
    expect(extractClientIp(null)).toBe('127.0.0.1');
    expect(extractClientIp({} as any)).toBe('127.0.0.1');
  });
});
