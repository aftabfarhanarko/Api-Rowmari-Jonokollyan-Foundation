import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Page, NewsEvent, GalleryItem, Announcement } from '../content/entities/content.entity';
import { WebsiteSetting } from '../content/entities/website-setting.entity';
import { MediaFile } from '../content/entities/media-file.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Donation } from '../donations/entities/donation.entity';
import { HelpApplication } from '../applications/entities/help-application.entity';
import { BloodRequest } from '../blood-requests/entities/blood-request.entity';
import { ContactMessage } from '../contact/entities/contact-message.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AdminUserQueryDto, CreateAdminUserDto } from './dto/admin.dto';
import { UsersService } from '../users/users.service';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { UserStatus, ContentStatus, DonationStatus } from '../../common/constants';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(NewsEvent)
    private readonly newsRepo: Repository<NewsEvent>,
    @InjectRepository(GalleryItem)
    private readonly galleryRepo: Repository<GalleryItem>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(WebsiteSetting)
    private readonly settingRepo: Repository<WebsiteSetting>,
    @InjectRepository(MediaFile)
    private readonly mediaRepo: Repository<MediaFile>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    @InjectRepository(HelpApplication)
    private readonly applicationRepo: Repository<HelpApplication>,
    @InjectRepository(BloodRequest)
    private readonly bloodRequestRepo: Repository<BloodRequest>,
    @InjectRepository(ContactMessage)
    private readonly contactRepo: Repository<ContactMessage>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    private readonly usersService: UsersService,
  ) { }

  async getDashboardOverview() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalPages,
      publishedPages,
      draftPages,
      totalNews,
      totalGallery,
      totalCampaigns,
      totalApplications,
      totalContactMessages,
      recentUsers,
      recentActivityLogs,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { status: UserStatus.ACTIVE } }),
      this.userRepo.count({ where: { status: UserStatus.SUSPENDED } }),
      this.pageRepo.count(),
      this.pageRepo.count({ where: { status: ContentStatus.PUBLISHED } }),
      this.pageRepo.count({ where: { status: ContentStatus.DRAFT } }),
      this.newsRepo.count(),
      this.galleryRepo.count(),
      this.campaignRepo.count(),
      this.applicationRepo.count(),
      this.contactRepo.count(),
      this.userRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
        select: ['id', 'fullName', 'email', 'phone', 'status', 'createdAt'],
      }),
      this.auditLogRepo.find({
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        recent: recentUsers,
      },
      cms: {
        totalPages,
        publishedPages,
        draftPages,
        totalNews,
        totalGallery,
      },
      operations: {
        totalCampaigns,
        totalApplications,
        totalContactMessages,
        totalDonations: 0,
        totalDonationsAmount: 0,
      },
      recentActivityLogs,
    };
  }

  // --- User Management ---
  async getUsers(query: AdminUserQueryDto): Promise<PaginatedResult<User>> {
    const qb = this.userRepo.createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .orderBy('u.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (query.status) {
      qb.andWhere('u.status = :status', { status: query.status });
    }

    if (query.q) {
      const search = `%${query.q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(u.fullName) LIKE :search OR LOWER(u.email) LIKE :search OR u.phone LIKE :search)',
        { search },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['roles'] });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    // Protect Super Admin from deactivating their own administrative account
    const isSuperAdmin = (user.roles || []).some(
      (r) => (typeof r === 'string' ? r : r.name) === 'SUPER_ADMIN',
    );
    if (isSuperAdmin && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Cannot deactivate a Super Admin account.');
    }

    user.status = status;
    return this.userRepo.save(user);
  }

  async createUser(dto: CreateAdminUserDto): Promise<User> {
    return this.usersService.create(
      {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: dto.password,
        district: dto.district,
        upazila: dto.upazila,
        address: dto.address,
      },
      dto.roles && dto.roles.length > 0 ? dto.roles : ['COMMUNITY_MEMBER'],
    );
  }

  async updateUserRoles(id: string, roles: string[]): Promise<User> {
    return this.usersService.assignRoles(id, roles);
  }

  async deleteUser(id: string, currentUserId?: string): Promise<{ success: boolean; message: string }> {
    if (currentUserId && id === currentUserId) {
      throw new BadRequestException('আপনি নিজের অ্যাকাউন্ট মুছে ফেলতে পারবেন না।');
    }

    const user = await this.userRepo.findOne({ where: { id }, relations: ['roles'] });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    const isSuperAdmin = (user.roles || []).some(
      (r) => (typeof r === 'string' ? r : r.name) === 'SUPER_ADMIN',
    );
    if (isSuperAdmin) {
      const allUsers = await this.userRepo.find({ relations: ['roles'] });
      const superAdminCount = allUsers.filter((u) =>
        (u.roles || []).some((r) => (typeof r === 'string' ? r : r.name) === 'SUPER_ADMIN'),
      ).length;
      if (superAdminCount <= 1) {
        throw new BadRequestException('সিস্টেমের একমাত্র সুপার অ্যাডমিন অ্যাকাউন্টটি মুছে ফেলা সম্ভব নয়।');
      }
    }

    await this.userRepo.remove(user);
    return { success: true, message: `'${user.fullName}' অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।` };
  }

  // --- Contact Messages ---
  async getContactMessages(query: PaginationQueryDto): Promise<PaginatedResult<ContactMessage>> {
    const [items, total] = await this.contactRepo.findAndCount({
      skip: query.skip,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async deleteContactMessage(id: string): Promise<{ success: boolean }> {
    const msg = await this.contactRepo.findOne({ where: { id } });
    if (!msg) {
      throw new NotFoundException(`Message with ID '${id}' not found.`);
    }
    await this.contactRepo.remove(msg);
    return { success: true };
  }

  // --- Activity Logs ---
  async getActivityLogs(query: PaginationQueryDto): Promise<PaginatedResult<AuditLog>> {
    const [items, total] = await this.auditLogRepo.findAndCount({
      skip: query.skip,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });
    return createPaginationResult(items, total, query.page, query.limit);
  }
}
