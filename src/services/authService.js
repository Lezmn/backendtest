const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const UserModel = require('../models/user.model');
const TokenBlacklistModel = require('../models/tokenBlacklist.model');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

let blacklistTableReady;

const ensureBlacklistTable = async () => {
  if (!blacklistTableReady) {
    blacklistTableReady = TokenBlacklistModel.ensureTable();
  }
  await blacklistTableReady;
};

exports.register = async ({ name, email, password }) => {
  const [exist] = await UserModel.findEmailExist(email);
  if (exist.length) throw new AppError('Email already exists', 409);

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await UserModel.create(name, email, hashed);

  return { id: result.insertId, name, email };
};

exports.login = async ({ email, password }) => {
  const [rows] = await UserModel.findByEmail(email);
  if (!rows.length) throw new AppError('Invalid Email', 401);

  const user = rows[0];

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid Password', 401);

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  await UserModel.updateRefreshToken(user.id, refreshToken);

  return {
    token: accessToken,
    refreshToken,
    user: {
      id:         user.id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      is_active:  1,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

exports.refreshAccessToken = async (refreshToken) => {
  let decoded;

  try {
    decoded = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const [rows] = await UserModel.findById(decoded.id);

  if (!rows.length) throw new AppError('User not found', 404);
  if (rows[0].refresh_token !== refreshToken) throw new AppError('Refresh token mismatch', 401);
  if (rows[0].is_active !== 1) throw new AppError('User is logged out', 401);

  const accessToken = jwt.sign(
    { id: rows[0].id, role: rows[0].role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  return { token: accessToken };
};

exports.getMe = async (id) => {
  const [rows] = await UserModel.findById(id);
  if (!rows.length) throw new AppError('User not found', 404);
  return rows[0];
};

exports.logout = async (token) => {
  const decoded = jwt.verify(token, ACCESS_SECRET);
  if (!decoded || !decoded.exp) return;

  await ensureBlacklistTable();

  const expiresAt = new Date(decoded.exp * 1000);
  await TokenBlacklistModel.add(token, expiresAt);
  await TokenBlacklistModel.deleteExpired();
  await UserModel.clearRefreshToken(decoded.id);
};

exports.isBlacklisted = async (token) => {
  await TokenBlacklistModel.deleteExpired();
  const [rows] = await TokenBlacklistModel.exists(token);
  return rows.length > 0;
};

exports.isUserActive = async (userId) => {
  const [rows] = await UserModel.findByIdActive(userId);
  if (!rows.length) return false;
  return rows[0].is_active === 1;
};