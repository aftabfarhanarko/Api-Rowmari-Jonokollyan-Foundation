import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HelpApplication } from './entities/help-application.entity';
import { ApplicationDocument } from './entities/application-document.entity';
import { ApplicationStatusHistory } from './entities/application-status-history.entity';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  TrackApplicationDto,
  AddDocumentDto,
} from './dto/application.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { ApplicationStatus } from '../../common/constants';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(HelpApplication)
    private readonly appRepo: Repository<HelpApplication>,
    @InjectRepository(ApplicationDocument)
    private readonly docRepo: Repository<ApplicationDocument>,
    @InjectRepository(ApplicationStatusHistory)
    private readonly historyRepo: Repository<ApplicationStatusHistory>,
    private readonly dataSource: DataSource,
  ) {}

  private async generateReferenceCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.appRepo.count();
    const sequence = (count + 1).toString().padStart(6, '0');
    return `RKF-${year}-${sequence}`;
  }

  async create(dto: CreateApplicationDto, applicantUserId?: string): Promise<HelpApplication> {
    const referenceCode = await this.generateReferenceCode();

    const application = this.appRepo.create({
      referenceCode,
      applicantUserId: applicantUserId || null,
      applicantName: dto.applicant.fullName,
      applicantPhone: dto.applicant.phone,
      applicantEmail: dto.applicant.email || null,
      district: dto.applicant.district || 'Kurigram',
      upazila: dto.applicant.upazila || 'Roumari',
      address: dto.applicant.address || null,
      category: dto.category,
      requestedAmount: dto.requestedAmount || null,
      description: dto.description,
      privacyAccepted: dto.consent.privacyAccepted,
      contactAllowed: dto.consent.contactAllowed,
      status: ApplicationStatus.PENDING,
    });

    const savedApp = await this.appRepo.save(application);

    // Initial status history entry
    const initialHistory = this.historyRepo.create({
      applicationId: savedApp.id,
      fromStatus: null,
      toStatus: ApplicationStatus.PENDING,
      remarks: 'Application submitted successfully.',
    });
    await this.historyRepo.save(initialHistory);

    return savedApp;
  }

  async track(dto: TrackApplicationDto): Promise<any> {
    const app = await this.appRepo.findOne({
      where: {
        referenceCode: dto.referenceCode,
        applicantPhone: dto.phone,
      },
      relations: ['statusHistory'],
    });

    if (!app) {
      throw new NotFoundException('No application found with provided reference code and phone number.');
    }

    return {
      referenceCode: app.referenceCode,
      category: app.category,
      status: app.status,
      applicantName: app.applicantName,
      requestedAmount: app.requestedAmount,
      approvedAmount: app.approvedAmount,
      district: app.district,
      upazila: app.upazila,
      submittedAt: app.createdAt,
      updatedAt: app.updatedAt,
      timeline: app.statusHistory.map((h) => ({
        status: h.toStatus,
        remarks: h.remarks,
        date: h.createdAt,
      })),
    };
  }

  async findAll(
    query: PaginationQueryDto,
    filters?: { status?: ApplicationStatus; category?: string; search?: string },
  ): Promise<PaginatedResult<HelpApplication>> {
    const qb = this.appRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.assignedTo', 'assignedTo')
      .orderBy('app.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (filters?.status) {
      qb.andWhere('app.status = :status', { status: filters.status });
    }

    if (filters?.category) {
      qb.andWhere('app.category = :category', { category: filters.category });
    }

    if (filters?.search) {
      qb.andWhere(
        '(app.referenceCode ILIKE :search OR app.applicantName ILIKE :search OR app.applicantPhone ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<HelpApplication> {
    const app = await this.appRepo.findOne({
      where: { id },
      relations: ['documents', 'statusHistory', 'statusHistory.changedByUser', 'assignedTo'],
    });
    if (!app) {
      throw new NotFoundException(`Application with ID ${id} not found.`);
    }
    return app;
  }

  async updateStatus(
    id: string,
    dto: UpdateApplicationStatusDto,
    staffUserId: string,
  ): Promise<HelpApplication> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const app = await queryRunner.manager.findOne(HelpApplication, { where: { id } });
      if (!app) {
        throw new NotFoundException(`Application with ID ${id} not found.`);
      }

      const previousStatus = app.status;
      app.status = dto.status;
      if (dto.approvedAmount !== undefined) {
        app.approvedAmount = dto.approvedAmount;
      }

      await queryRunner.manager.save(app);

      // Append status history
      const history = queryRunner.manager.create(ApplicationStatusHistory, {
        applicationId: app.id,
        fromStatus: previousStatus,
        toStatus: dto.status,
        remarks: dto.remarks || `Status transitioned from ${previousStatus} to ${dto.status}`,
        changedByUserId: staffUserId,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();
      return this.findById(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async assignStaff(id: string, staffUserId: string): Promise<HelpApplication> {
    const app = await this.findById(id);
    app.assignedToId = staffUserId;
    return this.appRepo.save(app);
  }

  async addDocument(applicationId: string, dto: AddDocumentDto): Promise<ApplicationDocument> {
    const app = await this.findById(applicationId);
    const doc = this.docRepo.create({
      applicationId: app.id,
      documentType: dto.documentType,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      fileSizeBytes: dto.fileSizeBytes || 0,
      mimeType: dto.mimeType || 'application/octet-stream',
    });
    return this.docRepo.save(doc);
  }
}
