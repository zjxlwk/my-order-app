const jwt = require('jsonwebtoken');

// 生成JWT token
const generateToken = (id, userType) => {
  return jwt.sign({
    id,
    userType
  }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '1d'
  });
};

// 验证JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};