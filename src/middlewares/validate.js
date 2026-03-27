const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// Middleware เช็ค error จาก validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return sendError(res, 'Validation failed', 400, formattedErrors);
  }
  next();
};

// Validate Register
exports.validateRegister = [
  body('name')
    .notEmpty().withMessage('Name is required'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email')
    .trim()
    .customSanitizer((value) => value.toLowerCase()),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password min 6 characters'),
  validate,
];

// Validate Login
exports.validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email')
    .trim()
    .customSanitizer((value) => value.toLowerCase()),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate,
];

// Validate Refresh Token
exports.validateRefresh = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isString().withMessage('Refresh token must be a string'),
  validate,
];

exports.validateLogout = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email')
    .trim()
    .customSanitizer((value) => value.toLowerCase()),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate,
];

// Validate Update User
exports.validateUpdateUser = [
  body('name')
    .notEmpty().withMessage('Name is required'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email')
    .trim()
    .customSanitizer((value) => value.toLowerCase()),
  validate,
];

// Validate Update User Status
exports.validateUpdateUserStatus = [
  body('is_active')
    .notEmpty().withMessage('is_active is required')
    .isBoolean().withMessage('is_active must be true or false')
    .toBoolean(),
  validate,
];