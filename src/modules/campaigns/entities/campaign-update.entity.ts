import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from './campaign.entity';

@Entity('campaign_updates')
export class CampaignUpdate extends BaseEntity {
  @Index()
  @Column({ name: 'campaign_id' })
  campaignId: string;

  @ManyToOne(() => Campaign, (c) => c.updates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;
}
