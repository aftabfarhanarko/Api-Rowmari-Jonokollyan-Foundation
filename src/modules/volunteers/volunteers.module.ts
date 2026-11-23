import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerProfile } from './entities/volunteer-profile.entity';
import { VolunteerAssignment } from './entities/volunteer-assignment.entity';
import { VolunteersService } from './volunteers.service';
import { VolunteersController } from './volunteers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VolunteerProfile, VolunteerAssignment])],
  controllers: [VolunteersController],
  providers: [VolunteersService],
  exports: [VolunteersService, TypeOrmModule],
})
export class VolunteersModule {}
