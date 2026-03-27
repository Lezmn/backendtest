const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.message}`);

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

  // MySQL Errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, error: 'Duplicate entry' }); // 409 Conflict
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });   // 401 Unauthorized
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired' });   // 401 Unauthorized
  }

  // AppError (custom)
  if (err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  // Default
  res.status(500).json({ success: false, error: 'Internal Server Error' });    // 500
};

module.exports = errorHandler;

  // AppError (custom)
  if (err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  // Default
  res.status(500).json({ success: false, error: 'Internal Server Error' });

module.exports = errorHandler;