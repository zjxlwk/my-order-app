# Netlify部署指南（新手版）

本指南将详细介绍如何将项目部署到Netlify平台，使用Netlify Functions替代Node.js后端。每一步都有详细说明，请按照步骤逐步操作。

## 📋 前置准备

### 1. 确认项目结构

首先，请确认您的项目目录结构如下。如果缺少某个目录或文件，请创建它：

```
项目根目录/
├── frontend/             # 前端React代码
├── netlify/              # Netlify Functions目录
│   ├── functions/        # 函数文件
│   │   ├── utils/        # 工具函数
│   │   │   ├── db.js     # 数据库连接
│   │   │   └── jwt.js    # JWT处理
│   │   ├── api/          # API路由
│   │   └── initdb.js     # 数据库初始化
├── .env                  # 环境变量配置（本地开发用）
└── netlify.toml          # Netlify配置文件
```

### 2. 安装必要的软件

**Windows用户**：

1. 安装[Git](https://git-scm.com/downloads)
2. 安装[Node.js](https://nodejs.org/zh-cn/download/)（选择LTS版本）
3. 安装[GitHub Desktop](https://desktop.github.com/)（可选，图形界面）

**Mac用户**：

1. 安装[Homebrew](https://brew.sh/)
2. 使用Homebrew安装Git和Node.js：`brew install git node`

安装完成后，可以在命令行中验证：

```bash
# Windows用户打开PowerShell或命令提示符
# Mac用户打开终端
git --version
node --version
npm --version
```

## 🔧 本地设置

### 1. 克隆项目代码

如果您还没有项目代码，可以克隆它：

```bash
# 请将以下命令中的URL替换为您的实际仓库URL
git clone https://github.com/您的用户名/您的仓库名.git
cd 您的仓库名
```

如果您已经有代码在本地，请跳过这一步。

### 2. 安装依赖

#### 安装前端依赖

```bash
# 进入前端目录
cd frontend

# 安装依赖包
npm install

# 返回根目录
cd ..
```

#### 安装Netlify CLI（用于本地测试）

```bash
# 全局安装Netlify CLI
npm install -g netlify-cli
```

### 3. 配置环境变量

创建或编辑`.env`文件，添加以下内容：

```env
# 数据库连接信息
MYSQL_HOST=mysql2.sqlpub.com
MYSQL_PORT=3307
MYSQL_USER=zjxlwk
MYSQL_PASSWORD=r3Jykp3NHO9ehFuS
MYSQL_DATABASE=zjxlwk_database

# JWT配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=24h

# 数据库初始化密钥（用于首次部署）
INIT_DB_SECRET=your_init_db_secret_key
```

**提示**：对于本地开发，您可以使用简单的密钥。但在生产环境中，请使用更复杂的密钥。

### 4. 本地测试

使用Netlify CLI在本地启动项目，确保一切正常：

```bash
# 在项目根目录运行
netlify dev
```

启动后，您可以在浏览器中访问：http://localhost:8888

如果看到前端页面，说明本地环境配置成功！

## 🚀 部署到Netlify

### 步骤1：准备代码仓库

1. **创建GitHub账户**（如果没有）：访问[GitHub](https://github.com/)注册账号

2. **创建新仓库**：
   - 登录GitHub
   - 点击右上角的"+"图标
   - 选择"New repository"
   - 填写仓库名称（例如：delivery-system）
   - 选择Public或Private
   - 点击"Create repository"

3. **将本地代码推送到GitHub**：
   ```bash
   # 在项目根目录执行
   
   # 初始化Git（如果还没有）
   git init
   
   # 添加远程仓库
   git remote add origin https://github.com/您的用户名/您的仓库名.git
   
   # 添加所有文件
   git add .
   
   # 提交更改
   git commit -m "Initial commit"
   
   # 推送到GitHub
   git push -u origin master
   ```

### 步骤2：登录Netlify

1. 访问[Netlify官网](https://www.netlify.com/)
2. 点击右上角的"Sign up"或"Log in"
3. 可以使用GitHub账号直接登录（推荐）

### 步骤3：创建新站点

1. 登录后，点击右上角的"New site from Git"

   ![Netlify New Site](https://res.cloudinary.com/dz5o03c8x/image/upload/v1628301593/netlify-new-site-button.png)

2. 选择"GitHub"作为Git提供商

3. 授权Netlify访问您的GitHub仓库

4. 从仓库列表中选择您的项目仓库

### 步骤4：配置构建设置

在构建配置页面，保持默认设置（这些设置已在netlify.toml中配置）：

- **Build command**: `cd frontend && npm install && npm run build`
- **Publish directory**: `frontend/dist`
- **Functions directory**: `netlify/functions`

然后点击"Deploy site"按钮。

### 步骤5：设置环境变量

部署开始后，需要设置环境变量：

1. 在Netlify项目页面，点击"Site settings"

2. 侧边栏中找到"Build & deploy" → "Environment"

3. 点击"Edit variables"或"New variable"

4. 添加以下环境变量：

   | 变量名 | 值 |
   |--------|-----|
   | MYSQL_HOST | mysql2.sqlpub.com |
   | MYSQL_PORT | 3307 |
   | MYSQL_USER | zjxlwk |
   | MYSQL_PASSWORD | r3Jykp3NHO9ehFuS |
   | MYSQL_DATABASE | zjxlwk_database |
   | JWT_SECRET | 您的JWT密钥（生产环境请使用强密钥） |
   | INIT_DB_SECRET | 数据库初始化密钥 |

5. 点击"Save"

### 步骤6：重新部署

添加完环境变量后，需要重新部署项目以应用这些设置：

1. 回到项目页面
2. 点击"Deploys"选项卡
3. 点击"Trigger deploy" → "Deploy site"

### 步骤7：初始化数据库

部署完成后，需要初始化数据库表结构：

1. 复制您的Netlify站点URL（通常格式为：`https://您的站点名.netlify.app`）

2. 在浏览器中访问以下URL：
   ```
   https://您的站点名.netlify.app/.netlify/functions/initdb?secret=您的INIT_DB_SECRET
   ```

   例如：
   ```
   https://my-delivery-system.netlify.app/.netlify/functions/initdb?secret=my_secret_key_123
   ```

3. 如果看到类似`{"message": "Database tables initialized successfully"}`的响应，说明数据库初始化成功！

## ✅ 功能验证

部署完成后，请测试以下功能确保一切正常：

### 1. 访问网站

在浏览器中访问您的Netlify站点URL，确认前端页面正常加载。

### 2. 测试用户功能

- **注册新用户**：尝试注册派单员和接单员账号
- **登录**：使用注册的账号登录

### 3. 测试订单功能

- **创建订单**：以派单员身份创建新订单
- **查看待接单**：以接单员身份查看待接单列表
- **接单**：尝试接收一个订单
- **完成订单**：将已接的订单标记为完成

### 4. 检查数据

验证订单状态是否正确更新，用户信息是否保存正确。

## ❓ 常见问题排查

### 问题1：API请求失败

**解决方法**：
- 检查环境变量是否正确设置
- 查看Netlify Functions日志：在Netlify控制台中，点击"Functions" → 选择具体函数 → "Logs"
- 确保数据库连接信息正确

### 问题2：页面刷新404

**解决方法**：
- 确认netlify.toml中的重写规则正确
- 检查是否有`[[redirects]]`规则设置正确

### 问题3：数据库连接错误

**解决方法**：
- 验证SQLpub的连接信息是否正确
- 确认您的Netlify环境变量没有设置错误
- 检查数据库用户权限

### 问题4：本地开发时API调用失败

**解决方法**：
- 确保`netlify dev`命令正常运行
- 检查vite.config.js中的代理配置
- 验证.env文件中的环境变量

## 📝 部署后的维护

### 定期备份

虽然Netlify提供了部署历史，但建议定期备份：

1. 备份GitHub仓库
2. 定期导出数据库内容

### 更新依赖

定期更新依赖包以修复潜在的安全漏洞：

```bash
cd frontend
npm update
```

### 监控性能

在Netlify控制台中，可以查看站点性能和访问统计。

## 📚 常用命令参考

### Netlify CLI命令

```bash
# 登录Netlify
netlify login

# 本地开发服务器
netlify dev

# 部署到Netlify（不推荐，建议使用Git自动部署）
netlify deploy

# 查看部署日志
netlify logs
```

### Git命令参考

```bash
# 克隆仓库
git clone 仓库URL

# 添加文件到暂存区
git add .

# 提交更改
git commit -m "提交信息"

# 推送到远程仓库
git push

# 拉取最新代码
git pull
```

---

恭喜！您已经成功将项目部署到Netlify平台。如果在部署过程中遇到任何问题，请参考常见问题排查部分，或在Netlify的社区论坛寻求帮助。