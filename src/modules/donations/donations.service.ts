import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Donation } from './entities/donation.entity';
import { Receipt } from './entities/receipt.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { RecordDonationDto, ReviewDonationDto, AdminCreateDonationDto } from './dto/donation.dto';
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
    return `RJF-REC-${year}-${seq}`;
  }

  async record(dto: RecordDonationDto): Promise<Donation> {
    if (dto.transactionReference) {
      const existing = await this.donationRepo.findOne({
        where: { transactionReference: dto.transactionReference.trim() },
      });
      if (existing) {
        throw new BadRequestException('এই ট্রানজেকশন আইডি (TrxID) দিয়ে ইতোমধ্যে অনুদান জমা দেওয়া হয়েছে।');
      }
    }

    if (dto.campaignId) {
      const campaign = await this.campaignRepo.findOne({ where: { id: dto.campaignId } });
      if (!campaign) {
        throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found.`);
      }
    }

    const donation = this.donationRepo.create({
      donorName: dto.isAnonymous ? null : dto.donorName?.trim() || null,
      donorPhone: dto.donorPhone?.trim() || null,
      donorEmail: dto.donorEmail?.trim() || null,
      senderPhone: dto.senderPhone?.trim() || null,
      isAnonymous: dto.isAnonymous || false,
      amount: dto.amount,
      currency: 'BDT',
      campaignId: dto.campaignId || null,
      paymentMethod: dto.paymentMethod || 'BKASH',
      transactionReference: dto.transactionReference?.trim() || null,
      paymentProofUrl: dto.paymentProofUrl || null,
      status: DonationStatus.PENDING,
      notes: dto.notes?.trim() || null,
    });

    return this.donationRepo.save(donation);
  }

  async adminCreate(dto: AdminCreateDonationDto, adminId: string): Promise<Donation> {
    if (dto.transactionReference?.trim()) {
      const existing = await this.donationRepo.findOne({
        where: { transactionReference: dto.transactionReference.trim() },
      });
      if (existing) {
        throw new BadRequestException('এই ট্রানজেকশন আইডি (TrxID) দিয়ে ইতোমধ্যে অনুদান রেকর্ড করা হয়েছে।');
      }
    }

    if (dto.campaignId) {
      const campaign = await this.campaignRepo.findOne({ where: { id: dto.campaignId } });
      if (!campaign) {
        throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found.`);
      }
    }

    const isApproved = (dto.status || 'APPROVED') === 'APPROVED';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const donation = queryRunner.manager.create(Donation, {
        donorName: dto.isAnonymous ? null : dto.donorName?.trim() || null,
        donorPhone: dto.donorPhone?.trim() || null,
        donorEmail: dto.donorEmail?.trim() || null,
        senderPhone: dto.senderPhone?.trim() || null,
        isAnonymous: dto.isAnonymous || false,
        amount: dto.amount,
        currency: 'BDT',
        campaignId: dto.campaignId || null,
        paymentMethod: dto.paymentMethod || 'CASH',
        transactionReference: dto.transactionReference?.trim() || null,
        paymentProofUrl: dto.paymentProofUrl || null,
        status: isApproved ? DonationStatus.APPROVED : DonationStatus.PENDING,
        notes: dto.notes?.trim() || null,
        adminNote: dto.adminNote?.trim() || (isApproved ? 'অ্যাডমিন কর্তৃক সরাসরি যুক্ত' : null),
        verifiedBy: isApproved ? adminId : null,
        verifiedAt: isApproved ? new Date() : null,
      });

      const savedDonation = await queryRunner.manager.save(donation);

      if (isApproved && dto.campaignId) {
        const campaign = await queryRunner.manager.findOne(Campaign, {
          where: { id: dto.campaignId },
        });
        if (campaign) {
          campaign.raisedAmount = Number(campaign.raisedAmount || 0) + Number(dto.amount);
          await queryRunner.manager.save(campaign);
        }
      }

      if (isApproved) {
        const receiptNumber = await this.generateReceiptNumber();
        const receipt = queryRunner.manager.create(Receipt, {
          donationId: savedDonation.id,
          receiptNumber,
          issuedAt: new Date(),
          downloadUrl: `https://storage.romonijon.org/receipts/${receiptNumber}.pdf`,
        });
        await queryRunner.manager.save(receipt);
      }

      await queryRunner.commitTransaction();
      return this.findById(savedDonation.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async review(id: string, dto: ReviewDonationDto, reviewerId: string): Promise<Donation> {
    const donation = await this.donationRepo.findOne({
      where: { id },
      relations: ['campaign', 'receipt'],
    });
    if (!donation) {
      throw new NotFoundException(`Donation with ID ${id} not found.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wasApproved = donation.status === DonationStatus.APPROVED;
      const isNowApproved = dto.status === 'APPROVED';

      donation.status = isNowApproved ? DonationStatus.APPROVED : DonationStatus.REJECTED;
      donation.adminNote = dto.adminNote?.trim() || null;
      donation.verifiedBy = reviewerId;
      donation.verifiedAt = new Date();

      const savedDonation = await queryRunner.manager.save(donation);

      // If becoming approved and has campaign, update campaign raisedAmount
      if (isNowApproved && !wasApproved && donation.campaignId) {
        const campaign = await queryRunner.manager.findOne(Campaign, {
          where: { id: donation.campaignId },
        });
        if (campaign) {
          campaign.raisedAmount = Number(campaign.raisedAmount || 0) + Number(donation.amount);
          await queryRunner.manager.save(campaign);
        }
      }

      // If approved and no receipt yet, generate receipt
      if (isNowApproved && !donation.receipt) {
        const receiptNumber = await this.generateReceiptNumber();
        const receipt = queryRunner.manager.create(Receipt, {
          donationId: savedDonation.id,
          receiptNumber,
          issuedAt: new Date(),
          downloadUrl: `https://storage.romonijon.org/receipts/${receiptNumber}.pdf`,
        });
        await queryRunner.manager.save(receipt);
      }

      await queryRunner.commitTransaction();
      return this.findById(savedDonation.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getPublicStats() {
    const result = await this.donationRepo
      .createQueryBuilder('d')
      .select('SUM(d.amount)', 'totalApprovedAmount')
      .addSelect('COUNT(d.id)', 'totalApprovedDonations')
      .where('d.status = :status', { status: DonationStatus.APPROVED })
      .getRawOne();

    const donorsCountRes = await this.donationRepo
      .createQueryBuilder('d')
      .select('COUNT(DISTINCT d.donorPhone)', 'verifiedDonors')
      .where('d.status = :status', { status: DonationStatus.APPROVED })
      .andWhere('d.donorPhone IS NOT NULL')
      .getRawOne();

    const byMethodRes = await this.donationRepo
      .createQueryBuilder('d')
      .select('d.paymentMethod', 'method')
      .addSelect('COUNT(d.id)', 'count')
      .addSelect('SUM(d.amount)', 'amount')
      .where('d.status = :status', { status: DonationStatus.APPROVED })
      .groupBy('d.paymentMethod')
      .getRawMany();

    return {
      totalApprovedAmount: Number(result?.totalApprovedAmount || 0),
      totalApprovedDonations: Number(result?.totalApprovedDonations || 0),
      verifiedDonors: Number(donorsCountRes?.verifiedDonors || result?.totalApprovedDonations || 0),
      byMethod: byMethodRes.map((m) => ({
        method: m.method,
        count: Number(m.count),
        amount: Number(m.amount),
      })),
    };
  }

  async getPublicApprovedDonations(limit: number = 10) {
    const donations = await this.donationRepo.find({
      where: { status: DonationStatus.APPROVED },
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['id', 'donorName', 'isAnonymous', 'amount', 'currency', 'paymentMethod', 'createdAt'],
    });

    return donations.map((d) => ({
      id: d.id,
      donorName: d.isAnonymous ? 'গোপন দানকারী' : (d.donorName || 'শুভাকাঙ্ক্ষী'),
      amount: Number(d.amount),
      currency: d.currency,
      paymentMethod: d.paymentMethod,
      campaignTitle: d.campaign?.title || 'সাধারণ তহবিল',
      createdAt: d.createdAt,
    }));
  }

  async findAll(query: PaginationQueryDto, status?: string, campaignId?: string): Promise<PaginatedResult<Donation>> {
    const qb = this.donationRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.receipt', 'receipt')
      .leftJoinAndSelect('d.campaign', 'campaign')
      .orderBy('d.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (status) {
      qb.andWhere('d.status = :status', { status });
    }
    if (campaignId) {
      qb.andWhere('d.campaignId = :campaignId', { campaignId });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findByDonor(
    query: PaginationQueryDto,
    phone?: string,
    email?: string,
  ): Promise<PaginatedResult<Donation>> {
    const qb = this.donationRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.receipt', 'receipt')
      .leftJoinAndSelect('d.campaign', 'campaign')
      .orderBy('d.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (phone && email) {
      qb.where('(d.donorPhone = :phone OR d.donorEmail = :email)', { phone, email });
    } else if (phone) {
      qb.where('d.donorPhone = :phone', { phone });
    } else if (email) {
      qb.where('d.donorEmail = :email', { email });
    } else {
      qb.where('1 = 0');
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
