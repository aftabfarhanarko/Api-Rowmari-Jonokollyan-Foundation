import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page, NewsEvent, GalleryItem, Announcement } from './entities/content.entity';
import {
  CreatePageDto,
  CreateNewsEventDto,
  CreateGalleryItemDto,
  CreateAnnouncementDto,
} from './dto/content.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { ContentStatus } from '../../common/constants';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(NewsEvent)
    private readonly newsRepo: Repository<NewsEvent>,
    @InjectRepository(GalleryItem)
    private readonly galleryRepo: Repository<GalleryItem>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
  ) {}

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // --- Pages ---
  async createPage(dto: CreatePageDto): Promise<Page> {
    const slug = dto.slug || this.slugify(dto.title);
    const existing = await this.pageRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Page with slug '${slug}' already exists.`);
    }
    const page = this.pageRepo.create({
      title: dto.title,
      slug,
      content: dto.content,
      status: dto.status || ContentStatus.PUBLISHED,
    });
    return this.pageRepo.save(page);
  }

  async getPageBySlug(slug: string): Promise<Page> {
    const page = await this.pageRepo.findOne({
      where: { slug, status: ContentStatus.PUBLISHED },
    });
    if (!page) {
      throw new NotFoundException(`Page '${slug}' not found.`);
    }
    return page;
  }

  // --- News & Events ---
  async createNewsEvent(dto: CreateNewsEventDto): Promise<NewsEvent> {
    const slug = dto.slug || `${this.slugify(dto.title)}-${Date.now().toString().slice(-4)}`;
    const news = this.newsRepo.create({
      title: dto.title,
      slug,
      type: dto.type,
      summary: dto.summary,
      content: dto.content,
      imageUrl: dto.imageUrl || null,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
      status: ContentStatus.PUBLISHED,
    });
    return this.newsRepo.save(news);
  }

  async findAllNewsEvents(query: PaginationQueryDto, type?: string): Promise<PaginatedResult<NewsEvent>> {
    const qb = this.newsRepo.createQueryBuilder('n')
      .where('n.status = :status', { status: ContentStatus.PUBLISHED })
      .orderBy('n.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (type) {
      qb.andWhere('n.type = :type', { type });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async getNewsEventBySlug(slug: string): Promise<NewsEvent> {
    const item = await this.newsRepo.findOne({
      where: { slug, status: ContentStatus.PUBLISHED },
    });
    if (!item) {
      throw new NotFoundException(`News/Event item '${slug}' not found.`);
    }
    return item;
  }

  // --- Gallery ---
  async createGalleryItem(dto: CreateGalleryItemDto): Promise<GalleryItem> {
    const item = this.galleryRepo.create({
      title: dto.title,
      category: dto.category || 'General',
      mediaUrl: dto.mediaUrl,
      mediaType: 'IMAGE',
      caption: dto.caption || null,
    });
    return this.galleryRepo.save(item);
  }

  async findAllGallery(query: PaginationQueryDto, category?: string): Promise<PaginatedResult<GalleryItem>> {
    const qb = this.galleryRepo.createQueryBuilder('g')
      .orderBy('g.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (category) {
      qb.andWhere('g.category = :category', { category });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  // --- Announcements ---
  async createAnnouncement(dto: CreateAnnouncementDto): Promise<Announcement> {
    const item = this.announcementRepo.create({
      title: dto.title,
      message: dto.message,
      severity: dto.severity || 'INFO',
      isActive: true,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.announcementRepo.save(item);
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}
