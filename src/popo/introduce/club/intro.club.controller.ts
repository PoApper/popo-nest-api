import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put, Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {diskStorage} from 'multer';
import {IntroClubService} from "./intro.club.service";
import {JwtAuthGuard} from "../../../auth/guards/jwt-auth.guard";
import {RolesGuard} from "../../../auth/authroization/roles.guard";
import {Roles} from "../../../auth/authroization/roles.decorator";
import {UserType} from "../../user/user.meta";
import {FileInterceptor} from "@nestjs/platform-express";
import {editFileName, imageFileFilter} from "../../../utils/fileUpload";
import {CreateIntroClubDto} from "./intro.club.dto";
import {ClubType} from "./intro.club.meta";

@Controller('introduce/club')
export class IntroClubController {
  constructor(
    private readonly introClubService: IntroClubService,
  ) {
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: "./uploads/intro/Club/logo",
        filename: editFileName
      }), fileFilter: imageFileFilter
    })
  )
  post(@Body() createIntroClubDto: CreateIntroClubDto, @UploadedFile() file) {
    const fileName = (file) ? file.filename : null;
    return this.introClubService.save(createIntroClubDto, fileName);
  }

  @Get()
  get() {
    return this.introClubService.find({order: {updateAt: "DESC"}});
  }

  @Get('clubType/:clubType')
  getByClubType(@Param('clubType') clubType: ClubType) {
    return this.introClubService.find({where: {clubType: clubType}, order: {updateAt: "DESC"}});
  }

  @Get('name/:name')
  getOneByName(@Param('name') name: string) {
    return this.introClubService.findOne({name: name});
  }

  @Get('/image/:imageName')
  getIntroImage(@Param('imageName') imageName: string, @Res() res) {
    res.sendFile(imageName, {root: './uploads/intro/Club/logo'});
  }

  @Put(':uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: "./uploads/intro/Club/logo",
        filename: editFileName
      }), fileFilter: imageFileFilter
    })
  )
  put(@Param('uuid') uuid: string, @Body() updateIntroClubDto: CreateIntroClubDto, @UploadedFile() file) {
    const fileName = (file) ? file.filename : null;
    return this.introClubService.update(uuid, updateIntroClubDto, fileName);
  }

  @Delete(':uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association)
  delete(@Param('uuid') uuid: string) {
    return this.introClubService.remove(uuid);
  }
}