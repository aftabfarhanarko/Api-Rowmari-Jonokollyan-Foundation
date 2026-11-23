import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService, TypeOrmModule],
})
export class AccessControlModule {}
