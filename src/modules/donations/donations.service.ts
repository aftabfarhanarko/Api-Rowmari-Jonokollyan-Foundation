import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Donation } from './entities/donation.entity';
import { Receipt } from './entities/receipt.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { RecordDonationDto } from './dto/donation.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { DonationStatus } from '../../common/constants';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    @InjectRepository(Receipt)
    private readonly receiptRepo: Repository<Receipt>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    private readonly dataSource: DataSource,
  ) {}

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.receiptRepo.count();
    const seq = (count + 1).toString().padStart(6, '0');
    return `RKF-REC-${year}-${seq}`;
  }

  async record(dto: RecordDonationDto): Promise<Donation> {
    if (dto.campaignId) {
      const campaign = await this.campaignRepo.findOne({ where: { id: dto.campaignId } });
      if (!campaign) {
        throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found.`);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const donation = queryRunner.manager.create(Donation, {
        donorName: dto.isAnonymous ? null : dto.donorName || null,
        donorPhone: dto.donorPhone || null,
        donorEmail: dto.donorEmail || null,
        isAnonymous: dto.isAnonymous || false,
        amount: dto.amount,
        currency: 'BDT',
        campaignId: dto.campaignId || null,
        paymentMethod: dto.paymentMethod || 'CASH',
        transactionReference: dto.transactionReference || null,
        status: DonationStatus.COMPLETED,
        notes: dto.notes || null,
      });

      const savedDonation = await queryRunner.manager.save(donation);

      // If linked to a campaign, increment raisedAmount
      if (dto.campaignId) {
        const campaign = await queryRunner.manager.findOne(Campaign, {
          where: { id: dto.campaignId },
        });
        if (campaign) {
          campaign.raisedAmount = Number(campaign.raisedAmount) + Number(dto.amount);
          await queryRunner.manager.save(campaign);
        }
      }

      // Generate receipt
      const receiptNumber = await this.generateReceiptNumber();
      const receipt = queryRunner.manager.create(Receipt, {
        donationId: savedDonation.id,
        receiptNumber,
        issuedAt: new Date(),
        downloadUrl: `https://storage.romonijon.org/receipts/${receiptNumber}.pdf`,
      });
      await queryRunner.manager.save(receipt);

      await queryRunner.commitTransaction();
      return this.findById(savedDonation.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: PaginationQueryDto, campaignId?: string): Promise<PaginatedResult<Donation>> {
    const qb = this.donationRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.receipt', 'receipt')
      .leftJoinAndSelect('d.campaign', 'campaign')
      .orderBy('d.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (campaignId) {
      qb.andWhere('d.campaignId = :campaignId', { campaignId });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<Donation> {
    const donation = await this.donationRepo.findOne({
      where: { id },
      relations: ['receipt', 'campaign'],
    });
    if (!donation) {
      throw new NotFoundException(`Donation with ID ${id} not found.`);
    }
    return donation;
  }
}
