# 接单和派单系统使用指南

## 系统概述

这是一个基于前后端分离架构的接单和派单系统，支持两种用户角色：
- **派单员**：创建新订单
- **接单员**：接收、处理和完成订单

## 技术栈

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT 身份验证

### 前端
- React + Vite
- React Router DOM
- Axios

## 环境要求

1. **Node.js**：v14 或更高版本
2. **npm**：v6 或更高版本
3. **MongoDB**：本地或远程 MongoDB 数据库

## 安装和运行步骤

### 1. 数据库准备

确保 MongoDB 服务已启动：

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo service mongod start
```

### 2. 后端服务

#### 安装依赖

```bash
cd backend
npm install
```

#### 配置数据库连接

在 `backend/config/db.js` 中可以修改数据库连接信息：

```javascript
await mongoose.connect('mongodb://localhost:27017/order-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

#### 启动后端服务

```bash
node index.js
```

或使用 nodemon 实现热重载（需额外安装）：

```bash
npm install -g nodemon
nodemon index.js
```

后端服务将在 `http://localhost:5000` 上运行。

### 3. 前端服务

#### 安装依赖

```bash
cd frontend
npm install
```

#### 启动前端开发服务器

```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 上运行。

## 系统功能使用

### 1. 用户注册

1. 访问 `http://localhost:3000/register`
2. 输入用户名、密码和邮箱
3. 选择用户类型：接单员或派单员
4. 点击"注册"按钮

### 2. 用户登录

1. 访问 `http://localhost:3000/login`
2. 输入用户名和密码
3. 点击"登录"按钮

登录后，系统会根据用户类型自动跳转到相应的仪表盘：
- 接单员 → 接单员仪表盘
- 派单员 → 派单员仪表盘

### 3. 派单员功能

#### 创建新订单

1. 在派单员仪表盘页面，填写订单内容
2. 点击"创建订单"按钮
3. 订单将显示在"已派订单"列表中，状态为"待接单"

#### 查看已派订单

- 在"已派订单"列表中，可以查看所有已创建的订单
- 订单状态会实时更新：待接单 → 配送中 → 已完成

### 4. 接单员功能

#### 接收订单

1. 在接单员仪表盘的"待接单"列表中，找到需要接收的订单
2. 点击"接收订单"按钮
3. 订单将从"待接单"列表移动到"配送中"列表

#### 完成订单

1. 在"配送中"列表中，找到已经完成的订单
2. 点击"完成订单"按钮
3. 订单将从"配送中"列表移动到"已完成订单"列表

#### 查看订单历史

- "已完成订单"列表中显示所有已完成的订单
- 可以查看每个订单的详细信息和完成时间

## API 端点说明

### 用户相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 订单相关

- `POST /api/orders/create` - 创建新订单（派单）
- `GET /api/orders/dispatcher` - 获取派单员的订单列表
- `GET /api/orders/receiver/pending` - 获取接单员的待接单列表
- `POST /api/orders/:id/accept` - 接单
- `POST /api/orders/:id/complete` - 完成订单
- `GET /api/orders/receiver` - 获取接单员的所有订单

## 注意事项

1. 确保 MongoDB 服务始终处于运行状态
2. 前后端服务需要同时运行才能正常使用系统
3. 如果修改了后端代码，需要重启后端服务才能生效
4. 前端代码修改后，开发服务器会自动刷新，无需手动重启

## 故障排除

### 1. MongoDB 连接失败

- 检查 MongoDB 服务是否已启动
- 检查连接字符串是否正确
- 确认 MongoDB 端口是否被占用

### 2. 后端服务启动失败

- 检查是否安装了所有依赖（运行 `npm install`）
- 检查端口 5000 是否被占用
- 查看控制台输出的错误信息

### 3. 前端页面无法访问后端 API

- 检查后端服务是否正常运行
- 检查 Vite 配置中的代理设置是否正确
- 确认 API 端点路径是否正确

## 开发说明

### 添加新功能

1. 后端：在 `controllers` 中添加新的控制器，在 `routes` 中配置路由
2. 前端：在 `src/components` 中创建新组件，在 `src/App.jsx` 中配置路由

### 修改样式

- 全局样式：`src/App.css`
- 组件样式：可以在组件中使用内联样式或创建单独的 CSS 文件

## 许可证

MIT