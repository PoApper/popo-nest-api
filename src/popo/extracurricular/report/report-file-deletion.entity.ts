import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Kept independently of reports so failed storage deletions survive cascades. */
@Entity()
export class ReportFileDeletion {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  fileKey: string;

  /** Upload reservations become collectible only after this deadline. */
  @Column({ type: 'bigint', default: 0 })
  cleanupAfter: number;

  @Column({ type: 'bigint', default: 0 })
  lastAttemptAt: number;
}
