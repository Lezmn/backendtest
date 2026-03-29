const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { sendError } = require('../utils/response');

// Validator ตรวจ Thai characters
const isThai = (str) => /[\u0E00-\u0E7F]/.test(str);

// Middleware เช็ค error จาก validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    const hasConflictError = formattedErrors.some((err) =>
      /already exists/i.test(err.message)
    );

    if (hasConflictError) {
      return sendError(res, 'Conflict', 409, formattedErrors);
    }

    return sendError(res, 'Validation failed', 400, formattedErrors);
  }
  next();
};

// Validate Register
exports.validateRegister = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .custom((value) => {
  if (isThai(value)) throw new Error('Name cannot contain Thai characters');
  return true;
}),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .trim()
    .customSanitizer((value) => value.toLowerCase())
    .custom((value) => {
      // ห้ามมีภาษาไทยใน email
      if (isThai(value)) {
        throw new Error('Email cannot contain Thai characters');
      }
      return true;
    })
    .custom(async (value) => {
      const [rows] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [value]);
      if (rows.length) {
        throw new Error('Email already exists');
      }
      return true;
    }),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('Role must be admin or user'),
  validate,
];

// Validate Login
exports.validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .trim()
    .customSanitizer((value) => value.toLowerCase())
    .custom((value) => {
      // ห้ามมีภาษาไทยใน email
      if (isThai(value)) {
        throw new Error('Email cannot contain Thai characters');
      }
      return true;
    }),
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

// Validate Logout
exports.validateLogout = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .trim()
    .customSanitizer((value) => value.toLowerCase())
    .custom((value) => {
      // ห้ามมีภาษาไทยใน email
      if (isThai(value)) {
        throw new Error('Email cannot contain Thai characters');
      }
      return true;
    }),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate,
];

// Validate Update User
exports.validateUpdateUser = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .custom((value) => {
      if (isThai(value)) throw new Error('Name cannot contain Thai characters');
      return true;
    }),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .trim()
    .customSanitizer((value) => value.toLowerCase())
    .custom((value) => {
      // ห้ามมีภาษาไทยใน email
      if (isThai(value)) {
        throw new Error('Email cannot contain Thai characters');
      }
      return true;
    })
    .custom(async (value, { req }) => {
      const [rows] = await db.query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [
        value,
        Number(req.params.id) || 0,
      ]);

      if (rows.length) {
        throw new Error('Email already exists');
      }
      return true;
    }),
  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('Role must be admin or user'),
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
