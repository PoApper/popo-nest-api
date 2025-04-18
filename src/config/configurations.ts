export default () => {
  const isTest = process.env.NODE_ENV === 'test';

  return {
    database: {
      type: isTest ? 'sqlite' : process.env.DATABASE_TYPE || 'mysql',
      host: isTest ? undefined : process.env.DATABASE_HOST,
      port: isTest
        ? undefined
        : parseInt(process.env.DATABASE_PORT, 10) || 3306,
      username: isTest ? undefined : process.env.DATABASE_USERNAME,
      password: isTest ? undefined : process.env.DATABASE_PASSWORD,
      database: isTest ? ':memory:' : process.env.DATABASE_DATABASE,
      entities: isTest
        ? ['src/**/*.entity.ts'] // ✅ 테스트 환경에서는 TypeScript 파일 포함
        : ['dist/**/*.entity.js'], // ✅ 프로덕션 환경에서는 컴파일된 JS 파일 포함
      synchronize: isTest ? true : process.env.DATABASE_SYNC === 'true', // 테스트 환경에서는 항상 true
      dropSchema: isTest, // ✅ 테스트 시 DB 초기화
      charset: isTest ? undefined : 'utf8mb4', // 테스트 환경인 SQLite는 기본적으로 MYSQL의 utf8mb4까지 커버하므로 따로 설정 필요하지 않음
    },
  };
};
