// 创建订单函数
const pool = require('../../utils/db');
const { authMiddleware } = require('../../utils/jwt');

// 生成唯一订单号
function generateOrderNumber() {
  return 'ORD' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

// 辅助函数：验证输入
function validateInput(data) {
  const errors = [];
  if (!data.content || data.content.trim() === '') {
    errors.push({ msg: 'Content is required' });
  }
  return errors;
}

exports.handler = async (event) => {
  try {
    // 只允许POST请求
    if (event.httpMethod !== 'POST') {
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
    
    const { id, userType } = authResult.user;
    
    // 检查是否为派单员
    if (userType !== 'dispatcher') {
      return { statusCode: 403, body: JSON.stringify({ message: 'Only dispatchers can create orders' }) };
    }
    
    // 解析请求体
    const body = JSON.parse(event.body);
    
    // 验证输入
    const errors = validateInput(body);
    if (errors.length > 0) {
      return { statusCode: 400, body: JSON.stringify({ errors }) };
    }
    
    const { content } = body;
    const orderNumber = generateOrderNumber();
    
    // 创建订单
    const [result] = await pool.query(
      'INSERT INTO orders (orderNumber, content, dispatcherId) VALUES (?, ?, ?)',
      [orderNumber, content, id]
    );
    
    // 获取创建的订单
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    
    return {
      statusCode: 201,
      body: JSON.stringify(orders[0])
    };
  } catch (error) {
    console.error('Create order error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error' }) };
  }
};