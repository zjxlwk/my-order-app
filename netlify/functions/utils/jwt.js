// JWT工具函数
const jwt = require('jsonwebtoken');

// 生成JWT token
exports.generateToken = (id, userType) => {
  return jwt.sign({
    id,
    userType
  }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '1d'
  });
};

// 验证JWT token
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
};

// 认证中间件
exports.authMiddleware = async (event) => {
  // 从请求头获取Authorization
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: { statusCode: 401, message: 'Not authorized, no token' } };
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = exports.verifyToken(token);
  
  if (!decoded) {
    return { success: false, error: { statusCode: 401, message: 'Not authorized, token failed' } };
  }
  
  return { success: true, user: decoded };
};