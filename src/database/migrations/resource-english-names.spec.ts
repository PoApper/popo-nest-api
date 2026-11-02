import { DataSource, MigrationInterface, QueryRunner, Table } from 'typeorm';
import { PopoResourceEnglishNames1793627362225 } from './dev/1793627362225-popo-resource-english-names';
import { PopoResourceEnglishNames1793627362226 } from './prod/1793627362226-popo-resource-english-names';

describe.each<[string, MigrationInterface]>([
  ['development', new PopoResourceEnglishNames1793627362225()],
  ['production', new PopoResourceEnglishNames1793627362226()],
])('%s English name migration', (_, migration) => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeEach(async () => {
    dataSource = new DataSource({ type: 'sqlite', database: ':memory:' });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    for (const table of ['place', 'equip']) {
      await runner.createTable(
        new Table({
          name: table,
          columns: [
            { name: 'uuid', type: 'varchar', isPrimary: true },
            { name: 'name', type: 'varchar' },
          ],
        }),
      );
      await runner.manager.insert(table, {
        uuid: 'existing',
        name: '기존 이름',
      });
    }
  });

  afterEach(async () => {
    await runner?.release();
    await dataSource?.destroy();
  });

  it('adds nullable names and can roll back without losing existing resources', async () => {
    await migration.up(runner);
    for (const table of ['place', 'equip']) {
      const row = await runner.query(`SELECT * FROM "${table}"`);
      expect(row).toEqual([
        { uuid: 'existing', name: '기존 이름', name_en: null },
      ]);
      await runner.query(`UPDATE "${table}" SET name_en = 'English name'`);
    }
    await migration.down(runner);
    for (const table of ['place', 'equip']) {
      expect(await runner.query(`SELECT * FROM "${table}"`)).toEqual([
        { uuid: 'existing', name: '기존 이름' },
      ]);
    }
  });
});
