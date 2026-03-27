const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

// Register
exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    sendSuccess(res, user, 201);
  } catch (err) {
    next(err);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// Refresh Access Token
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// Get Me (ดูข้อมูลตัวเอง)
exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return sendError(res, 'No token provided', 400);
    }

    await authService.logout(token);
    sendSuccess(res, { message: 'ออกจากระบบสำเร็จ' });
  } catch (err) {
    next(err);
  }
};