import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpApplication } from './entities/help-application.entity';
import { ApplicationDocument } from './entities/application-document.entity';
import { ApplicationStatusHistory } from './entities/application-status-history.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HelpApplication,
      ApplicationDocument,
      ApplicationStatusHistory,
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService, TypeOrmModule],
})
export class ApplicationsModule {}
