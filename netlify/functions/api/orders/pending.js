// 获取待接单订单列表函数
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
    
    const { userType } = authResult.user;
    
    // 检查是否为接单员
    if (userType !== 'receiver') {
      return { statusCode: 403, body: JSON.stringify({ message: 'Only receivers can view pending orders' }) };
    }
    
    // 查询待接单订单，包含派单员信息
    const [orders] = await pool.query(`
      SELECT 
        o.*, 
        d.username AS dispatcherName 
      FROM 
        orders o
      LEFT JOIN 
        users d ON o.dispatcherId = d.id
      WHERE 
        o.status = 'pending'
      ORDER BY 
        o.createdAt DESC
    `);
    
    return {
      statusCode: 200,
      body: JSON.stringify(orders)
    };
  } catch (error) {
    console.error('Get pending orders error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error' }) };
  }
};