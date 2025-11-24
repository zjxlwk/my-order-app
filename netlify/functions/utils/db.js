// 数据库连接配置
const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'mysql2.sqlpub.com',
  port: process.env.MYSQL_PORT || 3307,
  user: process.env.MYSQL_USER || 'zjxlwk',
  password: process.env.MYSQL_PASSWORD || 'r3Jykp3NHO9ehFuS',
  database: process.env.MYSQL_DATABASE || 'zjxlwk_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 导出连接池
module.exports = pool;

// 初始化数据库表结构
exports.initTables = async () => {
  try {
    const connection = await pool.getConnection();
    
    // 创建用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        userType ENUM('receiver', 'dispatcher') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // 创建订单表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderNumber VARCHAR(255) NOT NULL UNIQUE,
        content TEXT NOT NULL,
        status ENUM('pending', 'delivering', 'completed') NOT NULL DEFAULT 'pending',
        dispatcherId INT NOT NULL,
        receiverId INT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (dispatcherId) REFERENCES users(id),
        FOREIGN KEY (receiverId) REFERENCES users(id)
      );
    `);
    
    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
};