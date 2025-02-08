import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Whitebook } from './whitebook.entity';
import { WhitebookService } from './whitebook.service';
import { WhitebookController } from './whitebook.controller';
import { FileModule } from 'src/file/file.module';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    TypeOrmModule.forFeature([Whitebook]),
    FileModule,
    NestjsFormDataModule,
  ],
  controllers: [WhitebookController],
  providers: [WhitebookService],
  exports: [WhitebookService],
})
export class WhitebookModule {}
