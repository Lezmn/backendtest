const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const AppError = require('../utils/AppError');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

let blacklistTableReady;

const ensureBlacklistTable = async () => {
  if (!blacklistTableReady) {
    blacklistTableReady = db.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        token VARCHAR(1024) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        INDEX idx_token_blacklist_expires_at (expires_at)
      )
    `);
  }

  await blacklistTableReady;
};

exports.register = async ({ name, email, password }) => {
  const [exist] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exist.length) throw new AppError('Email already exists', 409);

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashed]
  );
  return { id: result.insertId, name, email };
};

exports.login = async ({ email, password }) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!rows.length) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, rows[0].password);
  if (!valid) throw new AppError('Invalid credentials', 401);
    const accessToken = jwt.sign(
    { id: rows[0].id, role: rows[0].role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
    const refreshToken = jwt.sign(
    { id: rows[0].id, type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  await db.query(
    'UPDATE users SET is_active = 1, refresh_token = ? WHERE id = ?',
    [refreshToken, rows[0].id]
  );

  return { token: accessToken, refreshToken };
};

exports.refreshAccessToken = async (refreshToken) => {
  let decoded;

  try {
    decoded = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const [rows] = await db.query(
    'SELECT id, role, is_active, refresh_token FROM users WHERE id = ? LIMIT 1',
    [decoded.id]
  );

  if (!rows.length) throw new AppError('User not found', 404);
  if (rows[0].refresh_token !== refreshToken) {
    throw new AppError('Refresh token mismatch', 401);
  }
  if (rows[0].is_active !== 1) {
    throw new AppError('User is logged out', 401);
  }

  const accessToken = jwt.sign(
    { id: rows[0].id, role: rows[0].role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  return { token: accessToken };
};

exports.getMe = async (id) => {
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
  if (!rows.length) throw new AppError('User not found', 404);
  return rows[0];
};

exports.logout = async (token) => {
  const decoded = jwt.verify(token, ACCESS_SECRET);
  if (!decoded || !decoded.exp) return;

  await ensureBlacklistTable();

  const expiresAt = new Date(decoded.exp * 1000);
  await db.query(
    `
      INSERT INTO token_blacklist (token, expires_at)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)
    `,
    [token, expiresAt]
  );

  await db.query('DELETE FROM token_blacklist WHERE expires_at <= NOW()');

  await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [decoded.id]);
};

exports.isBlacklisted = async (token) => {
  await db.query('DELETE FROM token_blacklist WHERE expires_at <= NOW()');

  const [rows] = await db.query(
    'SELECT 1 FROM token_blacklist WHERE token = ? AND expires_at > NOW() LIMIT 1',
    [token]
  );

  return rows.length > 0;
};

exports.isUserActive = async (userId) => {
  const [rows] = await db.query('SELECT is_active FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!rows.length) return false;
  return rows[0].is_active === 1;
};
