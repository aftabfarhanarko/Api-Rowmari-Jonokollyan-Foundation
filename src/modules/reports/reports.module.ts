import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Donation } from '../donations/entities/donation.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { HelpApplication } from '../applications/entities/help-application.entity';
import { DonorProfile } from '../donors/entities/donor-profile.entity';
import { BloodRequest } from '../blood-requests/entities/blood-request.entity';
import { VolunteerProfile } from '../volunteers/entities/volunteer-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Donation,
      Expense,
      HelpApplication,
      DonorProfile,
      BloodRequest,
      VolunteerProfile,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
