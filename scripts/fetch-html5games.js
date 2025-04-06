// scripts/fetch-html5games.js - 优化版本

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置
const CONFIG = {
  // 游戏源URL
  sourceUrl: 'https://html5games.com/All-Games',
  // 临时输出文件
  outputFile: path.join(__dirname, '..', 'html5games_imported.json'),
  // 最大游戏数量 (0表示不限制)
  maxGames: 20,
  // 日志文件
  logFile: path.join(__dirname, 'fetch-log.txt'),
};

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(CONFIG.logFile, logMessage);
}

// 主抓取函数
async function fetchHTML5Games() {
  log('开始从HTML5Games网站获取游戏数据...');
  
  // 初始化浏览器
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // 设置超时时间
  page.setDefaultNavigationTimeout(60000);
  
  try {
    // 1. 访问游戏列表页面
    log(`正在访问 ${CONFIG.sourceUrl}`);
    await page.goto(CONFIG.sourceUrl, { waitUntil: 'networkidle2' });
    
    // 获取所有游戏链接 (href属性)
    const gameLinks = await page.evaluate(() => {
      const links = [];
      // 查找所有包含/Game/的链接，这些是游戏详情页链接
      document.querySelectorAll('a[href*="/Game/"]').forEach(link => {
        links.push(link.href);
      });
      return links;
    });
    
    const uniqueLinks = [...new Set(gameLinks)]; // 去重
    const limit = CONFIG.maxGames > 0 ? Math.min(uniqueLinks.length, CONFIG.maxGames) : uniqueLinks.length;
    
    log(`找到 ${uniqueLinks.length} 个游戏链接，将处理 ${limit} 个`);
    
    // 收集游戏数据
    const games = [];
    
    for (let i = 0; i < limit; i++) {
      const gameLink = uniqueLinks[i];
      log(`处理游戏 ${i+1}/${limit}: ${gameLink}`);
      
      try {
        // 2. 打开游戏详情页
        await page.goto(gameLink, { waitUntil: 'networkidle2' });
        
        // 3. 提取游戏数据，特别是textarea中的嵌入代码
        const gameData = await page.evaluate(() => {
          // 获取游戏标题
          const title = document.querySelector('h1')?.textContent?.trim() || '';
          
          // 获取textarea中的嵌入代码
          const textarea = document.querySelector('textarea');
          const embedCode = textarea ? textarea.value : '';
          
          // 从嵌入代码中提取iframe src链接
          let iframeSrc = '';
          if (embedCode) {
            const match = embedCode.match(/src=["']([^"']+)["']/);
            if (match && match[1]) {
              iframeSrc = match[1];
            }
          }
          
          // 获取缩略图地址
          const imgSrc = document.querySelector('.game-image img')?.src || '';
          
          // 获取游戏分类
          const categories = [];
          document.querySelectorAll('.game-categories a').forEach(cat => {
            categories.push(cat.textContent.trim());
          });
          
          // 获取游戏描述
          const description = document.querySelector('.game-description')?.textContent?.trim() || '';
          
          return {
            title,
            embedCode,
            iframeSrc,
            imgSrc,
            categories,
            description,
            originalUrl: window.location.href
          };
        });
        
        // 跳过没有标题或iframe链接的游戏
        if (!gameData.title || !gameData.iframeSrc) {
          log(`跳过无效游戏数据: ${gameLink} (没有找到标题或iframe链接)`);
          continue;
        }
        
        // 处理游戏类型
        const primaryType = gameData.categories[0] || 'Casual';
        
        // 创建游戏对象，符合系统格式
        const game = {
          title: gameData.title,
          description: gameData.description || `${gameData.title} - 一款有趣的在线游戏，立即免费体验！`,
          url: gameData.iframeSrc,  // 从textarea提取的iframe src
          thumbnail: gameData.imgSrc,  // 缩略图地址
          originalUrl: gameData.originalUrl,  // 原始游戏页面URL
          type: primaryType,  // 主要游戏类型
          tags: gameData.categories,  // 所有游戏分类作为标签
          featured: false,
          openMode: "iframe"  // 使用iframe模式打开
        };
        
        games.push(game);
        log(`成功添加游戏: ${game.title} (${primaryType})`);
        
      } catch (gameError) {
        log(`处理游戏出错 ${gameLink}: ${gameError.message}`);
      }
      
      // 避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log(`成功获取 ${games.length} 个游戏`);
    
    // 保存到临时JSON文件
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(games, null, 2));
    log(`已保存游戏数据到 ${CONFIG.outputFile}`);
    
    return games;
  } catch (error) {
    log(`抓取过程中出错: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
    log('浏览器已关闭，抓取过程结束');
  }
}

// 解析命令行参数
const args = process.argv.slice(2);
const maxGamesArg = args.find(arg => arg.startsWith('--games='));
if (maxGamesArg) {
  const maxGames = parseInt(maxGamesArg.split('=')[1]);
  if (!isNaN(maxGames) && maxGames > 0) {
    CONFIG.maxGames = maxGames;
    console.log(`设置最大游戏数量为: ${CONFIG.maxGames}`);
  }
}

// 执行抓取
(async () => {
  try {
    const games = await fetchHTML5Games();
    log(`===============================================`);
    log(`抓取完成! 获取了 ${games.length} 个游戏。`);
    log(`数据已保存到 ${CONFIG.outputFile}`);
    log(`请在管理界面中使用"导入JSON"功能导入这些游戏`);
    log(`然后点击"自动同步并转换"按钮完成处理`);
    log(`===============================================`);
  } catch (error) {
    log(`抓取过程失败: ${error.message}`);
    process.exit(1);
  }
})();