# Bulk approval transaction regression tests

SQLite shares one connection between repositories and can conceal accidental
reads through a non-transactional repository. Run the targeted reservation tests
against disposable MySQL with `connectionLimit: 1` to detect that regression.

Start a disposable MySQL 8.4 container with:

- a port published on `127.0.0.1`;
- database `popo_transaction_test`;
- user `popotest` and a temporary password.

Then run:

```sh
POPO_TEST_MYSQL_PORT=<published-port> \
POPO_TEST_MYSQL_PASSWORD=<temporary-password> \
npm run test:mysql:bulk-accept
```

The command loads `mysql-transaction.setup.ts` explicitly. Ordinary `npm test`
continues to use in-memory SQLite. The MySQL suites **recreate the entire schema**
of `popo_transaction_test`; use only a disposable database and delete the container
afterward. The host, database name and username are fixed to limit accidental use
of a different database.

The cases check earlier approvals in the same batch, transaction-manager
propagation, absence of external repository reads, and the `sendEmail` query.
The test setup renders existing TEXT defaults as MySQL 8 default expressions
when generating its disposable schema; default values are preserved.
