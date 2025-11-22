# 后端服务配置指南

## 数据库配置 (MySQL)

本项目已从MongoDB迁移到MySQL数据库。请按照以下步骤配置MySQL连接：

### 1. 确保MySQL服务已启动

Windows系统下，可以通过以下方式启动MySQL服务：
- 通过MySQL安装程序启动
- 通过Windows服务管理器启动（services.msc）
- 通过命令行：`net start MySQL`（如果MySQL服务名为MySQL）

### 2. 配置数据库连接

我们提供了两种方式配置MySQL连接参数：

#### 方法一：通过.env文件配置（推荐）

编辑`.env`文件，设置您的MySQL连接参数：

```
# MySQL数据库配置
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password_here  # 请设置您的MySQL密码
MYSQL_DATABASE=order_app

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
```

#### 方法二：通过环境变量配置

您也可以通过设置系统环境变量来配置MySQL连接参数。

### 3. 创建数据库（可选）

代码会自动尝试创建数据库，但如果权限不足，您可能需要手动创建：

```sql
CREATE DATABASE order_app;
```

## 安装依赖

```bash
npm install
```

## 启动服务

```bash
node index.js
```

服务将在 http://localhost:5000 启动。

## 故障排除

### 常见问题：

#### 1. MySQL连接错误：Access denied for user 'root'@'localhost'

这表示MySQL拒绝了root用户的连接。请检查：
- MySQL服务是否正在运行
- root用户密码是否正确设置
- root用户是否有从localhost连接的权限

#### 2. 如何设置MySQL root用户密码

如果您的MySQL root用户还没有设置密码，可以通过以下步骤设置：

1. 登录MySQL：
   ```bash
   mysql -u root
   ```

2. 设置密码：
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
   FLUSH PRIVILEGES;
   ```

#### 3. 如何查看MySQL服务是否正在运行

Windows系统下，您可以使用以下命令检查：
```bash
netstat -ano | findstr :3306
```

如果看到有进程监听3306端口（MySQL默认端口），则MySQL服务正在运行。

## API端点

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息

### 订单相关
- `POST /api/orders/create` - 派单员创建新订单
- `GET /api/orders/dispatcher` - 派单员获取所有已派订单
- `GET /api/orders/pending` - 接单员获取所有待接单订单
- `PUT /api/orders/accept/:orderId` - 接单员接单
- `PUT /api/orders/complete/:orderId` - 接单员完成订单
- `GET /api/orders/receiver` - 接单员获取所有订单