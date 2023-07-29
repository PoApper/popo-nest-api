export default () => ({
  database: {
    type: process.env.DATABASE_TYPE,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
    entities: ['dist/**/*.entity.js'],
    // `sync` should be `false` on production environment
    synchronize: process.env.DATABASE_SYNC === 'true',
  },
});
