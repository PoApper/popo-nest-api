import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopoAddExtracurricular09261790380800001 implements MigrationInterface {
  name = 'PopoAddExtracurricular09261790380800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`activity\` (
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`uuid\` varchar(36) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`period\` varchar(255) NOT NULL,
      \`target\` varchar(255) NOT NULL,
      \`applicationMethod\` text NOT NULL,
      \`description\` text NOT NULL,
      \`category\` varchar(255) NOT NULL,
      \`iconName\` varchar(255) NOT NULL DEFAULT 'BookOpen',
      PRIMARY KEY (\`uuid\`)
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`activity_report\` (
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`uuid\` varchar(36) NOT NULL,
      \`activityId\` varchar(36) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`period\` varchar(255) NOT NULL,
      \`grade\` varchar(255) NOT NULL,
      \`major\` varchar(255) NOT NULL,
      \`author\` varchar(255) NOT NULL,
      \`memo\` text NULL,
      \`fileName\` varchar(255) NOT NULL,
      \`fileType\` varchar(255) NOT NULL DEFAULT 'pdf',
      \`fileKey\` varchar(255) NULL,
      \`fileUrl\` varchar(255) NULL,
      PRIMARY KEY (\`uuid\`),
      CONSTRAINT \`FK_activity_report_activity\` FOREIGN KEY (\`activityId\`) REFERENCES \`activity\` (\`uuid\`) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `activity_report`');
    await queryRunner.query('DROP TABLE `activity`');
  }
}
