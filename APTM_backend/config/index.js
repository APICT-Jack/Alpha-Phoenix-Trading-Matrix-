
require('dotenv').config();

module.exports = {
  db: {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'alpha_phoenix',
    password: process.env.PGPASSWORD || 'password',
    port: process.env.PGPORT || 5432,
    ssl: process.env.PGSSL === 'true'
  },
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/alpha_phoenix',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || ''
  }
};