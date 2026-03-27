const db = require('../config/db');
const AppError = require('../utils/AppError');

exports.getAll = async ({
  page = 1,
  limit = 10,
  search = '',
  role = '',
  sort = 'created_at',
  order = 'desc',
}) => {
  const offset = (page - 1) * limit;
  const allowedSort = ['created_at', 'name', 'email'];
  const allowedOrder = ['asc', 'desc'];
  const safeSort = allowedSort.includes(sort) ? sort : 'created_at';
  const safeOrder = allowedOrder.includes(order) ? order : 'desc';

  let where = 'WHERE name LIKE ?';
  const params = [`%${search}%`];

  if (role) {
    where += ' AND role = ?';
    params.push(role);
  }

  const [rows] = await db.query(
    `SELECT id, name, email, role, created_at
     FROM users
     ${where}
     ORDER BY ${safeSort} ${safeOrder}
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM users ${where}`,
    params
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
  await exports.getById(id);
  await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [
    name,
    email,
    id,
  ]);
  return exports.getById(id);
};

exports.remove = async (id) => {
  await exports.getById(id);
  await db.query('DELETE FROM users WHERE id = ?', [id]);
};
