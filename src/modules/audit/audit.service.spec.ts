import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((log) => Promise.resolve({ ...log, id: 'audit-uuid-1', createdAt: new Date() })),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      createQueryBuilder: () => ({
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 'audit-uuid-1',
              action: 'UPDATE_APPLICATION_STATUS',
              entityType: 'HelpApplication',
              entityId: 'app-1',
            },
          ],
          1,
        ]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should successfully record and save audit log into the database', async () => {
    const result = await service.record({
      actorId: 'user-uuid-admin',
      actorName: 'Admin Officer',
      action: 'APPROVE_EXPENSE',
      entityType: 'Expense',
      entityId: 'exp-123',
      method: 'PATCH',
      route: '/api/v1/admin/expenses/exp-123/review',
      statusCode: 200,
      durationMs: 45,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Chrome/120.0',
      metadata: { approvedAmount: 25000 },
    });

    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toBe('audit-uuid-1');
    expect(result.action).toBe('APPROVE_EXPENSE');
    expect(result.entityType).toBe('Expense');
    expect(result.actorName).toBe('Admin Officer');
  });
});
