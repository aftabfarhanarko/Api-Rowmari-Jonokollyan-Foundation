import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../access-control/entities/role.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), ImagesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
