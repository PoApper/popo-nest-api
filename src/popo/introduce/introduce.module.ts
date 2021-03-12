import { Module } from '@nestjs/common';
import {IntroAssociationModule} from "./association/intro.association.module";
import {IntroClubModule} from "./club/intro.club.module";

@Module({
  imports: [IntroAssociationModule, IntroClubModule]
})
export class IntroduceModule {}
