import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Committee } from './entities/committee.entity';
import { Designation } from './entities/designation.entity';
import { Member } from './entities/member.entity';
import { CommitteeMembership } from './entities/committee-membership.entity';
import {
  CreateCommitteeDto,
  CreateDesignationDto,
  CreateMemberDto,
  AssignMembershipDto,
} from './dto/committee.dto';

@Injectable()
export class CommitteesService {
  constructor(
    @InjectRepository(Committee)
    private readonly committeeRepo: Repository<Committee>,
    @InjectRepository(Designation)
    private readonly designationRepo: Repository<Designation>,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @InjectRepository(CommitteeMembership)
    private readonly membershipRepo: Repository<CommitteeMembership>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. Committees
  async getCommittees(status = 'PUBLISHED') {
    return this.committeeRepo.find({
      where: status === 'ALL' ? {} : { status },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      relations: ['memberships', 'memberships.member', 'memberships.designation'],
    });
  }

  async getCommitteeById(id: string) {
    const committee = await this.committeeRepo.findOne({
      where: { id },
      relations: ['memberships', 'memberships.member', 'memberships.designation'],
    });
    if (!committee) throw new NotFoundException('Committee not found');
    return committee;
  }

  async createCommittee(dto: CreateCommitteeDto) {
    const committee = this.committeeRepo.create(dto);
    return this.committeeRepo.save(committee);
  }

  async updateCommittee(id: string, dto: Partial<CreateCommitteeDto>) {
    const committee = await this.getCommitteeById(id);
    Object.assign(committee, dto);
    return this.committeeRepo.save(committee);
  }

  async deleteCommittee(id: string) {
    await this.committeeRepo.delete(id);
    return { success: true };
  }

  // 2. Designations
  async getDesignations() {
    return this.designationRepo.find({
      order: { priority: 'ASC' },
    });
  }

  async createDesignation(dto: CreateDesignationDto) {
    const entity = this.designationRepo.create(dto);
    return this.designationRepo.save(entity);
  }

  async updateDesignation(id: string, dto: Partial<CreateDesignationDto>) {
    const item = await this.designationRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Designation not found');
    Object.assign(item, dto);
    return this.designationRepo.save(item);
  }

  // 3. Concurrency-Safe Member ID Generation & Member Creation
  async createMember(dto: CreateMemberDto) {
    return this.dataSource.transaction(async (manager) => {
      // Get nextval atomically from Postgres sequence
      const seqRes = await manager.query("SELECT nextval('rjf_member_id_seq') as seq;");
      const num = seqRes[0]?.seq || Date.now().toString().slice(-6);
      const memberId = `RJF-${String(num).padStart(6, '0')}`;

      const { committeeId, designationId, ...memberData } = dto;
      const member = manager.create(Member, {
        ...memberData,
        memberId,
      });
      const savedMember = await manager.save(member);

      // If initial committee & designation specified, create membership record
      if (committeeId && designationId) {
        const membership = manager.create(CommitteeMembership, {
          memberId: savedMember.id,
          committeeId,
          designationId,
          status: 'ACTIVE',
        });
        await manager.save(membership);
      }

      return savedMember;
    });
  }

  async getMembers(search?: string, limit = 50, page = 1) {
    const qb = this.memberRepo.createQueryBuilder('m');
    if (search) {
      qb.where(
        '(LOWER(m.nameBn) LIKE :s OR LOWER(m.nameEn) LIKE :s OR LOWER(m.memberId) LIKE :s OR m.phoneNumber LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }
    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getMemberById(id: string) {
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.memberships', 'mem')
      .leftJoinAndSelect('mem.committee', 'c')
      .leftJoinAndSelect('mem.designation', 'd')
      .where('m.id = :id OR UPPER(m.memberId) = :memberId', {
        id,
        memberId: id.trim().toUpperCase(),
      });

    const member = await qb.getOne();
    if (!member) {
      throw new NotFoundException(`সদস্য রেকর্ড পাওয়া যায়নি।`);
    }
    return member;
  }

  // 4. Public Verification by RJF Member ID
  async verifyMemberById(memberId: string) {
    const normalized = memberId.trim().toUpperCase();
    const member = await this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.memberships', 'mem')
      .leftJoinAndSelect('mem.committee', 'c')
      .leftJoinAndSelect('mem.designation', 'd')
      .where('UPPER(m.memberId) = :id', { id: normalized })
      .getOne();

    if (!member) {
      throw new NotFoundException(`RJF আইডি '${normalized}' দিয়ে কোনো অনুমোদিত সদস্য রেকর্ড পাওয়া যায়নি।`);
    }

    // Sanitize response for public display
    return {
      memberId: member.memberId,
      nameBn: member.nameBn,
      nameEn: member.nameEn,
      photoUrl: member.photoUrl,
      village: member.village,
      unionName: member.unionName,
      upazila: member.upazila,
      district: member.district,
      bio: member.bio,
      status: member.status,
      committees: member.memberships.map((mem) => ({
        committeeName: mem.committee?.name,
        committeeYear: mem.committee?.year,
        committeeType: mem.committee?.type,
        designationBn: mem.designation?.titleBn,
        designationEn: mem.designation?.titleEn,
        status: mem.status,
      })),
    };
  }

  // 5. Membership assignment
  async assignMembership(dto: AssignMembershipDto) {
    const existing = await this.membershipRepo.findOne({
      where: { memberId: dto.memberId, committeeId: dto.committeeId },
    });
    if (existing) {
      existing.designationId = dto.designationId;
      if (dto.status) existing.status = dto.status;
      return this.membershipRepo.save(existing);
    }
    const membership = this.membershipRepo.create(dto);
    return this.membershipRepo.save(membership);
  }

  async removeMembership(membershipId: string) {
    await this.membershipRepo.delete(membershipId);
    return { success: true };
  }
}
