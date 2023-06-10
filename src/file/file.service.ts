import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  private readonly s3 = new S3Client({
    region: process.env.S3_REGION,
  });
  private readonly bucket: string = process.env.S3_BUCKET_NAME;
  private readonly cfDistUrl: string = process.env.S3_CF_DIST_URL;

  constructor() {}

  async uploadText(key: string, text: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: text,
      }),
    );
    return `${this.cfDistUrl}/${key}`;
  }

  async uploadFile(key: string, file) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return `${this.cfDistUrl}/${key}`;
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
