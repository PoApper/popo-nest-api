import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { IntroAssociation } from './intro.association.entity';
import { IntroAssociationController } from './intro.association.controller';
import { IntroAssociationService } from './intro.association.service';
import { FileModule } from '../../../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntroAssociation]),
    NestjsFormDataModule,
    FileModule,
  ],
  providers: [IntroAssociationService],
  controllers: [IntroAssociationController],
})
export class IntroAssociationModule {}
