import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntroClub } from './intro.club.entity';
import { IntroClubService } from './intro.club.service';
import { IntroClubController } from './intro.club.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IntroClub]), CacheModule.register()],
  providers: [IntroClubService],
  controllers: [IntroClubController],
})
export class IntroClubModule {}
