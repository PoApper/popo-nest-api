import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {IntroAssociation} from "./intro.association.entity";
import {IntroAssociationController} from "./intro.association.controller";
import {IntroAssociationService} from "./intro.association.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([IntroAssociation]),
  ],
  providers: [IntroAssociationService],
  controllers: [IntroAssociationController]
})
export class IntroAssociationModule {}
