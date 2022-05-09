import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { IntroAssociationService } from './intro.association.service';
import { CreateIntroAssociationDto } from './intro.association.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { UserType } from '../../user/user.meta';
import { FileInterceptor } from '@nestjs/platform-express';
import { editFileName, imageFileFilter } from '../../../utils/fileUpload';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Introduce Association')
@Controller('introduce/association')
export class IntroAssociationController {
  constructor(
    private readonly introAssociationService: IntroAssociationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/intro/association',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  create(
    @Body() createIntroAssociationDto: CreateIntroAssociationDto,
    @UploadedFile() file,
  ) {
    const fileName = file ? file.filename : null;
    return this.introAssociationService.save(
      createIntroAssociationDto,
      fileName,
    );
  }

  @Get()
  get() {
    return this.introAssociationService.find({ order: { updateAt: 'DESC' } });
  }

  @Get('name/:name')
  async getOneByName(@Param('name') name: string) {
    const introAssociation = await this.introAssociationService.findOne({
      name: name,
    });

    if (introAssociation) {
      await this.introAssociationService.updateViewCount(
        introAssociation.uuid,
        introAssociation.views + 1,
      );
      return introAssociation;
    } else {
      throw new BadRequestException('Not Exist');
    }
  }

  @Get('/image/:imageName')
  getIntroImage(@Param('imageName') imageName: string, @Res() res) {
    res.sendFile(imageName, { root: './uploads/intro/association' });
  }

  @Put(':uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/intro/association',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  put(
    @Param('uuid') uuid: string,
    @Body() updateIntroAssociationDto: CreateIntroAssociationDto,
    @UploadedFile() file,
  ) {
    const fileName = file ? file.filename : null;
    return this.introAssociationService.update(
      uuid,
      updateIntroAssociationDto,
      fileName,
    );
  }

  @Delete(':uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association)
  delete(@Param('uuid') uuid: string) {
    return this.introAssociationService.remove(uuid);
  }
}
