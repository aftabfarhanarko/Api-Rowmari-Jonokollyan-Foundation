import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('contact_messages')
export class ContactMessage extends BaseEntity {
  @Column({ length: 120 })
  name: string;

  @Column({ name: 'contact_info', length: 254 })
  contactInfo: string;

  @Column({ type: 'text' })
  message: string;
}
