import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Committee } from './entities/committee.entity';
import { Designation } from './entities/designation.entity';
import { Member } from './entities/member.entity';
import { CommitteeMembership } from './entities/committee-membership.entity';
import { CommitteesService } from './committees.service';
import { CommitteesController } from './committees.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Committee,
      Designation,
      Member,
      CommitteeMembership,
    ]),
  ],
  controllers: [CommitteesController],
  providers: [CommitteesService],
  exports: [CommitteesService],
})
export class CommitteesModule {}
