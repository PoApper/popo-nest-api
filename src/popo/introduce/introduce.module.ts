import { Module } from '@nestjs/common';
import { IntroAssociationModule } from './association/intro.association.module';
import { IntroClubModule } from './club/intro.club.module';
import { IntroStudentAssociationModule } from './student_association/intro.student_association.module';

@Module({
  imports: [IntroAssociationModule, IntroClubModule, IntroStudentAssociationModule],
})
export class IntroduceModule {}
