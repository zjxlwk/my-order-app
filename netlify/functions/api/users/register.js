// 用户注册函数
const pool = require('../../utils/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../utils/jwt');

// 辅助函数：验证输入
function validateInput(data) {
  const errors = [];
  if (!data.username || data.username.trim() === '') {
    errors.push({ msg: 'Username is required' });
  }
  if (!data.password || data.password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }
  if (!data.userType || !['receiver', 'dispatcher'].includes(data.userType)) {
    errors.push({ msg: 'User type must be receiver or dispatcher' });
  }
  return errors;
}

exports.handler = async (event) => {
  try {
    // 只允许POST请求
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }
    
    // 解析请求体
    const body = JSON.parse(event.body);
    
    // 验证输入
    const errors = validateInput(body);
    if (errors.length > 0) {
      return { statusCode: 400, body: JSON.stringify({ errors }) };
    }
    
    const { username, password, userType } = body;
    
    // 检查用户名是否已存在
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'User already exists' }) };
    }
    
    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建新用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password, userType) VALUES (?, ?, ?)',
      [username, hashedPassword, userType]
    );
    
    // 生成token
    const token = generateToken(result.insertId, userType);
    
    return {
      statusCode: 201,
      body: JSON.stringify({
        id: result.insertId,
        username,
        userType,
        token
      })
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error' }) };
  }
};