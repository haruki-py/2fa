const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initializeDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        encryption_salt BYTEA NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS two_factor_secrets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service_name VARCHAR(255) NOT NULL,
        encrypted_secret TEXT NOT NULL,
        iv BYTEA NOT NULL,
        auth_tag BYTEA NOT NULL
      );
    `);
  } finally {
    client.release();
  }
};

initializeDb().catch(e => console.error(e.stack));

module.exports = pool;
