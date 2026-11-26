import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('roumari_directories')
export class RoumariDirectory extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Index()
  @Column({ length: 100 })
  category: string; // BUS_COUNTER, POLICE, FIRE_SERVICE, HOSPITAL, GOV_OFFICE, UPAZILA_PARISHAD, POST_OFFICE, EDUCATION, BANK, EMERGENCY, OTHER

  @Column({ name: 'phone_number', length: 50 })
  phoneNumber: string;

  @Column({ name: 'alt_phone_number', length: 50, nullable: true })
  altPhoneNumber: string | null;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'map_url', type: 'varchar', length: 500, nullable: true })
  mapUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'opening_hours', length: 100, nullable: true })
  openingHours: string | null;

  @Column({ name: 'is_emergency', default: false })
  isEmergency: boolean;

  @Column({ default: 'PUBLISHED' }) // PUBLISHED, DRAFT
  status: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;
}
