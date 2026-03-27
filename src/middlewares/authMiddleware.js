const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const { sendError } = require('../utils/response');

// ตรวจสอบว่า Login แล้ว
exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return sendError(res, 'Unauthorized', 401);
  }

  try {
    const blacklisted = await authService.isBlacklisted(token);
    if (blacklisted) {
      return sendError(res, 'Token ถูกยกเลิกแล้ว กรุณา Login ใหม่', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const isActive = await authService.isUserActive(decoded.id);
    if (!isActive) {
      return sendError(res, 'บัญชีถูกออกจากระบบแล้ว กรุณา Login ใหม่', 401);
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'บัญชีหมดเวลาการใช้งาน กรุณา Login ใหม่', 401);
    }

    next(err);
  }
};

// ตรวจสอบ Role
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  if (!roles.includes(req.user.role)) {
    return sendError(res, 'Forbidden', 403);
  }
  next();
};

// อนุญาตเฉพาะ admin หรือเจ้าของ resource ตาม user id
exports.authorizeAdminOrSelf = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const targetUserId = Number(req.params.id);
  if (req.user.role === 'admin' || req.user.id === targetUserId) {
    return next();
  }

  return sendError(res, 'Forbidden', 403);
};

