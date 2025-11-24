// 数据库初始化函数
const { initTables } = require('./utils/db');

exports.handler = async (event) => {
  try {
    // 验证是否为管理员请求（简单验证，实际应用中可增强安全性）
    const secretKey = event.headers['x-secret-key'] || event.queryStringParameters?.secret;
    
    // 注意：这只是一个示例，实际部署时应使用更安全的验证方式
    if (!secretKey || secretKey !== process.env.INIT_DB_SECRET || !process.env.INIT_DB_SECRET) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Unauthorized access' })
      };
    }
    
    // 初始化数据库表
    await initTables();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database tables initialized successfully' })
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error initializing database tables',
        error: error.message 
      })
    };
  }
};