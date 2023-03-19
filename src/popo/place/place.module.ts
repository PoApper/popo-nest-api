import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceController } from './place.controller';
import { PlaceService } from './place.service';
import { Place } from './place.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Place]), CacheModule.register()],
  controllers: [PlaceController],
  providers: [PlaceService],
  exports: [PlaceService],
})
export class PlaceModule {}
