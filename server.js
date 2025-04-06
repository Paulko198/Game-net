const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 定义静态文件目录
const STATIC_DIR = path.join(__dirname);

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置CORS头，允许来自任何源的请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 处理保存游戏JSON数据的请求
  if (req.method === 'POST' && req.url === '/save-games-json') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // 验证JSON数据格式
        const games = JSON.parse(body);
        
        if (!Array.isArray(games)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: '数据必须是游戏数组' }));
          return;
        }
        
        // 在写入前先备份当前文件
        const outputFile = path.join(__dirname, 'allpopulargames_games.json');
        let backupSuccess = false;
        
        if (fs.existsSync(outputFile)) {
          try {
            const backupDir = path.join(__dirname, 'backups');
            if (!fs.existsSync(backupDir)) {
              fs.mkdirSync(backupDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `games_backup_${timestamp}.json`);
            fs.copyFileSync(outputFile, backupFile);
            backupSuccess = true;
            console.log(`文件已备份到 ${backupFile}`);
          } catch (backupError) {
            console.error('备份文件失败:', backupError);
            // 备份失败不阻止后续操作
          }
        }
        
        // 保存到项目根目录
        fs.writeFileSync(outputFile, JSON.stringify(games, null, 2));
        
        console.log(`保存了 ${games.length} 个游戏到 ${outputFile}`);
        
        // 运行同步脚本自动更新静态页面
        console.log('开始运行同步脚本...');
        exec('npm run sync', (error, stdout, stderr) => {
          if (error) {
            console.error(`执行同步脚本出错: ${error}`);
            // 同步失败时不影响接口返回
          } else {
            console.log(`同步脚本输出: ${stdout}`);
            if (stderr) console.error(`同步脚本错误: ${stderr}`);
          }
        });
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          success: true, 
          message: `已保存 ${games.length} 个游戏${backupSuccess ? ' (已备份原数据)' : ''}`,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('保存游戏数据失败:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: '服务器处理请求时出错: ' + error.message }));
      }
    });
    
    return;
  }

  // 处理静态文件请求
  const filePath = req.url === '/'
    ? path.join(STATIC_DIR, 'index.html')
    : path.join(STATIC_DIR, req.url);
  
  // 处理带查询参数的URL
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  let cleanPath = urlObj.pathname;
  
  // 如果是根路径，默认指向index.html
  if (cleanPath === '/') {
    cleanPath = '/index.html';
  }
  
  // 构建实际文件路径，忽略查询参数
  const actualFilePath = path.join(STATIC_DIR, cleanPath);
  
  fs.readFile(actualFilePath, (err, data) => {
    if (err) {
      console.error(`文件未找到: ${actualFilePath}`);
      res.statusCode = 404;
      res.end('File not found');
      return;
    }
    
    // 设置内容类型
    const ext = path.extname(actualFilePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpeg';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.end(data);
  });
});

// 设置端口
const PORT = process.env.PORT || 8000;

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`游戏管理页面: http://localhost:${PORT}/admin/game-manager.html`);
}); 