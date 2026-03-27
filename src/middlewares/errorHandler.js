const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);

  // MySQL Errors
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Duplicate entry', 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // AppError (custom)
  if (err.status) {
    return sendError(res, err.message, err.status);
  }

  if (process.env.NODE_ENV === 'development') {
    const details = [
      { field: 'details', message: err.message || 'Unknown error' },
    ];
    return sendError(res, 'Internal Server Error', 500, details);
  }

  return sendError(res, 'Internal Server Error', 500);
};

module.exports = errorHandler;