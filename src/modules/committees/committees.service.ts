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
      order: { priority: 'ASC', createdAt: 'ASC' },
    });
  }

  async createDesignation(dto: CreateDesignationDto) {
    const baseSlug = (dto.slug || dto.titleEn || dto.titleBn)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `desig-${Date.now().toString().slice(-4)}`;

    let slug = baseSlug;
    let counter = 1;
    while (await this.designationRepo.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const entity = this.designationRepo.create({
      ...dto,
      slug,
      priority: dto.priority !== undefined ? Number(dto.priority) : 100,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });
    return this.designationRepo.save(entity);
  }

  async updateDesignation(id: string, dto: Partial<CreateDesignationDto>) {
    const item = await this.designationRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Designation not found');

    if (dto.titleBn !== undefined) item.titleBn = dto.titleBn;
    if (dto.titleEn !== undefined) item.titleEn = dto.titleEn;
    if (dto.description !== undefined) item.description = dto.description || null;
    if (dto.priority !== undefined) item.priority = Number(dto.priority);
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    if (dto.slug && dto.slug !== item.slug) {
      const existing = await this.designationRepo.findOne({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Slug '${dto.slug}' already exists.`);
      }
      item.slug = dto.slug;
    }

    return this.designationRepo.save(item);
  }

  async deleteDesignation(id: string) {
    const item = await this.designationRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Designation not found');

    // Remove any memberships assigned to this designation
    await this.membershipRepo.delete({ designationId: id });
    await this.designationRepo.remove(item);
    return { success: true };
  }

  // 3. Concurrency-Safe Member ID Generation & Member Creation
  async createMember(dto: CreateMemberDto) {
    return this.dataSource.transaction(async (manager) => {
      // Ensure sequence exists if not already
      await manager.query("CREATE SEQUENCE IF NOT EXISTS rjf_member_id_seq START WITH 1 INCREMENT BY 1;");
      const seqRes = await manager.query("SELECT nextval('rjf_member_id_seq') as seq;");
      const num = seqRes[0]?.seq || Date.now().toString().slice(-6);
      const memberId = `RJF-${String(num).padStart(6, '0')}`;

      const committeeId = dto.committeeId && dto.committeeId.trim() !== '' ? dto.committeeId : null;
      const designationId = dto.designationId && dto.designationId.trim() !== '' ? dto.designationId : null;

      const { committeeId: _, designationId: __, ...memberData } = dto;
      const member = manager.create(Member, {
        ...memberData,
        memberId,
        status: dto.status || 'ACTIVE',
      });
      const savedMember = await manager.save(member);

      // If initial committee & designation specified, verify and create membership
      if (committeeId && designationId) {
        const comm = await manager.findOne(Committee, { where: { id: committeeId } });
        const desig = await manager.findOne(Designation, { where: { id: designationId } });
        if (comm && desig) {
          const membership = manager.create(CommitteeMembership, {
            memberId: savedMember.id,
            committeeId,
            designationId,
            status: 'ACTIVE',
          });
          await manager.save(membership);
        }
      }

      return savedMember;
    });
  }

  async getMembers(search?: string, limit = 100, page = 1) {
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.memberships', 'mem')
      .leftJoinAndSelect('mem.committee', 'c')
      .leftJoinAndSelect('mem.designation', 'd');

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

  async updateMember(id: string, dto: Partial<CreateMemberDto>) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Member not found');

    const { committeeId, designationId, ...memberData } = dto;
    Object.assign(member, memberData);
    const saved = await this.memberRepo.save(member);

    if (committeeId && designationId) {
      await this.assignMembership({
        memberId: saved.id,
        committeeId,
        designationId,
        status: 'ACTIVE',
      });
    }

    return this.getMemberById(saved.id);
  }

  async deleteMember(id: string) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Member not found');

    await this.membershipRepo.delete({ memberId: id });
    await this.memberRepo.remove(member);
    return { success: true };
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
