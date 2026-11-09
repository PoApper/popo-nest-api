import { EntityManager } from 'typeorm';
import { ReportFileDeletion } from './report-file-deletion.entity';

export async function lockReportFileDeletion(
  manager: EntityManager,
  fileKey: string,
) {
  // SQLite has no SELECT FOR UPDATE; taking its write lock also serializes
  // these transactions in local/tests. MySQL uses a current locking read.
  if (manager.connection.options.type === 'sqlite') {
    await manager.update(ReportFileDeletion, { fileKey }, { fileKey });
    return manager.findOneBy(ReportFileDeletion, { fileKey });
  }
  return manager.findOne(ReportFileDeletion, {
    where: { fileKey },
    lock: { mode: 'pessimistic_write' },
  });
}
