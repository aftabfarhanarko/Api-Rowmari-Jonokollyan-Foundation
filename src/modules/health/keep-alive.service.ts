import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class KeepAliveService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(KeepAliveService.name);
  private timer: NodeJS.Timeout | null = null;

  onApplicationBootstrap() {
    this.startKeepAlive();
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startKeepAlive() {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
    const explicitlyEnabled = process.env.ENABLE_KEEP_ALIVE === 'true';

    // Target URL to ping: Render external URL or custom backend URL or default live Render service
    const targetBaseUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.BACKEND_URL ||
      'https://api-rowmari-jonokollyan-foundation.onrender.com';

    const apiPrefix = process.env.API_PREFIX || 'api/v1';
    const pingUrl = `${targetBaseUrl.replace(/\/$/, '')}/${apiPrefix}/health/ping`;

    // Only run self-ping if in production or on Render or explicitly enabled
    if (!isProd && !explicitlyEnabled && !process.env.RENDER_EXTERNAL_URL) {
      this.logger.log(`KeepAliveService: Skipping self-ping in local development. Ping target: ${pingUrl}`);
      return;
    }

    // Ping interval: 10 minutes (600,000 ms) - keeps Render free tier from sleeping (threshold is 15m)
    const intervalMs = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS || '600000', 10);

    this.logger.log(`🚀 KeepAliveService started. Pinging ${pingUrl} every ${intervalMs / 1000 / 60}m to prevent Render server sleep.`);

    // Perform initial warm-up ping after 30 seconds
    setTimeout(() => {
      this.ping(pingUrl);
    }, 30000);

    // Schedule regular keep-alive pings
    this.timer = setInterval(() => {
      this.ping(pingUrl);
    }, intervalMs);
  }

  private ping(url: string) {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { timeout: 15000 }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          this.logger.log(`[KeepAlive] Ping successful (${res.statusCode}) - server kept awake.`);
        } else {
          this.logger.warn(`[KeepAlive] Ping responded with status ${res.statusCode}`);
        }
        res.resume(); // consume response data to prevent memory leak
      });

      req.on('error', (err) => {
        this.logger.warn(`[KeepAlive] Ping failed: ${err.message}`);
      });

      req.on('timeout', () => {
        req.destroy();
        this.logger.warn(`[KeepAlive] Ping request timed out.`);
      });
    } catch (err: any) {
      this.logger.error(`[KeepAlive] Ping error: ${err.message}`);
    }
  }
}
