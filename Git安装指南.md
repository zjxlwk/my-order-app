# Git安装指南（Windows系统）

## 下载Git

1. 打开浏览器，访问官方Git下载页面：https://git-scm.com/download/win
2. 网站会自动检测您的Windows系统版本（32位或64位）并提供相应的下载链接
3. 点击下载链接，保存Git安装程序到您的电脑上

## 安装Git

1. 找到并双击下载好的Git安装程序（通常名为Git-x.x.x.x-64-bit.exe或类似名称）
2. 在安装向导中，按照以下步骤操作：

   - **欢迎界面**：点击「Next」继续
   - **选择安装位置**：可以使用默认位置或选择您喜欢的安装路径，然后点击「Next」
   - **选择组件**：
     - 确保勾选「Git GUI Here」
     - 确保勾选「Git Bash Here」
     - 其他选项可以保持默认，然后点击「Next」
   - **选择开始菜单文件夹**：使用默认选项，点击「Next」
   - **选择默认编辑器**：建议选择「Use Visual Studio Code as Git's default editor」（如果已安装VS Code），或者使用默认的Vim，然后点击「Next」
   - **调整PATH环境变量**：选择「Git from the command line and also from 3rd-party software」，这样可以在命令提示符和PowerShell中使用Git，点击「Next」
   - **选择HTTPS传输后端**：使用默认选项「Use the OpenSSL library」，点击「Next」
   - **配置行尾转换**：选择「Checkout Windows-style, commit Unix-style line endings」，点击「Next」
   - **配置终端模拟器**：选择「Use Windows' default console window」，点击「Next」
   - **配置额外选项**：
     - 勾选「Enable file system caching」
     - 勾选「Enable Git Credential Manager」
     - 点击「Next」
   - **实验性功能**：可以保持默认，点击「Install」开始安装

3. 等待安装完成，然后点击「Finish」关闭安装向导

## 验证安装

1. 安装完成后，打开命令提示符（CMD）或PowerShell
2. 输入以下命令并按回车：
   ```
   git --version
   ```
3. 如果安装成功，您将看到Git的版本信息，例如：
   ```
   git version 2.40.0.windows.1
   ```

## 配置Git用户信息

安装完成后，需要配置您的用户名和邮箱，这样提交代码时Git就知道是谁做的修改：

1. 在命令提示符或PowerShell中，依次输入以下命令。**请确保移除尖括号，并替换为您实际的GitHub用户名和邮箱**：
   
   例如，如果您的GitHub用户名是`testuser`，邮箱是`test@example.com`，则输入：
   ```
   git config --global user.name "testuser"
   git config --global user.email "test@example.com"
   ```
   
   注意：请不要保留尖括号`<>`，直接使用您的实际用户名和邮箱，并用英文双引号包围。

2. 验证配置是否成功：
   ```
   git config --global --list
   ```

您应该能看到列出的用户名和邮箱信息。

## 故障排除

如果安装后仍然无法使用Git命令，请检查：

1. 是否正确选择了「Git from the command line and also from 3rd-party software」选项
2. 是否需要重启电脑以更新环境变量
3. 如果仍然有问题，可能需要手动配置环境变量

完成安装后，您就可以继续项目的Git初始化和GitHub上传流程了。