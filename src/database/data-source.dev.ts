import { DataSource } from 'typeorm';

export const DevDataSource = new DataSource({
  type: 'mysql',
  host: 'popo-host', // popo host name
  port: 3306,
  username: 'dev-username', // dev 환경의 username
  password: 'dev-password', // dev 환경의 password
  database: 'dev-database', // dev 환경의 database
  synchronize: false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/dev/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});

// NOTE: dev 마이그레이션 생성 명령어
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d src/database/data-source.dev.ts src/database/migrations/dev/example-name-month-day
// NOTE: dev 마이그레이션 실행 명령어
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.dev.ts
