import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloodRequest } from './entities/blood-request.entity';
import { DonorMatch } from './entities/donor-match.entity';
import { BloodDonationOutcome } from './entities/blood-donation-outcome.entity';
import { DonorProfile } from '../donors/entities/donor-profile.entity';
import { BloodRequestsService } from './blood-requests.service';
import { BloodRequestsController } from './blood-requests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BloodRequest,
      DonorMatch,
      BloodDonationOutcome,
      DonorProfile,
    ]),
  ],
  controllers: [],
  providers: [BloodRequestsService],
  exports: [BloodRequestsService, TypeOrmModule],
})
export class BloodRequestsModule {}
