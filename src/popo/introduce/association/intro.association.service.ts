import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import * as fs from 'fs';
import {IntroAssociation} from "./intro.association.entity";
import {CreateIntroAssociationDto} from "./intro.association.dto";

const Message = {
  NOT_EXISTING_INTRO: "There's no such introduction.",
}

@Injectable()
export class IntroAssociationService {
  constructor(
    @InjectRepository(IntroAssociation)
    private readonly introAssociation_repository: Repository<IntroAssociation>
  ) {
  }

  async save(dto: CreateIntroAssociationDto, logoName: string) {
    const newDto = Object.assign({}, dto, {logoName: logoName});

    return this.introAssociation_repository.save(newDto);
  }

  find(findOptions?: object) {
    return this.introAssociation_repository.find(findOptions);
  }

  findOne(findOptions: object, maybeOptions?: object) {
    return this.introAssociation_repository.findOne(findOptions, maybeOptions);
  }

  async update(uuid: string, dto: CreateIntroAssociationDto, logoName: string) {
    const existIntro = await this.findOne({uuid: uuid});

    if(!existIntro) {
      throw new BadRequestException(Message.NOT_EXISTING_INTRO)
    }

    // delete previous image
    if (logoName && existIntro.logoName) {
      fs.unlinkSync('./uploads/intro/association/' + existIntro.logoName);
    }

    const newDto = Object.assign({}, dto, {logoName: (logoName) ? logoName : existIntro.logoName});

    return this.introAssociation_repository.update({uuid: uuid}, newDto);
  }

  remove(uuid: string) {
    return this.introAssociation_repository.delete({uuid: uuid});
  }

}
