const AppError = require('../utils/AppError');
const UserModel = require('../models/usermodel');

exports.getAll = async ({
  page = 1,
  limit = 10,
  search = '',
  role = '',
  sort = 'createdAt',
  order = 'asc',
}) => {
  const offset = (page - 1) * limit;

  // Convert camelCase to snake_case
  const sortMap = {
    createdAt: 'created_at',
    name: 'name',
    email: 'email',
  };

  const allowedSort  = ['created_at', 'name', 'email'];
  const allowedOrder = ['asc', 'desc'];
  const mappedSort   = sortMap[sort] || sort;
  const safeSort     = allowedSort.includes(mappedSort) ? mappedSort : 'created_at';
  const safeOrder    = allowedOrder.includes(order) ? order : 'desc';

  let where = 'WHERE name LIKE ?';
  const params = [`%${search}%`];

  if (role) {
    where += ' AND role = ?';
    params.push(role);
  }

  const [rows]         = await UserModel.getAll({ where, params, safeSort, safeOrder, limit, offset });
  const [[{ total }]]  = await UserModel.countAll({ where, params });

  return {
    rows,
    pagination: {
      currentPage: Number(page),
      totalPages:  Math.ceil(total / limit),
      totalItems:  total,
      itemsPerPage: Number(limit),
    },
  };
};

exports.getById = async (id) => {
  const [rows] = await UserModel.findById(id);
  if (!rows.length) throw new AppError('User not found', 404);
  return {
    id:         rows[0].id,
    name:       rows[0].name,
    email:      rows[0].email,
    role:       rows[0].role,
    is_active:  rows[0].is_active,
    created_at: rows[0].created_at,
    updated_at: rows[0].updated_at,
  };
};

exports.update = async (id, { name, email }) => {
  await exports.getById(id);
  await UserModel.update(id, name, email);
  return exports.getById(id);
};

exports.remove = async (id) => {
  const user = await exports.getById(id);
  await UserModel.deleteById(id);
  return { ...user, message: 'User deleted successfully' };
};

exports.updateStatus = async (id, isActive) => {
  await exports.getById(id);
  await UserModel.updateStatus(id, isActive);
  const [rows] = await UserModel.findById(id);
  return {
    id:         rows[0].id,
    name:       rows[0].name,
    email:      rows[0].email,
    role:       rows[0].role,
    is_active:  rows[0].is_active,
    created_at: rows[0].created_at,
    updated_at: rows[0].updated_at,
  };
};