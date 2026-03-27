const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

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

// Get Me (ดูข้อมูลตัวเอง)
exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};