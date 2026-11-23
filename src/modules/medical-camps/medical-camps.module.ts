import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalCamp } from './entities/medical-camp.entity';
import { CampStaff } from './entities/camp-staff.entity';
import { CampAttendanceSummary } from './entities/camp-attendance-summary.entity';
import { MedicalCampsService } from './medical-camps.service';
import { MedicalCampsController } from './medical-camps.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalCamp,
      CampStaff,
      CampAttendanceSummary,
    ]),
  ],
  controllers: [MedicalCampsController],
  providers: [MedicalCampsService],
  exports: [MedicalCampsService, TypeOrmModule],
})
export class MedicalCampsModule {}
