import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CampaignStatus } from '../../../common/constants';
import { CampaignUpdate } from './campaign-update.entity';

@Entity('campaigns')
export class Campaign extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Index({ unique: true })
  @Column({ length: 220 })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100, default: 'General' })
  category: string;

  @Column({ name: 'target_amount', type: 'numeric', precision: 12, scale: 2 })
  targetAmount: number;

  @Column({ name: 'raised_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  raisedAmount: number;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'banner_image_url', type: 'varchar', length: 500, nullable: true })
  bannerImageUrl: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @OneToMany(() => CampaignUpdate, (update) => update.campaign, { cascade: true })
  updates: CampaignUpdate[];
}
