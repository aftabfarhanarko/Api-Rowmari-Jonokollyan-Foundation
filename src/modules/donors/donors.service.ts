import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonorProfile } from './entities/donor-profile.entity';
import {
  RegisterDonorDto,
  UpdateDonorAvailabilityDto,
  PublicDonorSearchResultDto,
} from './dto/donor.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { BloodGroup } from '../../common/constants';

@Injectable()
export class DonorsService {
  constructor(
    @InjectRepository(DonorProfile)
    private readonly donorRepo: Repository<DonorProfile>,
  ) {}

  async register(dto: RegisterDonorDto, userId?: string): Promise<DonorProfile> {
    const existing = await this.donorRepo.findOne({
      where: [{ phone: dto.phone }, ...(userId ? [{ userId }] : [])],
    });

    if (existing) {
      throw new ConflictException('A donor profile already exists with this phone number.');
    }

    const donor = this.donorRepo.create({
      userId: userId || null,
      fullName: dto.fullName,
      phone: dto.phone,
      bloodGroup: dto.bloodGroup,
      district: dto.district || 'Kurigram',
      upazila: dto.upazila || 'Roumari',
      lastDonationDate: dto.lastDonationDate || null,
      isAvailable: true,
      isVerified: false,
      consentToContact: dto.consentToContact !== false,
    });

    return this.donorRepo.save(donor);
  }

  // PUBLIC SEARCH: Contact information (phone, full name) is strictly masked for privacy!
  async searchPublic(
    query: PaginationQueryDto,
    filters: { bloodGroup?: BloodGroup; district?: string; upazila?: string },
  ): Promise<PaginatedResult<PublicDonorSearchResultDto>> {
    const qb = this.donorRepo.createQueryBuilder('donor')
      .where('donor.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('donor.consentToContact = :consent', { consent: true })
      .orderBy('donor.lastDonationDate', 'ASC', 'NULLS FIRST')
      .skip(query.skip)
      .take(query.limit);

    if (filters.bloodGroup) {
      qb.andWhere('donor.bloodGroup = :bloodGroup', { bloodGroup: filters.bloodGroup });
    }
    if (filters.district) {
      qb.andWhere('donor.district ILIKE :district', { district: `%${filters.district}%` });
    }
    if (filters.upazila) {
      qb.andWhere('donor.upazila ILIKE :upazila', { upazila: `%${filters.upazila}%` });
    }

    const [donors, total] = await qb.getManyAndCount();

    // Map to safe public DTO without phone number or sensitive data
    const safeDonors: PublicDonorSearchResultDto[] = donors.map((d) => ({
      id: d.id,
      bloodGroup: d.bloodGroup,
      district: d.district,
      upazila: d.upazila,
      isAvailable: d.isAvailable,
      isVerified: d.isVerified,
      lastDonationDate: d.lastDonationDate,
    }));

    return createPaginationResult(safeDonors, total, query.page, query.limit);
  }

  // COORDINATOR / ADMIN SEARCH: Full donor profile including phone
  async findAllAuthorized(
    query: PaginationQueryDto,
    filters?: { bloodGroup?: BloodGroup; district?: string; isAvailable?: boolean; search?: string },
  ): Promise<PaginatedResult<DonorProfile>> {
    const qb = this.donorRepo.createQueryBuilder('donor')
      .orderBy('donor.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (filters?.bloodGroup) {
      qb.andWhere('donor.bloodGroup = :bloodGroup', { bloodGroup: filters.bloodGroup });
    }
    if (filters?.district) {
      qb.andWhere('donor.district ILIKE :district', { district: `%${filters.district}%` });
    }
    if (filters?.isAvailable !== undefined) {
      qb.andWhere('donor.isAvailable = :isAvailable', { isAvailable: filters.isAvailable });
    }
    if (filters?.search) {
      qb.andWhere(
        '(donor.fullName ILIKE :search OR donor.phone ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findByIdAuthorized(id: string): Promise<DonorProfile> {
    const donor = await this.donorRepo.findOne({ where: { id } });
    if (!donor) {
      throw new NotFoundException(`Donor with ID ${id} not found.`);
    }
    return donor;
  }

  async updateAvailability(id: string, dto: UpdateDonorAvailabilityDto): Promise<DonorProfile> {
    const donor = await this.findByIdAuthorized(id);
    donor.isAvailable = dto.isAvailable;
    if (dto.lastDonationDate) {
      donor.lastDonationDate = dto.lastDonationDate;
    }
    return this.donorRepo.save(donor);
  }

  async verifyDonor(id: string, isVerified: boolean): Promise<DonorProfile> {
    const donor = await this.findByIdAuthorized(id);
    donor.isVerified = isVerified;
    return this.donorRepo.save(donor);
  }
}
