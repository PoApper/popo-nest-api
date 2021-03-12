import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import * as fs from 'fs';
import {IntroClub} from "./intro.club.entity";
import {CreateIntroClubDto} from "./intro.club.dto";

const Message = {
  NOT_EXISTING_INTRO: "There's no such introduction.",
}


@Injectable()
export class IntroClubService {
  constructor(
    @InjectRepository(IntroClub)
    private readonly introClub_repository: Repository<IntroClub>
  ) {
  }

  async save(dto: CreateIntroClubDto, logoName: string) {
    const newDto = Object.assign({}, dto, {logoName: logoName});

    return this.introClub_repository.save(newDto);
  }

  find(findOptions?: object) {
    return this.introClub_repository.find(findOptions);
  }

  findOne(findOptions: object, maybeOptions?: object) {
    return this.introClub_repository.findOne(findOptions, maybeOptions);
  }

  async update(uuid: string, dto: CreateIntroClubDto, logoName: string) {
    const existIntro = await this.findOne({uuid: uuid});

    if (!existIntro) {
      throw new BadRequestException(Message.NOT_EXISTING_INTRO)
    }

    // delete previous image
    if (logoName && existIntro.logoName) {
      fs.unlinkSync('./uploads/intro/Club/logo/' + existIntro.logoName);
    }

    const newDto = Object.assign({}, dto, {logoName: (logoName) ? logoName : existIntro.logoName});

    return this.introClub_repository.update({uuid: uuid, name: existIntro.name}, newDto);
  }

  remove(uuid: string) {
    return this.introClub_repository.delete({uuid: uuid});
  }

}
