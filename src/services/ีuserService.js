const db = require('../config/db');
const AppError = require('../utils/AppError');

exports.getAll = async ({ page = 1, limit = 10, search = '' }) => {
  const offset = (page - 1) * limit;
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE name LIKE ? LIMIT ? OFFSET ?',
    [`%${search}%`, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) as total FROM users WHERE name LIKE ?',
    [`%${search}%`]
  );
  return {
    rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
  if (!rows.length) throw new AppError('User not found', 404);
  return rows[0];
};

exports.update = async (id, { name, email }) => {
  await exports.getById(id); // เช็คว่ามีอยู่ไหม
  await db.query(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name, email, id]
  );
  return exports.getById(id);
};

exports.remove = async (id) => {
  await exports.getById(id); // เช็คว่ามีอยู่ไหม
  await db.query('DELETE FROM users WHERE id = ?', [id]);
};