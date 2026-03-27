const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);

  // MySQL Errors
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Duplicate entry', 409);
  }

  if (['ER_BAD_NULL_ERROR', 'ER_TRUNCATED_WRONG_VALUE', 'ER_PARSE_ERROR', 'ER_NO_DEFAULT_FOR_FIELD'].includes(err.code)) {
    return sendError(res, 'Bad request', 400);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(res, 'Referenced resource not found', 404);
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return sendError(res, 'Conflict: resource is still referenced', 409);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Invalid JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Invalid JSON payload', 400);
  }

  // AppError (custom)
  if (err.status || err.statusCode) {
    return sendError(res, err.message, err.status || err.statusCode);
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