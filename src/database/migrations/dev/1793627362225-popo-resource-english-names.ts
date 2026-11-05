import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PopoResourceEnglishNames1793627362225 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['place', 'equip']) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'name_en',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['equip', 'place']) {
      await queryRunner.dropColumn(table, 'name_en');
    }
  }
}
