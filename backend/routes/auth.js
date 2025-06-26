const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { deriveKey, encrypt, decrypt, SALT_LENGTH } = require('../crypto');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json('Email and password required');

  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, encryption_salt) VALUES ($1, $2, $3) RETURNING id, email',
      [email, passwordHash, salt]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json('Error registering user');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json('Email and password required');
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json('Invalid credentials');
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json('Invalid credentials');
    
    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ accessToken });
  } catch (err) {
    res.status(500).json('Server error');
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    const validOldPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!validOldPassword) {
      await client.query('ROLLBACK');
      return res.status(400).json('Invalid old password');
    }

    const oldKey = deriveKey(oldPassword, user.encryption_salt);
    const secretsResult = await client.query('SELECT * FROM two_factor_secrets WHERE user_id = $1', [userId]);
    const secrets = secretsResult.rows;

    const newKey = deriveKey(newPassword, user.encryption_salt);

    for (const secret of secrets) {
      const decryptedSecret = decrypt(secret.encrypted_secret, oldKey, secret.iv, secret.auth_tag);
      const { encryptedSecret, iv, authTag } = encrypt(decryptedSecret, newKey);
      await client.query(
        'UPDATE two_factor_secrets SET encrypted_secret = $1, iv = $2, auth_tag = $3 WHERE id = $4',
        [encryptedSecret, iv, authTag, secret.id]
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

    await client.query('COMMIT');
    res.json('Password updated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json('Server error during password change');
  } finally {
    client.release();
  }
});

module.exports = router;
