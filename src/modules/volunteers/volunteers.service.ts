import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { VolunteerProfile } from './entities/volunteer-profile.entity';
import { VolunteerAssignment } from './entities/volunteer-assignment.entity';
import { RegisterVolunteerDto, CreateAssignmentDto } from './dto/volunteer.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class VolunteersService {
  constructor(
    @InjectRepository(VolunteerProfile)
    private readonly volunteerRepo: Repository<VolunteerProfile>,
    @InjectRepository(VolunteerAssignment)
    private readonly assignmentRepo: Repository<VolunteerAssignment>,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterVolunteerDto, userId?: string): Promise<VolunteerProfile> {
    const existing = await this.volunteerRepo.findOne({
      where: [{ phone: dto.phone }, ...(userId ? [{ userId }] : [])],
    });

    if (existing) {
      throw new ConflictException('A volunteer profile already exists with this phone number.');
    }

    const volunteer = this.volunteerRepo.create({
      userId: userId || null,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email || null,
      district: dto.district || 'Kurigram',
      upazila: dto.upazila || 'Roumari',
      skills: dto.skills || null,
      availabilityHoursPerWeek: dto.availabilityHoursPerWeek || 5,
      isApproved: false,
      isActive: true,
    });

    return this.volunteerRepo.save(volunteer);
  }

  async findAll(query: PaginationQueryDto, isApproved?: boolean): Promise<PaginatedResult<VolunteerProfile>> {
    const qb = this.volunteerRepo.createQueryBuilder('v')
      .leftJoinAndSelect('v.assignments', 'assignments')
      .orderBy('v.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (isApproved !== undefined) {
      qb.andWhere('v.isApproved = :isApproved', { isApproved });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<VolunteerProfile> {
    const volunteer = await this.volunteerRepo.findOne({
      where: { id },
      relations: ['assignments'],
    });
    if (!volunteer) {
      throw new NotFoundException(`Volunteer with ID ${id} not found.`);
    }
    return volunteer;
  }

  async approve(id: string, isApproved: boolean): Promise<VolunteerProfile> {
    const volunteer = await this.findById(id);
    volunteer.isApproved = isApproved;

    // Ensure approved volunteer with an email can log in as a member
    if (isApproved && !volunteer.userId && volunteer.email) {
      const existingUsers = await this.dataSource.query(
        'SELECT id FROM users WHERE email = $1 OR phone = $2 LIMIT 1',
        [volunteer.email, volunteer.phone],
      );

      let userId: string;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        await this.dataSource.query(
          "UPDATE users SET status = 'ACTIVE', is_email_verified = true WHERE id = $1",
          [userId],
        );
      } else {
        const passwordHash = await argon2.hash(volunteer.phone);
        const inserted = await this.dataSource.query(
          `INSERT INTO users (full_name, email, phone, password_hash, status, is_email_verified, is_phone_verified, district, upazila)
           VALUES ($1, $2, $3, $4, 'ACTIVE', true, true, $5, $6)
           RETURNING id`,
          [
            volunteer.fullName,
            volunteer.email,
            volunteer.phone,
            passwordHash,
            volunteer.district || 'Kurigram',
            volunteer.upazila || 'Roumari',
          ],
        );
        userId = inserted[0].id;
      }

      const memberRole = await this.dataSource.query(
        "SELECT id FROM roles WHERE name = 'COMMUNITY_MEMBER' LIMIT 1",
      );
      if (memberRole.length > 0) {
        await this.dataSource.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, memberRole[0].id],
        );
      }
      volunteer.userId = userId;
    }

    return this.volunteerRepo.save(volunteer);
  }

  async assign(dto: CreateAssignmentDto): Promise<VolunteerAssignment> {
    const volunteer = await this.findById(dto.volunteerId);
    const assignment = this.assignmentRepo.create({
      volunteerId: volunteer.id,
      taskTitle: dto.taskTitle,
      eventOrCampId: dto.eventOrCampId || null,
      assignedRole: dto.assignedRole,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      status: 'ASSIGNED',
    });

    return this.assignmentRepo.save(assignment);
  }
}
