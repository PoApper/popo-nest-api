import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { IntroClub } from './intro.club.entity';
import { IntroClubService } from './intro.club.service';
import { IntroClubController } from './intro.club.controller';
import { FileModule } from '../../../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntroClub]),
    CacheModule.register(),
    NestjsFormDataModule,
    FileModule,
  ],
  providers: [IntroClubService],
  controllers: [IntroClubController],
})
export class IntroClubModule {}
