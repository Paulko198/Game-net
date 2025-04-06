# 游戏数据同步指南

本文档提供了两种同步游戏数据的方案：浏览器端同步和Node.js自动同步。

## 方案一：浏览器端同步（简单快速）

这种方式不需要任何额外设置，直接在浏览器中操作。

### 使用步骤：

1. 打开您的本地服务器：http://localhost:8000
2. 导航到管理页面：http://localhost:8000/admin/game-manager.html
3. 点击"自动同步并转换"按钮
4. 在弹出的对话框中输入源游戏管理页面URL（默认为http://localhost:8000/admin/game-manager.html）
5. 输入静态页面的基础URL（默认为http://localhost:8000/games/）
6. 等待同步完成，系统会自动下载一个包含所有静态页面的ZIP文件
7. 解压ZIP文件到您的网站根目录

### 特点：
- 无需安装任何依赖
- 操作简单直观
- 适合临时或偶尔同步
- 可以立即下载静态页面

## 方案二：Node.js自动同步（自动化）

这种方式使用Node.js脚本实现完全自动化同步，适合定期更新。

### 安装依赖：

```bash
# 安装所需的npm包
npm install
```

### 使用方法：

1. **一次性同步**：

```bash
npm run sync:once
```

2. **指定源URL和输出目录**：

```bash
node scripts/sync-games.js http://example.com/admin/game-manager.html ./games
```

3. **自动定时同步**（每小时执行一次）：

```bash
npm run sync:auto
```

### 配置选项：

您可以在`scripts/sync-games.js`文件中修改以下配置选项：

```javascript
const CONFIG = {
  // 源URL (可通过命令行参数覆盖)
  sourceUrl: 'http://localhost:8000/admin/game-manager.html',
  // 输出目录 (可通过命令行参数覆盖)
  outputDir: path.join(__dirname, '..', 'games'),
  // 静态页面基础URL
  baseStaticUrl: '/games/',
  // 是否备份原始数据
  backupData: true,
  // 备份目录
  backupDir: path.join(__dirname, '..', 'backups'),
  // 日志文件
  logFile: path.join(__dirname, 'sync-log.txt')
};
```

### 特点：
- 完全自动化
- 支持定时执行
- 自动备份数据
- 生成日志
- 可以集成到CI/CD流程

## 设置为系统定时任务

### Windows（使用任务计划程序）：

1. 打开任务计划程序
2. 创建基本任务
3. 设置触发器为每日或每小时
4. 操作选择"启动程序"
5. 程序位置选择：`npm`
6. 添加参数：`run sync`
7. 起始位置：您的项目目录路径

### Linux/Mac（使用crontab）：

```bash
# 编辑crontab
crontab -e

# 添加以下行，每小时执行一次同步
0 * * * * cd /path/to/your/project && npm run sync
```

## 排除故障

如果遇到问题，请检查：

1. `sync-log.txt`文件中的错误信息
2. 确保源网站可以访问
3. 检查网络连接和防火墙设置
4. 确保已安装所有依赖

## 数据备份

同步脚本会自动在`backups`目录下创建游戏数据的备份，命名格式为`games-backup-YYYY-MM-DDTHH-MM-SS.json`。

## 注意事项

1. 首次运行前，请确保已安装Node.js v14或更高版本
2. 使用自动同步功能时，建议先手动测试一次
3. 定时任务可能需要管理员权限
4. 如果源网站需要登录认证，可能需要修改脚本添加认证信息 