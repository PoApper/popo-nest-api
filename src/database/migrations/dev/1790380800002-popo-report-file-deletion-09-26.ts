import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopoReportFileDeletion09261790380800002 implements MigrationInterface {
  name = 'PopoReportFileDeletion09261790380800002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `report_file_deletion` (`fileKey` varchar(255) NOT NULL, `lastAttemptAt` bigint NOT NULL DEFAULT 0, PRIMARY KEY (`fileKey`)) ENGINE=InnoDB');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `report_file_deletion`');
  }
}
