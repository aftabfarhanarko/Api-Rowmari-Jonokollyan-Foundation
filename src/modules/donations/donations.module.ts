import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donation } from './entities/donation.entity';
import { Receipt } from './entities/receipt.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Donation, Receipt, Campaign])],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService, TypeOrmModule],
})
export class DonationsModule {}
