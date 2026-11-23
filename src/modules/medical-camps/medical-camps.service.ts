import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalCamp } from './entities/medical-camp.entity';
import { CampStaff } from './entities/camp-staff.entity';
import { CampAttendanceSummary } from './entities/camp-attendance-summary.entity';
import {
  CreateMedicalCampDto,
  AddCampStaffDto,
  RecordCampAttendanceDto,
} from './dto/medical-camp.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class MedicalCampsService {
  constructor(
    @InjectRepository(MedicalCamp)
    private readonly campRepo: Repository<MedicalCamp>,
    @InjectRepository(CampStaff)
    private readonly staffRepo: Repository<CampStaff>,
    @InjectRepository(CampAttendanceSummary)
    private readonly summaryRepo: Repository<CampAttendanceSummary>,
  ) {}

  async create(dto: CreateMedicalCampDto): Promise<MedicalCamp> {
    const camp = this.campRepo.create({
      title: dto.title,
      description: dto.description,
      campDate: dto.campDate,
      venue: dto.venue,
      district: dto.district || 'Kurigram',
      upazila: dto.upazila || 'Roumari',
      status: 'PLANNED',
    });
    return this.campRepo.save(camp);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<MedicalCamp>> {
    const [items, total] = await this.campRepo.findAndCount({
      order: { campDate: 'DESC' },
      skip: query.skip,
      take: query.limit,
      relations: ['staffList', 'attendanceSummary'],
    });
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<MedicalCamp> {
    const camp = await this.campRepo.findOne({
      where: { id },
      relations: ['staffList', 'attendanceSummary'],
    });
    if (!camp) {
      throw new NotFoundException(`Medical camp with ID ${id} not found.`);
    }
    return camp;
  }

  async addStaff(campId: string, dto: AddCampStaffDto): Promise<CampStaff> {
    const camp = await this.findById(campId);
    const staff = this.staffRepo.create({
      medicalCampId: camp.id,
      staffName: dto.staffName,
      role: dto.role,
      specialization: dto.specialization || null,
      userId: dto.userId || null,
    });
    return this.staffRepo.save(staff);
  }

  async recordAttendanceSummary(
    campId: string,
    dto: RecordCampAttendanceDto,
  ): Promise<CampAttendanceSummary> {
    const camp = await this.findById(campId);
    let summary = await this.summaryRepo.findOne({ where: { medicalCampId: camp.id } });

    if (!summary) {
      summary = this.summaryRepo.create({ medicalCampId: camp.id });
    }

    summary.totalPatients = dto.totalPatients;
    summary.maleCount = dto.maleCount;
    summary.femaleCount = dto.femaleCount;
    summary.childCount = dto.childCount;
    summary.prescriptionsGiven = dto.prescriptionsGiven;
    summary.freeMedicineDistributedValue = dto.freeMedicineDistributedValue || 0;
    summary.summaryNotes = dto.summaryNotes || null;

    const saved = await this.summaryRepo.save(summary);

    camp.status = 'COMPLETED';
    await this.campRepo.save(camp);

    return saved;
  }
}
