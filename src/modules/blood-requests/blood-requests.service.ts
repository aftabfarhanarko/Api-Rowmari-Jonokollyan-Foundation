import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodRequest } from './entities/blood-request.entity';
import { DonorMatch } from './entities/donor-match.entity';
import { BloodDonationOutcome } from './entities/blood-donation-outcome.entity';
import { DonorProfile } from '../donors/entities/donor-profile.entity';
import {
  CreateBloodRequestDto,
  MatchDonorDto,
  UpdateMatchStatusDto,
  RecordOutcomeDto,
} from './dto/blood-request.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { BloodRequestStatus, DonorMatchStatus } from '../../common/constants';

@Injectable()
export class BloodRequestsService {
  constructor(
    @InjectRepository(BloodRequest)
    private readonly requestRepo: Repository<BloodRequest>,
    @InjectRepository(DonorMatch)
    private readonly matchRepo: Repository<DonorMatch>,
    @InjectRepository(BloodDonationOutcome)
    private readonly outcomeRepo: Repository<BloodDonationOutcome>,
    @InjectRepository(DonorProfile)
    private readonly donorRepo: Repository<DonorProfile>,
  ) {}

  async create(dto: CreateBloodRequestDto): Promise<BloodRequest> {
    const request = this.requestRepo.create({
      patientName: dto.patientName,
      bloodGroup: dto.bloodGroup,
      unitsNeeded: dto.unitsNeeded,
      unitsFulfilled: 0,
      urgency: dto.urgency,
      requiredDate: new Date(dto.requiredDate),
      hospitalName: dto.hospitalName,
      hospitalAddress: dto.hospitalAddress || null,
      district: dto.district || 'Kurigram',
      upazila: dto.upazila || 'Roumari',
      contactPerson: dto.contactPerson,
      contactPhone: dto.contactPhone,
      medicalReason: dto.medicalReason || null,
      status: BloodRequestStatus.OPEN,
    });

    return this.requestRepo.save(request);
  }

  async findAll(
    query: PaginationQueryDto,
    filters?: { status?: BloodRequestStatus; bloodGroup?: string; district?: string },
  ): Promise<PaginatedResult<BloodRequest>> {
    const qb = this.requestRepo.createQueryBuilder('req')
      .leftJoinAndSelect('req.matches', 'matches')
      .leftJoinAndSelect('matches.donorProfile', 'donorProfile')
      .orderBy('req.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (filters?.status) {
      qb.andWhere('req.status = :status', { status: filters.status });
    }
    if (filters?.bloodGroup) {
      qb.andWhere('req.bloodGroup = :bloodGroup', { bloodGroup: filters.bloodGroup });
    }
    if (filters?.district) {
      qb.andWhere('req.district ILIKE :district', { district: `%${filters.district}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findForUser(
    query: PaginationQueryDto,
    phone: string,
  ): Promise<PaginatedResult<BloodRequest>> {
    const qb = this.requestRepo.createQueryBuilder('req')
      .leftJoinAndSelect('req.matches', 'matches')
      .leftJoinAndSelect('matches.donorProfile', 'donorProfile')
      .where('req.contactPhone = :phone', { phone: phone || '' })
      .orderBy('req.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<BloodRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['matches', 'matches.donorProfile', 'matches.outcome'],
    });

    if (!request) {
      throw new NotFoundException(`Blood request with ID ${id} not found.`);
    }

    return request;
  }

  async matchDonor(
    requestId: string,
    dto: MatchDonorDto,
    coordinatorUserId: string,
  ): Promise<DonorMatch> {
    const request = await this.findById(requestId);
    const donor = await this.donorRepo.findOne({ where: { id: dto.donorProfileId } });

    if (!donor) {
      throw new NotFoundException(`Donor profile with ID ${dto.donorProfileId} not found.`);
    }

    const existingMatch = await this.matchRepo.findOne({
      where: { bloodRequestId: requestId, donorProfileId: dto.donorProfileId },
    });

    if (existingMatch) {
      throw new ConflictException('This donor is already matched with this request.');
    }

    const match = this.matchRepo.create({
      bloodRequestId: request.id,
      donorProfileId: donor.id,
      status: DonorMatchStatus.PENDING,
      notes: dto.notes || null,
      matchedByUserId: coordinatorUserId,
    });

    const savedMatch = await this.matchRepo.save(match);

    if (request.status === BloodRequestStatus.OPEN) {
      request.status = BloodRequestStatus.MATCHED;
      await this.requestRepo.save(request);
    }

    return savedMatch;
  }

  async updateMatchStatus(matchId: string, dto: UpdateMatchStatusDto): Promise<DonorMatch> {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: ['bloodRequest', 'donorProfile'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found.`);
    }

    match.status = dto.status;
    if (dto.notes) {
      match.notes = dto.notes;
    }

    return this.matchRepo.save(match);
  }

  async recordOutcome(matchId: string, dto: RecordOutcomeDto): Promise<BloodDonationOutcome> {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: ['bloodRequest', 'donorProfile'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found.`);
    }

    const outcome = this.outcomeRepo.create({
      matchId: match.id,
      donationDate: dto.donationDate,
      unitsDonated: dto.unitsDonated,
      feedback: dto.feedback || null,
    });

    const savedOutcome = await this.outcomeRepo.save(outcome);

    // Update match status to DONATED
    match.status = DonorMatchStatus.DONATED;
    await this.matchRepo.save(match);

    // Update donor profile last donation date & availability
    const donor = match.donorProfile;
    donor.lastDonationDate = dto.donationDate;
    donor.isAvailable = false; // rest period
    await this.donorRepo.save(donor);

    // Update blood request fulfilled count
    const request = match.bloodRequest;
    request.unitsFulfilled += dto.unitsDonated;
    if (request.unitsFulfilled >= request.unitsNeeded) {
      request.status = BloodRequestStatus.FULFILLED;
    }
    await this.requestRepo.save(request);

    return savedOutcome;
  }
}
