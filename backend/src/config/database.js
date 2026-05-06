import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'otp_service',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10'),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  enableStrictUUID: false,
  decimalNumbers: true,
  supportBigNumbers: true,
});

pool.on('error', (err) => {
  console.error('Database Pool Error:', err);
});

export const query = async (sql, values = []) => {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(sql, values);
    connection.release();
    return results;
  } catch (error) {
    throw error;
  }
};

export const getConnection = async () => {
  return await pool.getConnection();
};

export default pool;