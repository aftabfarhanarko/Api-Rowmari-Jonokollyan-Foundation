import { Test, TestingModule } from '@nestjs/testing';
import { DonorsService } from './donors.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DonorProfile } from './entities/donor-profile.entity';
import { BloodGroup } from '../../common/constants';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

describe('DonorsService Privacy Masking', () => {
  let service: DonorsService;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'donor-uuid-1',
            fullName: 'Sensitive Name',
            phone: '+8801811223344', // SENSITIVE PHONE NUMBER
            bloodGroup: BloodGroup.A_POSITIVE,
            district: 'Kurigram',
            upazila: 'Roumari',
            isAvailable: true,
            isVerified: true,
            lastDonationDate: '2026-07-01',
          },
        ],
        1,
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonorsService,
        {
          provide: getRepositoryToken(DonorProfile),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DonorsService>(DonorsService);
  });

  it('should mask phone number and donor full name in public search', async () => {
    const query = new PaginationQueryDto();
    const result = await service.searchPublic(query, { bloodGroup: BloodGroup.A_POSITIVE });

    expect(result.items).toHaveLength(1);
    const publicDonor = result.items[0];

    // CRITICAL PRIVACY TEST: public result must NOT have phone or sensitive details!
    expect((publicDonor as any).phone).toBeUndefined();
    expect((publicDonor as any).fullName).toBeUndefined();
    expect(publicDonor.bloodGroup).toBe(BloodGroup.A_POSITIVE);
    expect(publicDonor.district).toBe('Kurigram');
    expect(publicDonor.isAvailable).toBe(true);
  });
});
