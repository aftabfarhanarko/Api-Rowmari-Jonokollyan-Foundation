import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HelpApplication } from './entities/help-application.entity';
import { ApplicationDocument } from './entities/application-document.entity';
import { ApplicationStatusHistory } from './entities/application-status-history.entity';
import { DataSource } from 'typeorm';
import { ApplicationCategory, ApplicationStatus } from '../../common/constants';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let appRepo: any;
  let historyRepo: any;

  beforeEach(async () => {
    appRepo = {
      count: jest.fn().mockResolvedValue(5),
      create: jest.fn((dto) => ({ ...dto, id: 'app-uuid-1' })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: 'app-uuid-1', createdAt: new Date() })),
      findOne: jest.fn(),
    };

    historyRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((dto) => Promise.resolve(dto)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: getRepositoryToken(HelpApplication), useValue: appRepo },
        { provide: getRepositoryToken(ApplicationDocument), useValue: {} },
        { provide: getRepositoryToken(ApplicationStatusHistory), useValue: historyRepo },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should generate human-readable reference code and set status to PENDING', async () => {
    const currentYear = new Date().getFullYear();
    const result = await service.create({
      applicant: {
        fullName: 'Rahim Uddin',
        phone: '+8801711112233',
        district: 'Kurigram',
        upazila: 'Roumari',
      },
      category: ApplicationCategory.MEDICAL,
      description: 'Need urgent surgery support.',
      consent: {
        privacyAccepted: true,
        contactAllowed: true,
      },
    });

    expect(result.id).toBe('app-uuid-1');
    expect(result.referenceCode).toBe(`RKF-${currentYear}-000006`);
    expect(result.status).toBe(ApplicationStatus.PENDING);
    expect(historyRepo.save).toHaveBeenCalled();
  });
});
