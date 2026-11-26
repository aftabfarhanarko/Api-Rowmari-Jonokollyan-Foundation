import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoumariDirectory } from './entities/roumari-directory.entity';
import { RoumariTouristPlace } from './entities/roumari-tourist-place.entity';
import { RoumariNews } from './entities/roumari-news.entity';
import { RoumariService } from './roumari.service';
import { RoumariController } from './roumari.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoumariDirectory,
      RoumariTouristPlace,
      RoumariNews,
    ]),
  ],
  controllers: [RoumariController],
  providers: [RoumariService],
  exports: [RoumariService],
})
export class RoumariModule {}
