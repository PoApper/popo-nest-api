import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { IntroStudentAssociation } from './intro.student_association.entity';
import { IntroStudentAssociationService } from './intro.student_association.service';
import { FileModule } from '../../../file/file.module';
import { IntroStudentAssociationController } from './intro.student_association.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntroStudentAssociation]),
    NestjsFormDataModule,
    FileModule,
  ],
  providers: [IntroStudentAssociationService],
  controllers: [IntroStudentAssociationController],
})
export class IntroStudentAssociationModule {}
