import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { CreateActivityDto } from './dto/activity.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepo.create({
      title: dto.title,
      summary: dto.summary,
      content: dto.content,
      coverImageUrl: dto.coverImageUrl || null,
      activityDate: dto.activityDate,
      location: dto.location,
      beneficiariesCount: dto.beneficiariesCount || 0,
      isPublished: dto.isPublished !== false,
    });
    return this.activityRepo.save(activity);
  }

  async findAllPublic(query: PaginationQueryDto): Promise<PaginatedResult<Activity>> {
    const [items, total] = await this.activityRepo.findAndCount({
      where: { isPublished: true },
      order: { activityDate: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<Activity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found.`);
    }
    return activity;
  }
}
