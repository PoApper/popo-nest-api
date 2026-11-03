import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const columns = [
  { table: 'place', varchar: ['location_en'], text: ['description_en'] },
  { table: 'equip', varchar: [], text: ['description_en'] },
  {
    table: 'intro_association',
    varchar: ['name_en', 'location_en', 'representative_en', 'contact_en'],
    text: ['content_en'],
  },
  {
    table: 'intro_club',
    varchar: [
      'name_en',
      'short_desc_en',
      'location_en',
      'representative_en',
      'contact_en',
    ],
    text: ['content_en'],
  },
  {
    table: 'intro_student_association',
    varchar: [
      'name_en',
      'short_desc_en',
      'location_en',
      'representative_en',
      'office_en',
      'contact_en',
    ],
    text: ['content_en'],
  },
];

export class PopoBilingualContent1793715004898 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, varchar, text } of columns) {
      await queryRunner.addColumns(table, [
        ...varchar.map(
          (name) =>
            new TableColumn({
              name,
              type: 'varchar',
              length: '255',
              isNullable: true,
            }),
        ),
        ...text.map(
          (name) => new TableColumn({ name, type: 'text', isNullable: true }),
        ),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, varchar, text } of [...columns].reverse()) {
      await queryRunner.dropColumns(table, [...varchar, ...text].reverse());
    }
  }
}
