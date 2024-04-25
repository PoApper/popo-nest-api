import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  SelectObjectContentCommand,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { MemoryStoredFile } from 'nestjs-form-data';
import { Readable } from 'stream';

@Injectable()
export class FileService {
  private readonly s3 = new S3Client({
    region: process.env.S3_REGION,
  });
  private readonly bucket: string = process.env.S3_BUCKET_NAME;
  private readonly PopoCdnUrl: string = process.env.S3_CF_DIST_URL;

  constructor() {}

  async queryOnS3(key: string, query: string) {
    const res = await this.s3.send(
      new SelectObjectContentCommand({
        Bucket: this.bucket,
        Key: key,
        ExpressionType: 'SQL',
        Expression: query,
        InputSerialization: {
          CSV: {
            FileHeaderInfo: 'USE',
          },
        },
        OutputSerialization: {
          JSON: {
            RecordDelimiter: ',',
          },
        },
      }),
    );

    if (!res.Payload) {
      throw new Error('No payload received from S3 SelectObjectContent');
    }

    const convertDataToJson = async (generator) => {
      const chunks = [];
      for await (const value of generator) {
        if (value.Records) {
          chunks.push(value.Records.Payload);
        }
      }
      let payload = Buffer.concat(chunks).toString('utf8');
      payload = payload.replace(/,$/, '');
      return JSON.parse(`[${payload}]`);
    };

    return convertDataToJson(res.Payload);
  }

  async getText(key: string) {
    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return res.Body.transformToString();
  }

  async getFile(key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const response = await this.s3.send(command);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks = [];
      const stream = response.Body as Readable;
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.once('end', () => resolve(Buffer.concat(chunks)));
      stream.once('error', reject);
    });
  }

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
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return `${this.PopoCdnUrl}/${key}`;
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
