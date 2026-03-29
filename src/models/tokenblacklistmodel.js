const db = require('../config/db');

const TokenBlacklistModel = {

  ensureTable: () =>
    db.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        token VARCHAR(1024) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        INDEX idx_token_blacklist_expires_at (expires_at)
      )
    `),

  add: (token, expiresAt) =>
    db.query(
      `INSERT INTO token_blacklist (token, expires_at)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
      [token, expiresAt]
    ),

  exists: (token) =>
    db.query(
      'SELECT 1 FROM token_blacklist WHERE token = ? AND expires_at > NOW() LIMIT 1',
      [token]
    ),

  deleteExpired: () =>
    db.query('DELETE FROM token_blacklist WHERE expires_at <= NOW()'),

};

module.exports = TokenBlacklistModel;