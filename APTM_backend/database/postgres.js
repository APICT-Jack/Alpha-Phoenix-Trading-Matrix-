import { Pool } from 'pg';
import pgConfig from '../config/db.js';

const pool = new Pool(pgConfig);

export const initializeDatabases = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
    return pool;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err);
    throw err;
  }
};

export default pool;