const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { deriveKey, encrypt, decrypt } = require('../crypto');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

router.post('/verify-password', authenticateToken, async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;
  try {
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const validPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!validPassword) return res.status(401).json('Invalid password');
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json('Server error');
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { serviceName, secret, password } = req.body;
  const userId = req.user.id;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json('Invalid password');

    const key = deriveKey(password, user.encryption_salt);
    const { encryptedSecret, iv, authTag } = encrypt(secret, key);

    const newSecret = await pool.query(
      'INSERT INTO two_factor_secrets (user_id, service_name, encrypted_secret, iv, auth_tag) VALUES ($1, $2, $3, $4, $5) RETURNING id, service_name',
      [userId, serviceName, encryptedSecret, iv, authTag]
    );
    res.status(201).json(newSecret.rows[0]);
  } catch (err) {
    res.status(500).json('Server error');
  }
});

router.post('/secrets', authenticateToken, async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json('User not found');
        
        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json('Invalid password');

        const key = deriveKey(password, user.encryption_salt);
        const secretsResult = await pool.query('SELECT * FROM two_factor_secrets WHERE user_id = $1 ORDER BY service_name ASC', [userId]);
        
        const decryptedSecrets = secretsResult.rows.map(row => {
            const secret = decrypt(row.encrypted_secret, key, row.iv, row.auth_tag);
            return { id: row.id, serviceName: row.service_name, secret };
        });
        
        res.json(decryptedSecrets);
    } catch (err) {
        res.status(500).json('Server error');
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    await pool.query('DELETE FROM two_factor_secrets WHERE id = $1 AND user_id = $2', [id, userId]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json('Server error');
  }
});

module.exports = router;
