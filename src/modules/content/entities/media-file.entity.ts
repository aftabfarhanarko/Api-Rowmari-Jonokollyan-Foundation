import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('media_files')
export class MediaFile extends BaseEntity {
  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  @Index({ unique: true })
  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: number;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 50, default: 'general' })
  category: string;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string | null;
}
