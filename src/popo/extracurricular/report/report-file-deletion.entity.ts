import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Kept independently of reports so failed storage deletions survive cascades. */
@Entity()
export class ReportFileDeletion {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  fileKey: string;

  @Column({ type: 'bigint', default: 0 })
  lastAttemptAt: number;
}
