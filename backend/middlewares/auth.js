const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Token format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const secretKey = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // add user data to request
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

module.exports = auth;
