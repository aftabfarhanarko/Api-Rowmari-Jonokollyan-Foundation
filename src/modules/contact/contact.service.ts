import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/contact-message.dto';

@Injectable()
export class ContactService {
  constructor(@InjectRepository(ContactMessage) private readonly messages: Repository<ContactMessage>) {}

  async create(dto: CreateContactMessageDto): Promise<{ id: string; createdAt: Date }> {
    const saved = await this.messages.save(this.messages.create({
      name: dto.name.trim(),
      contactInfo: dto.contactInfo.trim(),
      message: dto.message.trim(),
    }));
    return { id: saved.id, createdAt: saved.createdAt };
  }
}
