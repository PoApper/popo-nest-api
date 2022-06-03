import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { PopoSettingDto } from './setting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { UserType } from '../user/user.meta';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { Readable } from 'stream';

@ApiTags('POPO 세팅')
@Controller('setting')
export class SettingController {
  private readonly s3 = new S3Client({
    region: process.env.S3_REGION,
  });
  private readonly bucket: string = process.env.S3_BUCKET_NAME;

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updatePopoSetting(@Body() dto: PopoSettingDto) {
    return this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: 'popo-setting.json',
        Body: JSON.stringify(dto),
      }),
    );
  }

  @Get()
  async getPopoSetting() {
    function streamToString(stream: Readable): Promise<string> {
      return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () =>
          resolve(Buffer.concat(chunks).toString('utf-8')),
        );
      });
    }

    const { Body } = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: 'popo-setting.json',
      }),
    );

    const conetent = await streamToString(Body as Readable);
    return conetent;
  }
}
