import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoumariDirectory } from './entities/roumari-directory.entity';
import { RoumariTouristPlace } from './entities/roumari-tourist-place.entity';
import { RoumariNews } from './entities/roumari-news.entity';
import {
  CreateRoumariDirectoryDto,
  CreateRoumariTouristPlaceDto,
  CreateRoumariNewsDto,
} from './dto/roumari.dto';

@Injectable()
export class RoumariService {
  constructor(
    @InjectRepository(RoumariDirectory)
    private readonly directoryRepo: Repository<RoumariDirectory>,
    @InjectRepository(RoumariTouristPlace)
    private readonly touristRepo: Repository<RoumariTouristPlace>,
    @InjectRepository(RoumariNews)
    private readonly newsRepo: Repository<RoumariNews>,
  ) {}

  // 1. Directory
  async getDirectories(category?: string, search?: string) {
    const qb = this.directoryRepo.createQueryBuilder('dir');
    qb.where('dir.status = :status', { status: 'PUBLISHED' });
    if (category && category !== 'ALL') {
      qb.andWhere('dir.category = :category', { category });
    }
    if (search) {
      qb.andWhere('(LOWER(dir.name) LIKE :s OR dir.phoneNumber LIKE :s OR LOWER(dir.address) LIKE :s)', {
        s: `%${search.toLowerCase()}%`,
      });
    }
    qb.orderBy('dir.displayOrder', 'ASC').addOrderBy('dir.createdAt', 'DESC');
    return qb.getMany();
  }

  async getEmergencyContacts() {
    return this.directoryRepo.find({
      where: { isEmergency: true, status: 'PUBLISHED' },
      order: { displayOrder: 'ASC' },
    });
  }

  async createDirectory(dto: CreateRoumariDirectoryDto) {
    const entity = this.directoryRepo.create(dto);
    return this.directoryRepo.save(entity);
  }

  async updateDirectory(id: string, dto: Partial<CreateRoumariDirectoryDto>) {
    const item = await this.directoryRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Directory entry not found');
    Object.assign(item, dto);
    return this.directoryRepo.save(item);
  }

  async deleteDirectory(id: string) {
    await this.directoryRepo.delete(id);
    return { success: true };
  }

  // 2. Tourist Places
  async getTouristPlaces() {
    return this.touristRepo.find({
      where: { status: 'PUBLISHED' },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async getTouristPlaceBySlug(slug: string) {
    const place = await this.touristRepo.findOne({ where: { slug, status: 'PUBLISHED' } });
    if (!place) throw new NotFoundException('Tourist place not found');
    return place;
  }

  async createTouristPlace(dto: CreateRoumariTouristPlaceDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF-]+/g, '-')
      .replace(/--+/g, '-') + '-' + Date.now().toString().slice(-4);
    const entity = this.touristRepo.create({ ...dto, slug });
    return this.touristRepo.save(entity);
  }

  async updateTouristPlace(id: string, dto: Partial<CreateRoumariTouristPlaceDto>) {
    const item = await this.touristRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Tourist place not found');
    Object.assign(item, dto);
    return this.touristRepo.save(item);
  }

  async deleteTouristPlace(id: string) {
    await this.touristRepo.delete(id);
    return { success: true };
  }

  // 3. News Portal
  async getNews(category?: string, search?: string, limit = 20, page = 1) {
    const qb = this.newsRepo.createQueryBuilder('news');
    qb.where('news.status = :status', { status: 'PUBLISHED' });
    if (category && category !== 'ALL') {
      qb.andWhere('news.category = :category', { category });
    }
    if (search) {
      qb.andWhere('(LOWER(news.headline) LIKE :s OR LOWER(news.content) LIKE :s)', {
        s: `%${search.toLowerCase()}%`,
      });
    }
    qb.orderBy('news.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getNewsBySlug(slug: string) {
    const news = await this.newsRepo.findOne({ where: { slug, status: 'PUBLISHED' } });
    if (!news) throw new NotFoundException('News article not found');
    news.viewCount += 1;
    await this.newsRepo.save(news);
    return news;
  }

  async createNews(dto: CreateRoumariNewsDto) {
    const slug = dto.headline
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF-]+/g, '-')
      .replace(/--+/g, '-') + '-' + Date.now().toString().slice(-4);
    const entity = this.newsRepo.create({ ...dto, slug });
    return this.newsRepo.save(entity);
  }

  async updateNews(id: string, dto: Partial<CreateRoumariNewsDto>) {
    const item = await this.newsRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('News article not found');
    Object.assign(item, dto);
    return this.newsRepo.save(item);
  }

  async deleteNews(id: string) {
    await this.newsRepo.delete(id);
    return { success: true };
  }

  // 4. Portal Overview Data
  async getPortalOverview() {
    const emergencyContacts = await this.getEmergencyContacts();
    const latestNews = await this.newsRepo.find({
      where: { status: 'PUBLISHED' },
      order: { publishedAt: 'DESC' },
      take: 6,
    });
    const touristPlaces = await this.touristRepo.find({
      where: { status: 'PUBLISHED' },
      order: { displayOrder: 'ASC' },
      take: 4,
    });
    const categoriesCount = await this.directoryRepo
      .createQueryBuilder('dir')
      .select('dir.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dir.category')
      .getRawMany();

    return {
      emergencyContacts,
      latestNews,
      touristPlaces,
      directoryStats: categoriesCount,
    };
  }
}
