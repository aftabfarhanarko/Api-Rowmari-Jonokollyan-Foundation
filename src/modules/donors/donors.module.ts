import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorProfile } from './entities/donor-profile.entity';
import { DonorsService } from './donors.service';
import { DonorsController } from './donors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DonorProfile])],
  controllers: [],
  providers: [DonorsService],
  exports: [DonorsService, TypeOrmModule],
})
export class DonorsModule {}
