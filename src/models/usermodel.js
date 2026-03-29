const db = require('../config/db');

const UserModel = {

  findByEmail: (email) =>
    db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]),

  findById: (id) =>
    db.query(
      'SELECT id, name, email, role, is_active, created_at, updated_at, refresh_token FROM users WHERE id = ? LIMIT 1',
      [id]
    ),

  findByIdActive: (id) =>
    db.query('SELECT is_active FROM users WHERE id = ? LIMIT 1', [id]),

  findEmailExist: (email) =>
    db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]),

  findEmailExistExcludeId: (email, id) =>
    db.query(
      'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
      [email, Number(id) || 0]
    ),

  getAll: ({ where, params, safeSort, safeOrder, limit, offset }) =>
    db.query(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users
       ${where}
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    ),

  countAll: ({ where, params }) =>
    db.query(`SELECT COUNT(*) as total FROM users ${where}`, params),

  create: (name, email, hashedPassword) =>
    db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    ),

  update: (id, name, email) =>
    db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    ),

  updateRefreshToken: (id, refreshToken) =>
    db.query(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [refreshToken, id]
    ),

  updateStatus: (id, isActive) =>
    db.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, id]
    ),

  clearRefreshToken: (id) =>
    db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [id]),

  deleteById: (id) =>
    db.query('DELETE FROM users WHERE id = ?', [id]),

};

module.exports = UserModel;