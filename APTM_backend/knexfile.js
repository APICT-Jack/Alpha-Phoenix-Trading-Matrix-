// alpha-phoenix-backend/knexfile.js
require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.PGHOST || 'localhost',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'alpha_phoenix_dev',
      port: process.env.PGPORT || 5432
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './database/seeds'
    }
  },
  test: {
    client: 'pg',
    connection: {
      host: process.env.PG_TEST_HOST || 'localhost',
      user: process.env.PG_TEST_USER || 'postgres',
      password: process.env.PG_TEST_PASSWORD || '',
      database: process.env.PG_TEST_DB || 'alpha_phoenix_test',
      port: process.env.PG_TEST_PORT || 5433
    },
    migrations: {
      directory: './database/migrations'
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './database/migrations'
    }
  }
};