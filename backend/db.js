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
    console.log('Initializing database tables...');
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
    console.log('Database tables initialized successfully.');
  } catch(err) {
    console.error('Error initializing database tables:', err.stack);
  } finally {
    client.release();
  }
};

initializeDb();

module.exports = pool;
