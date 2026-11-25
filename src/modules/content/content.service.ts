import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page, NewsEvent, GalleryItem, Announcement } from './entities/content.entity';
import { WebsiteSetting } from './entities/website-setting.entity';
import { MediaFile } from './entities/media-file.entity';
import {
  CreatePageDto,
  UpdatePageDto,
  CreateNewsEventDto,
  UpdateNewsEventDto,
  CreateGalleryItemDto,
  CreateAnnouncementDto,
  WebsiteSettingDto,
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
    @InjectRepository(WebsiteSetting)
    private readonly settingRepo: Repository<WebsiteSetting>,
    @InjectRepository(MediaFile)
    private readonly mediaRepo: Repository<MediaFile>,
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
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    const existing = await this.pageRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Page with slug '${slug}' already exists.`);
    }
    const page = this.pageRepo.create({
      title: dto.title,
      slug,
      subtitle: dto.subtitle || null,
      description: dto.description || null,
      content: dto.content,
      bannerImageUrl: dto.bannerImageUrl || null,
      sections: dto.sections || null,
      seoTitle: dto.seoTitle || null,
      seoDescription: dto.seoDescription || null,
      displayOrder: dto.displayOrder || 0,
      isSystemPage: dto.isSystemPage || false,
      status: dto.status || ContentStatus.PUBLISHED,
    });
    return this.pageRepo.save(page);
  }

  async updatePage(id: string, dto: UpdatePageDto): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with ID '${id}' not found.`);
    }
    if (dto.slug && dto.slug !== page.slug) {
      const slug = this.slugify(dto.slug);
      const existing = await this.pageRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Page with slug '${slug}' already exists.`);
      }
      page.slug = slug;
    }
    if (dto.title !== undefined) page.title = dto.title;
    if (dto.subtitle !== undefined) page.subtitle = dto.subtitle || null;
    if (dto.description !== undefined) page.description = dto.description || null;
    if (dto.content !== undefined) page.content = dto.content;
    if (dto.bannerImageUrl !== undefined) page.bannerImageUrl = dto.bannerImageUrl || null;
    if (dto.sections !== undefined) page.sections = dto.sections;
    if (dto.seoTitle !== undefined) page.seoTitle = dto.seoTitle || null;
    if (dto.seoDescription !== undefined) page.seoDescription = dto.seoDescription || null;
    if (dto.displayOrder !== undefined) page.displayOrder = dto.displayOrder;
    if (dto.isSystemPage !== undefined) page.isSystemPage = dto.isSystemPage;
    if (dto.status !== undefined) page.status = dto.status;

    return this.pageRepo.save(page);
  }

  async deletePage(id: string): Promise<{ success: boolean }> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with ID '${id}' not found.`);
    }
    await this.pageRepo.remove(page);
    return { success: true };
  }

  async getPageById(id: string): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with ID '${id}' not found.`);
    }
    return page;
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

  async findAllPages(query: PaginationQueryDto, status?: ContentStatus): Promise<PaginatedResult<Page>> {
    const qb = this.pageRepo.createQueryBuilder('p')
      .orderBy('p.displayOrder', 'ASC')
      .addOrderBy('p.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (status) {
      qb.andWhere('p.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  // --- News & Events ---
  async createNewsEvent(dto: CreateNewsEventDto): Promise<NewsEvent> {
    const baseSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    const news = this.newsRepo.create({
      title: dto.title,
      slug,
      type: dto.type || 'NEWS',
      summary: dto.summary,
      content: dto.content,
      imageUrl: dto.imageUrl || null,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
      status: dto.status || ContentStatus.PUBLISHED,
    });
    return this.newsRepo.save(news);
  }

  async updateNewsEvent(id: string, dto: UpdateNewsEventDto): Promise<NewsEvent> {
    const item = await this.newsRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`News/Event with ID '${id}' not found.`);
    }
    if (dto.title !== undefined) item.title = dto.title;
    if (dto.type !== undefined) item.type = dto.type;
    if (dto.summary !== undefined) item.summary = dto.summary;
    if (dto.content !== undefined) item.content = dto.content;
    if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl || null;
    if (dto.eventDate !== undefined) item.eventDate = dto.eventDate ? new Date(dto.eventDate) : null;
    if (dto.status !== undefined) item.status = dto.status;

    return this.newsRepo.save(item);
  }

  async deleteNewsEvent(id: string): Promise<{ success: boolean }> {
    const item = await this.newsRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`News/Event with ID '${id}' not found.`);
    }
    await this.newsRepo.remove(item);
    return { success: true };
  }

  async getNewsEventById(id: string): Promise<NewsEvent> {
    const item = await this.newsRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`News/Event with ID '${id}' not found.`);
    }
    return item;
  }

  async findAllNewsEvents(
    query: PaginationQueryDto,
    type?: string,
    status?: ContentStatus,
  ): Promise<PaginatedResult<NewsEvent>> {
    const qb = this.newsRepo.createQueryBuilder('n')
      .orderBy('n.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (status) {
      qb.andWhere('n.status = :status', { status });
    }
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
      mediaType: dto.mediaType || 'IMAGE',
      caption: dto.caption || null,
    });
    return this.galleryRepo.save(item);
  }

  async deleteGalleryItem(id: string): Promise<{ success: boolean }> {
    const item = await this.galleryRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Gallery item with ID '${id}' not found.`);
    }
    await this.galleryRepo.remove(item);
    return { success: true };
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
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.announcementRepo.save(item);
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    const item = await this.announcementRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Announcement with ID '${id}' not found.`);
    }
    await this.announcementRepo.remove(item);
    return { success: true };
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // --- Website Settings ---
  async getSettings(group?: string): Promise<Record<string, any>> {
    const qb = this.settingRepo.createQueryBuilder('s');
    if (group) {
      qb.where('s.group = :group', { group });
    }
    const settings = await qb.getMany();
    const result: Record<string, any> = {};
    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }
    return result;
  }

  async getRawSettings(): Promise<WebsiteSetting[]> {
    return this.settingRepo.find({ order: { group: 'ASC', key: 'ASC' } });
  }

  async updateSettings(settings: WebsiteSettingDto[]): Promise<Record<string, any>> {
    for (const s of settings) {
      let existing = await this.settingRepo.findOne({ where: { key: s.key } });
      const valueStr = typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value);
      if (existing) {
        existing.value = valueStr;
        if (s.group) existing.group = s.group;
        if (s.description) existing.description = s.description;
        await this.settingRepo.save(existing);
      } else {
        const created = this.settingRepo.create({
          key: s.key,
          value: valueStr,
          group: s.group || 'general',
          description: s.description || null,
        });
        await this.settingRepo.save(created);
      }
    }
    return this.getSettings();
  }

  // --- Media Management ---
  async saveMedia(params: {
    originalName: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    category?: string;
    uploadedBy?: string;
  }): Promise<MediaFile> {
    const media = this.mediaRepo.create({
      originalName: params.originalName,
      fileName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      url: params.url,
      category: params.category || 'general',
      uploadedBy: params.uploadedBy || null,
    });
    return this.mediaRepo.save(media);
  }

  async findAllMedia(query: PaginationQueryDto, category?: string): Promise<PaginatedResult<MediaFile>> {
    const qb = this.mediaRepo.createQueryBuilder('m')
      .orderBy('m.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (category) {
      qb.andWhere('m.category = :category', { category });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async deleteMedia(id: string): Promise<{ success: boolean }> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media file with ID '${id}' not found.`);
    }
    await this.mediaRepo.remove(media);
    return { success: true };
  }
}
