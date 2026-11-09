import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopoBilingualContent11041793803471793 implements MigrationInterface {
  name = 'PopoBilingualContent11041793803471793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`place\` ADD \`name_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`place\` ADD \`description_en\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`place\` ADD \`location_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` ADD \`name_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` ADD \`content_en\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` ADD \`short_desc_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` ADD \`location_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` ADD \`representative_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` ADD \`office_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` ADD \`contact_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` ADD \`name_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` ADD \`short_desc_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` ADD \`content_en\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` ADD \`location_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` ADD \`representative_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` ADD \`contact_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` ADD \`name_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` ADD \`content_en\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` ADD \`location_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` ADD \`representative_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` ADD \`contact_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`equip\` ADD \`name_en\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`equip\` ADD \`description_en\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`equip\` DROP COLUMN \`description_en\``,
    );
    await queryRunner.query(`ALTER TABLE \`equip\` DROP COLUMN \`name_en\``);
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` DROP COLUMN \`contact_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` DROP COLUMN \`representative_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` DROP COLUMN \`location_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` DROP COLUMN \`content_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_association\` DROP COLUMN \`name_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` DROP COLUMN \`contact_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` DROP COLUMN \`representative_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` DROP COLUMN \`location_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` DROP COLUMN \`content_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` DROP COLUMN \`short_desc_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_club\` DROP COLUMN \`name_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` DROP COLUMN \`contact_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` DROP COLUMN \`office_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` DROP COLUMN \`representative_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` DROP COLUMN \`location_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` DROP COLUMN \`short_desc_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` DROP COLUMN \`content_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intro_student_association\` DROP COLUMN \`name_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`place\` DROP COLUMN \`location_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`place\` DROP COLUMN \`description_en\``,
    );
    await queryRunner.query(`ALTER TABLE \`place\` DROP COLUMN \`name_en\``);
  }
}
