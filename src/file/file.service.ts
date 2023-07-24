import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { MemoryStoredFile } from 'nestjs-form-data';
import * as moment from 'moment';

@Injectable()
export class FileService {
  private readonly s3 = new S3Client({
    region: process.env.S3_REGION,
  });
  private readonly bucket: string = process.env.S3_BUCKET_NAME;
  private readonly PopoCdnUrl: string = process.env.S3_CF_DIST_URL;

  constructor() {}

  async uploadText(key: string, text: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: text,
      }),
    );
    return `${this.PopoCdnUrl}/${key}`;
  }

  async uploadFile(key: string, file: MemoryStoredFile) {
    const save_key = `${key}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: save_key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return `${this.PopoCdnUrl}/${save_key}`;
  }

  deleteFile(key: string) {
    return this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
