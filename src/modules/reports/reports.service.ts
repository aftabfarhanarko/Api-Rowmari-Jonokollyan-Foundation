import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from '../donations/entities/donation.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { HelpApplication } from '../applications/entities/help-application.entity';
import { DonorProfile } from '../donors/entities/donor-profile.entity';
import { BloodRequest } from '../blood-requests/entities/blood-request.entity';
import { VolunteerProfile } from '../volunteers/entities/volunteer-profile.entity';
import { DonationStatus, ExpenseStatus } from '../../common/constants';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(HelpApplication)
    private readonly appRepo: Repository<HelpApplication>,
    @InjectRepository(DonorProfile)
    private readonly donorRepo: Repository<DonorProfile>,
    @InjectRepository(BloodRequest)
    private readonly bloodRequestRepo: Repository<BloodRequest>,
    @InjectRepository(VolunteerProfile)
    private readonly volunteerRepo: Repository<VolunteerProfile>,
  ) {}

  async getExecutiveDashboard() {
    const [totalDonationsResult] = await this.donationRepo
      .createQueryBuilder('d')
      .select('SUM(d.amount)', 'total')
      .where('d.status = :status', { status: DonationStatus.COMPLETED })
      .getRawMany();

    const [totalExpensesResult] = await this.expenseRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .where('e.status = :status', { status: ExpenseStatus.APPROVED })
      .getRawMany();

    const totalDonations = parseFloat(totalDonationsResult?.total || '0');
    const totalExpenses = parseFloat(totalExpensesResult?.total || '0');
    const netBalance = totalDonations - totalExpenses;

    const totalApplications = await this.appRepo.count();
    const approvedApplications = await this.appRepo.count({ where: { status: 'APPROVED' as any } });

    const totalBloodDonors = await this.donorRepo.count();
    const availableBloodDonors = await this.donorRepo.count({ where: { isAvailable: true } });

    const totalBloodRequests = await this.bloodRequestRepo.count();
    const fulfilledBloodRequests = await this.bloodRequestRepo.count({ where: { status: 'FULFILLED' as any } });

    const totalVolunteers = await this.volunteerRepo.count({ where: { isApproved: true } });

    return {
      financials: {
        totalDonationsReceived: totalDonations,
        totalExpensesDisbursed: totalExpenses,
        netOperationalBalance: netBalance,
        currency: 'BDT',
      },
      assistance: {
        totalApplicationsSubmitted: totalApplications,
        applicationsApproved: approvedApplications,
      },
      bloodNetwork: {
        registeredDonors: totalBloodDonors,
        availableDonors: availableBloodDonors,
        totalBloodRequests: totalBloodRequests,
        fulfilledBloodRequests: fulfilledBloodRequests,
      },
      volunteers: {
        activeApprovedVolunteers: totalVolunteers,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
