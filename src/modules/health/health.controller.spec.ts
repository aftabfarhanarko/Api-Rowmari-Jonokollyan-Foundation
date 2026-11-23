import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: Partial<HealthCheckService>;

  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn().mockImplementation((indicators) => {
        return Promise.resolve({
          status: 'ok',
          info: { database: { status: 'up' }, memory_heap: { status: 'up' } },
          error: {},
          details: { database: { status: 'up' }, memory_heap: { status: 'up' } },
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: { pingCheck: jest.fn() } },
        { provide: MemoryHealthIndicator, useValue: { checkHeap: jest.fn(), checkRSS: jest.fn() } },
        { provide: RedisService, useValue: { ping: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check result', async () => {
    const res = await controller.check();
    expect(res.status).toBe('ok');
    expect(res.details.database.status).toBe('up');
  });
});
