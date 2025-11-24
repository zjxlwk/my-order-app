// 用户登录函数
const pool = require('../../utils/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../utils/jwt');

// 辅助函数：验证输入
function validateInput(data) {
  const errors = [];
  if (!data.username || data.username.trim() === '') {
    errors.push({ msg: 'Username is required' });
  }
  if (!data.password) {
    errors.push({ msg: 'Password is required' });
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
    
    const { username, password } = body;
    
    // 查找用户
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid username or password' }) };
    }
    
    const user = users[0];
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid username or password' }) };
    }
    
    // 生成token
    const token = generateToken(user.id, user.userType);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        id: user.id,
        username: user.username,
        userType: user.userType,
        token
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error' }) };
  }
};