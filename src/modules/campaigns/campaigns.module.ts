import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignUpdate } from './entities/campaign-update.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, CampaignUpdate])],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService, TypeOrmModule],
})
export class CampaignsModule {}
