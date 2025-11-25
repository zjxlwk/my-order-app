# 项目维护与更新指南

## 1. 项目概述

**项目名称**：订单配送系统
**GitHub 仓库**：https://github.com/zjxlwk/my-order-app.git
**Netlify 站点**：https://zjxlwk.netlify.app/

## 2. 代码更新与部署流程

### 2.1 本地修改代码

```bash
# 进入项目目录
cd c:\Users\皇皇网店\Desktop\1234

# 修改代码文件
# ... 进行代码编辑 ...
```

### 2.2 提交更改到本地Git仓库

**注意**：请在项目根目录 `c:\Users\皇皇网店\Desktop\1234` 下运行以下命令

```bash
# 查看更改状态
git status

# 添加所有更改到暂存区
git add .

# 提交更改
git commit -m "描述您的更改内容"
```

### 2.3 推送到GitHub远程仓库

**注意**：请在项目根目录 `c:\Users\皇皇网店\Desktop\1234` 下运行以下命令

```bash
# 推送到主分支
git push origin master
```

### 2.4 Netlify部署

**自动部署**：
- 当您将代码推送到GitHub后，Netlify通常会**自动**检测到更改并触发新的部署
- 您可以在Netlify控制面板中监控部署进度

**手动部署**：
- 登录Netlify控制面板：https://app.netlify.com
- 选择您的站点（zjxlwk）
- 点击 "Deploys" 选项卡
- 点击 "Trigger deploy" → "Deploy site"

## 3. 数据库管理

### 3.1 数据库初始化

**仅在首次部署或数据库结构更改时执行！**

```
# 数据库初始化URL格式
https://zjxlwk.netlify.app/.netlify/functions/initdb?secret=zjxlwk_database_init_secret_2024!
```

**成功响应**：
```json
{"message":"Database tables initialized successfully"}
```

### 3.2 数据库更新注意事项

- **常规代码更新**：不需要重新初始化数据库
- **数据库结构更改**：
  - 当添加新表、修改字段时，需要创建数据库迁移脚本
  - 生产环境建议使用专业的数据库迁移工具
  - 避免直接删除表或字段，可能导致数据丢失

## 4. 环境变量管理

所有环境变量需要在Netlify控制面板中设置：

1. 登录Netlify控制面板
2. 选择站点 → Site settings → Build & deploy → Environment
3. 配置以下关键环境变量：

   - `INIT_DB_SECRET`：`zjxlwk_database_init_secret_2024!`
   - `MYSQL_HOST`：数据库主机地址
   - `MYSQL_PORT`：数据库端口
   - `MYSQL_USER`：数据库用户名
   - `MYSQL_PASSWORD`：数据库密码
   - `MYSQL_DATABASE`：数据库名称

## 5. 常见问题与排查

### 5.1 数据库连接错误
- 检查环境变量是否正确设置
- 验证数据库服务是否运行
- 检查网络连接和防火墙设置

### 5.2 部署失败
- 查看Netlify部署日志获取详细错误信息
- 确保package.json中的依赖项正确
- 检查构建命令是否正确配置

### 5.3 函数执行错误
- 查看Netlify Functions日志
- 确认代码中没有语法错误
- 检查依赖项是否已安装

## 6. 版本历史

- **初始部署**：创建项目结构和基础功能
- **数据库修复**：修复initTables函数导出问题

---

**最后更新时间**：2024年
**维护人员**：您的名字
