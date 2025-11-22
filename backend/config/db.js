const mysql = require('mysql2/promise');

let db = null;

// MySQL连接配置
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '', // 用户需要设置密码
  database: process.env.MYSQL_DATABASE || 'order_app' // 数据库名称
};

// 连接到MySQL数据库
const connectDB = async () => {
  try {
    // 先尝试连接到MySQL服务器，不指定数据库
    const connection = await mysql.createConnection({
      host: mysqlConfig.host,
      user: mysqlConfig.user,
      password: mysqlConfig.password
    });
    
    // 检查数据库是否存在，如果不存在则创建
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${mysqlConfig.database}`);
    await connection.end();
    
    // 连接到指定数据库
    db = await mysql.createConnection(mysqlConfig);
    
    console.log('MySQL Database Connected...');
    
    // 创建必要的数据库表
    await createTables();
  } catch (error) {
    console.error('MySQL connection error:', error);
    console.log('请确保MySQL服务已启动，并检查以下配置:');
    console.log('- 用户名:', mysqlConfig.user);
    console.log('- 密码:', mysqlConfig.password ? '已设置' : '未设置（请设置密码）');
    console.log('- 数据库:', mysqlConfig.database);
    console.log('提示: 您可以通过设置环境变量来配置这些参数');
    process.exit(1);
  }
};

// 创建数据库表
const createTables = async () => {
  try {
    // 动态导入模型并创建表
    console.log('Creating database tables...');
    const User = require('../models/User');
    const Order = require('../models/Order');
    
    await User.createUserTable();
    await Order.createOrderTable();
    
    console.log('Tables creation completed');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

// 获取数据库连接
const getDB = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

module.exports = { connectDB, getDB, mysqlConfig };