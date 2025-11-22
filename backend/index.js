require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接
connectDB().then(() => {
  console.log('数据库连接成功，正在加载路由...');
  // 数据库连接成功后再加载路由和模型
  const userRoutes = require('./routes/userRoutes');
  const orderRoutes = require('./routes/orderRoutes');
  
  // 路由
  app.use('/api/users', userRoutes);
  app.use('/api/orders', orderRoutes);
}).catch(err => {
  console.error('数据库连接失败，无法启动应用:', err);
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});