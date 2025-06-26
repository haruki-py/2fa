const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_DERIVATION_ITERATIONS = 210000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const DIGEST = 'sha512';

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, KEY_DERIVATION_ITERATIONS, KEY_LENGTH, DIGEST);
}

function encrypt(text, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encryptedSecret: encrypted.toString('hex'), iv, authTag };
}

function decrypt(encryptedSecretHex, key, iv, authTag) {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedSecretHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { deriveKey, encrypt, decrypt, SALT_LENGTH };
