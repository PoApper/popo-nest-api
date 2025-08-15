import { DataSource } from 'typeorm';

// Local은 synchronize: true가 되어있어서 따로 마이그레이션 할 필요는 없는데 필요하다면 사용
export const LocalDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'local-username', // local 환경의 username
  password: 'local-password', // local 환경의 password
  database: 'local-database', // local 환경의 database
  synchronize: false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/local/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});

// NOTE: local 마이그레이션 생성 명령어
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d src/database/data-source.local.ts src/database/migrations/local/example-name-month-day
// NOTE: local 마이그레이션 실행 명령어
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.local.ts
