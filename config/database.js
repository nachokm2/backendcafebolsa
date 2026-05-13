require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'cafeteria_wallstreet',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  // silencioso — el fallback al mock ya se activa al primer query fallido
});

let usingMock = false;
let mock = null;

const getMock = () => {
  if (!mock) mock = require('./mockDb');
  return mock;
};

const query = async (text, params) => {
  if (usingMock) return getMock().query(text, params);
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    if (!usingMock && (err.code === 'ECONNREFUSED' || err.code === '3D000' || err.code === '28P01' || err.message.includes('connect'))) {
      usingMock = true;
      console.warn('[DB] PostgreSQL no disponible — usando base de datos en memoria');
      return getMock().query(text, params);
    }
    console.error('[DB] Query error:', err.message, '| Query:', text.substring(0, 80));
    throw err;
  }
};

const getClient = async () => {
  if (usingMock) return getMock().getClient();
  try {
    return await pool.connect();
  } catch (err) {
    if (!usingMock) {
      usingMock = true;
      console.warn('[DB] PostgreSQL no disponible — usando base de datos en memoria');
    }
    return getMock().getClient();
  }
};

module.exports = { query, getClient, pool };
