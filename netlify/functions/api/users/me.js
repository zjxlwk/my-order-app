// 获取当前用户信息函数
const pool = require('../../utils/db');
const { authMiddleware } = require('../../utils/jwt');

exports.handler = async (event) => {
  try {
    // 只允许GET请求
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }
    
    // 验证用户身份
    const authResult = await authMiddleware(event);
    if (!authResult.success) {
      return {
        statusCode: authResult.error.statusCode,
        body: JSON.stringify({ message: authResult.error.message })
      };
    }
    
    const { id } = authResult.user;
    
    // 查询用户信息
    const [users] = await pool.query('SELECT id, username, userType, createdAt FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: 'User not found' }) };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(users[0])
    };
  } catch (error) {
    console.error('Get user error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error' }) };
  }
};