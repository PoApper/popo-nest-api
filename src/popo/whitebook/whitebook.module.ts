import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Whitebook } from './whitebook.entity';
import { WhitebookService } from './whitebook.service';
import { WhitebookController } from './whitebook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Whitebook]), CacheModule.register()],
  controllers: [WhitebookController],
  providers: [WhitebookService],
  exports: [WhitebookService],
})
export class WhitebookModule {}
