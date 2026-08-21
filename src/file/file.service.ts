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
import * as fs from 'fs';
import * as path from 'path';

// S3 가 꺼진 로컬 환경에서 업로드 파일을 담아두는 디렉터리.
// 예전에는 업로드가 조용히 버려져서 로컬에서 첨부 파일을 다시 읽을 수 없었다.
const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string | null;
  private readonly PopoCdnUrl: string | null;
  private readonly isS3Enabled: boolean;

  constructor() {
    const isLocal = !process.env.NODE_ENV || process.env.NODE_ENV === 'local';

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

  /** 로컬 폴백 저장 경로. 키에 상위 경로 탈출이 섞이지 않도록 정규화한다. */
  private localPathOf(key: string) {
    const resolved = path.resolve(LOCAL_UPLOAD_DIR, key);
    if (!resolved.startsWith(LOCAL_UPLOAD_DIR)) {
      throw new Error(`Invalid file key: ${key}`);
    }
    return resolved;
  }

  async getFile(key: string) {
    if (!this.checkS3Enabled('getFile')) {
      const localPath = this.localPathOf(key);
      return fs.existsSync(localPath)
        ? fs.promises.readFile(localPath)
        : Buffer.from('');
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
      const localPath = this.localPathOf(key);
      await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
      await fs.promises.writeFile(localPath, file.buffer);
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
      return fs.promises.rm(this.localPathOf(key), { force: true });
    }

    return this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
