const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);

  // MySQL Errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ success: false, error: 'Duplicate entry' });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }

  // AppError (custom)
  if (err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  // Default - show more details in development
  const errorResponse = {
    success: false,
    error: 'Internal Server Error',
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.message;
    errorResponse.code = err.code;
  }

  res.status(500).json(errorResponse);
};

module.exports = errorHandler;

module.exports = errorHandler; 