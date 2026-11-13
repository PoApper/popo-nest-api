// Only the explicit test:mysql:bulk-accept command loads this override.
// Use a disposable loopback MySQL database: these suites recreate its schema.
jest.mock('../src/config/configurations', () => {
  const actual = jest.requireActual<
    typeof import('../src/config/configurations')
  >('../src/config/configurations');
  return {
    __esModule: true,
    default: () => {
      const port = Number(process.env.POPO_TEST_MYSQL_PORT);
      const password = process.env.POPO_TEST_MYSQL_PASSWORD;
      if (!Number.isInteger(port) || port < 1 || port > 65535 || !password) {
        throw new Error(
          'Set POPO_TEST_MYSQL_PORT and POPO_TEST_MYSQL_PASSWORD for the disposable test database',
        );
      }
      // MySQL 8 requires TEXT defaults to be expressions. Preserve the entity
      // defaults while generating the disposable schema with synchronize().
      const { MysqlDriver } = jest.requireActual<
        typeof import('typeorm/driver/mysql/MysqlDriver')
      >('typeorm/driver/mysql/MysqlDriver');
      if (!jest.isMockFunction(MysqlDriver.prototype.normalizeDefault)) {
        const normalizeDefault = MysqlDriver.prototype.normalizeDefault;
        jest
          .spyOn(MysqlDriver.prototype, 'normalizeDefault')
          .mockImplementation(function (column) {
            const value = normalizeDefault.call(this, column);
            return column.type === 'text' && typeof column.default === 'string'
              ? `(${value})`
              : value;
          });
      }
      return {
        ...actual.default(),
        database: {
          type: 'mysql',
          host: '127.0.0.1',
          port,
          username: 'popotest',
          password,
          database: 'popo_transaction_test',
          entities: ['src/**/*.entity.ts'],
          synchronize: true,
          dropSchema: true,
          charset: 'utf8mb4',
          extra: { connectionLimit: 1 },
          retryAttempts: 1,
        },
      };
    },
  };
});
