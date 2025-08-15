import { DataSource } from 'typeorm';

// PRODUCTION 환경을 위한 마이그레이션 스크립트
export const ProdDataSource = new DataSource({
  type: 'mysql',
  host: 'popo-host', // popo host name
  port: 3306,
  username: 'prod-username', // prod 환경의 username
  password: 'prod-password', // prod 환경의 password
  database: 'prod-database', // prod 환경의 database
  synchronize: false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/prod/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});

// NOTE: prod 마이그레이션 생성 명령어
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d src/database/data-source.prod.ts src/database/migrations/prod/example-name-month-day
// NOTE: prod 마이그레이션 실행 명령어
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.prod.ts
