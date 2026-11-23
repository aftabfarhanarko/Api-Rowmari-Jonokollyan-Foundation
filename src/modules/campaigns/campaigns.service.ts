import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignUpdate } from './entities/campaign-update.entity';
import { CreateCampaignDto, CreateCampaignUpdateDto } from './dto/campaign.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { CampaignStatus } from '../../common/constants';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignUpdate)
    private readonly updateRepo: Repository<CampaignUpdate>,
  ) {}

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;
  }

  async create(dto: CreateCampaignDto): Promise<Campaign> {
    const slug = dto.slug || this.slugify(dto.title);
    const existing = await this.campaignRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Campaign with slug '${slug}' already exists.`);
    }

    const campaign = this.campaignRepo.create({
      title: dto.title,
      slug,
      description: dto.description,
      category: dto.category || 'General',
      targetAmount: dto.targetAmount,
      raisedAmount: 0,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      bannerImageUrl: dto.bannerImageUrl || null,
      status: dto.status || CampaignStatus.DRAFT,
      isFeatured: dto.isFeatured || false,
    });

    return this.campaignRepo.save(campaign);
  }

  async findAllPublic(query: PaginationQueryDto): Promise<PaginatedResult<Campaign>> {
    const [items, total] = await this.campaignRepo.findAndCount({
      where: { status: CampaignStatus.ACTIVE },
      order: { isFeatured: 'DESC', createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
      relations: ['updates'],
    });
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findAllAdmin(query: PaginationQueryDto, status?: CampaignStatus): Promise<PaginatedResult<Campaign>> {
    const qb = this.campaignRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.updates', 'updates')
      .orderBy('c.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (status) {
      qb.andWhere('c.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findBySlug(slug: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({
      where: { slug },
      relations: ['updates'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with slug '${slug}' not found.`);
    }
    return campaign;
  }

  async findById(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({
      where: { id },
      relations: ['updates'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found.`);
    }
    return campaign;
  }

  async addUpdate(campaignId: string, dto: CreateCampaignUpdateDto): Promise<CampaignUpdate> {
    const campaign = await this.findById(campaignId);
    const update = this.updateRepo.create({
      campaignId: campaign.id,
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl || null,
    });
    return this.updateRepo.save(update);
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    const campaign = await this.findById(id);
    campaign.status = status;
    return this.campaignRepo.save(campaign);
  }
}
