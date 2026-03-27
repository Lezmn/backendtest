const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const AppError = require('../utils/AppError');

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

  const token = jwt.sign(
    { id: rows[0].id, role: rows[0].role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { token }; 
};

exports.getMe = async (id) => {
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
  if (!rows.length) throw new AppError('User not found', 404);
  return rows[0];
};