import { DataSource, MigrationInterface, QueryRunner, Table } from 'typeorm';
import { PopoBilingualContent1793715004897 } from './dev/1793715004897-popo-bilingual-content';
import { PopoBilingualContent1793715004898 } from './prod/1793715004898-popo-bilingual-content';

const fixtures = {
  place: {
    uuid: 'place-id',
    name: '기존 장소',
    location: '기존 위치',
    description: '기존 설명',
    name_en: 'Existing place name',
  },
  equip: {
    uuid: 'equip-id',
    name: '기존 장비',
    description: '기존 설명',
    name_en: 'Existing equipment name',
  },
  intro_association: {
    uuid: 'association-id',
    name: '기존 자치단체',
    location: '위치',
    content: '소개',
    representative: '대표자',
    contact: '연락처',
  },
  intro_club: {
    uuid: 'club-id',
    name: '기존 동아리',
    location: '위치',
    content: '소개',
    short_desc: '요약',
    representative: '대표자',
    contact: '연락처',
  },
  intro_student_association: {
    uuid: 'student-id',
    name: '기존 학생단체',
    location: '위치',
    content: '소개',
    short_desc: '요약',
    representative: '대표자',
    contact: '연락처',
    office: '행정팀',
  },
};

describe.each<[string, MigrationInterface]>([
  ['development', new PopoBilingualContent1793715004897()],
  ['production', new PopoBilingualContent1793715004898()],
])('%s bilingual-content migration', (_, migration) => {
  let source: DataSource;
  let runner: QueryRunner;

  beforeEach(async () => {
    source = new DataSource({ type: 'sqlite', database: ':memory:' });
    await source.initialize();
    runner = source.createQueryRunner();
    for (const [table, row] of Object.entries(fixtures)) {
      await runner.createTable(
        new Table({
          name: table,
          columns: Object.keys(row).map((name) => ({
            name,
            type: 'varchar',
            isPrimary: name === 'uuid',
          })),
        }),
      );
      await runner.manager.insert(table, row);
    }
  });
  afterEach(async () => {
    await runner?.release();
    await source?.destroy();
  });

  it('adds all optional translations and rolls back without changing original content or earlier English names', async () => {
    await migration.up(runner);
    let added = 0;
    for (const [table, original] of Object.entries(fixtures)) {
      const [row] = await runner.query(`SELECT * FROM "${table}"`);
      expect(row).toMatchObject(original);
      const translations = Object.keys(row).filter((key) => !(key in original));
      for (const key of translations) {
        expect(row[key]).toBeNull();
        await runner.query(`UPDATE "${table}" SET "${key}" = ?`, [
          'English translation',
        ]);
        added++;
      }
    }
    expect(added).toBe(21);
    await migration.down(runner);
    for (const [table, original] of Object.entries(fixtures)) {
      expect(await runner.query(`SELECT * FROM "${table}"`)).toEqual([
        original,
      ]);
    }
  });
});
