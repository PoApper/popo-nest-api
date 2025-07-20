export default () => {
  const isTest = process.env.NODE_ENV === 'test';
  // RSA 키 줄바꿈 처리
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
  const isEscaped = rawPrivateKey.includes('\\n');
  const privateKey = isEscaped
    ? rawPrivateKey.replace(/\\n/g, '\n')
    : rawPrivateKey;

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
    firebase: {
      type: process.env.FIREBASE_TYPE,
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
      authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    },
  };
};
