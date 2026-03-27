const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

// ตรวจสอบว่า Login แล้ว
exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const blacklisted = await authService.isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ success: false, error: 'Token ถูกยกเลิกแล้ว กรุณา Login ใหม่' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const isActive = await authService.isUserActive(decoded.id);
    if (!isActive) {
      return res.status(401).json({ success: false, error: 'บัญชีถูกออกจากระบบแล้ว กรุณา Login ใหม่' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'บัญชีหมดเวลาการใช้งาน กรุณา Login ใหม่' });
    }

    next(err);
  }
};

// ตรวจสอบ Role
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
};

