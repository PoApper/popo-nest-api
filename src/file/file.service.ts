import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  SelectObjectContentCommand,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { MemoryStoredFile } from 'nestjs-form-data';
import { Readable } from 'stream';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string | null;
  private readonly PopoCdnUrl: string | null;
  private readonly isS3Enabled: boolean;

  constructor() {
    const isLocal = process.env.NODE_ENV === 'local';

    // 로컬 환경: AWS 자격 증명 필요
    // dev/prod 환경: IAM 역할 사용 (자격 증명 불필요)
    const hasCredentials = isLocal
      ? !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY
      : true; // dev/prod에서는 자격 증명 체크 생략

    // S3 설정 확인
    this.isS3Enabled =
      hasCredentials && !!process.env.S3_REGION && !!process.env.S3_BUCKET_NAME;

    if (this.isS3Enabled) {
      this.s3 = new S3Client({
        region: process.env.S3_REGION,
      });
      this.bucket = process.env.S3_BUCKET_NAME;
      this.PopoCdnUrl = process.env.S3_CF_DIST_URL || '';
    } else {
      this.s3 = null;
      this.bucket = null;
      this.PopoCdnUrl = null;
      this.logger.warn(
        'AWS S3 configuration not found. S3 features will be disabled.',
      );
    }
  }

  /**
   * S3가 활성화되어 있는지 확인하는 공통 메서드
   * @param operationName 로그에 표시할 작업 이름
   * @returns S3가 활성화되어 있으면 true, 아니면 false
   */
  private checkS3Enabled(operationName: string): boolean {
    if (!this.isS3Enabled || !this.s3 || !this.bucket) {
      this.logger.warn(
        `S3 is not enabled. ${operationName} operation skipped.`,
      );
      return false;
    }
    return true;
  }

  async queryOnS3(key: string, query: string) {
    if (!this.checkS3Enabled('queryOnS3')) {
      return [];
    }

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
    if (!this.checkS3Enabled('getText')) {
      return '';
    }

    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return res.Body.transformToString();
  }

  async getFile(key: string) {
    if (!this.checkS3Enabled('getFile')) {
      return Buffer.from('');
    }

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
    if (!this.checkS3Enabled('uploadText')) {
      return `local://${key}`;
    }

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
    if (!this.checkS3Enabled('uploadFile')) {
      return `local://${key}`;
    }

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
    if (!this.checkS3Enabled('deleteFile')) {
      return Promise.resolve();
    }

    return this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
