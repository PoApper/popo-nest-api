import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoReportUploadReservation1790494052636 implements MigrationInterface {
    name = 'PopoReportUploadReservation1790494052636'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`report_file_deletion\` ADD \`cleanupAfter\` bigint NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`report_file_deletion\` DROP COLUMN \`cleanupAfter\``);
    }

}
