// scripts/fetch-html5games-simple.js - 简化版爬虫

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置
const CONFIG = {
  // 游戏源URL
  sourceUrl: 'https://html5games.com/All-Games',
  // 输出文件
  outputFile: path.join(__dirname, '..', 'html5games_imported.json'),
  // 最大游戏数量(0表示不限制)
  maxGames: 0,
  // 日志文件
  logFile: path.join(__dirname, 'fetch-log.txt'),
  // 保存状态文件
  stateFile: path.join(__dirname, 'fetch-state.json'),
  // 是否增量模式(跳过已抓取的游戏)
  incremental: false
};

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(CONFIG.logFile, logMessage);
}

// 主抓取函数
async function fetchGames() {
  log('开始从HTML5Games网站获取游戏数据...');
  
  // 加载已保存状态(如果存在)
  let processedUrls = [];
  try {
    if (fs.existsSync(CONFIG.stateFile) && CONFIG.incremental) {
      const state = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
      processedUrls = state.processedUrls || [];
      log(`已加载${processedUrls.length}个已处理URL的状态`);
    }
  } catch (error) {
    log(`加载状态文件出错: ${error.message}`);
  }
  
  // 初始化浏览器
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials'
    ]
  });
  
  try {
    // 创建新页面
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 访问游戏列表页面
    log(`正在访问 ${CONFIG.sourceUrl}`);
    await page.goto(CONFIG.sourceUrl, { waitUntil: 'networkidle2' });
    
    // 获取所有游戏链接
    const gameLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*="/Game/"]').forEach(link => {
        links.push(link.href);
      });
      return links;
    });
    
    // 去重并限制数量
    const uniqueLinks = [...new Set(gameLinks)];
    const limit = CONFIG.maxGames > 0 ? Math.min(uniqueLinks.length, CONFIG.maxGames) : uniqueLinks.length;
    
    log(`找到 ${uniqueLinks.length} 个游戏链接，将处理 ${limit} 个`);
    
    // 保存页面调试信息
    fs.writeFileSync(path.join(__dirname, 'links-debug.json'), JSON.stringify(uniqueLinks.slice(0, limit), null, 2));
    
    // 收集游戏数据
    const games = [];
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < limit; i++) {
      const gameLink = uniqueLinks[i];
      
      // 如果是增量模式且已处理过，则跳过
      if (CONFIG.incremental && processedUrls.includes(gameLink)) {
        log(`跳过已处理的游戏: ${gameLink}`);
        skipCount++;
        continue;
      }
      
      log(`处理游戏 ${i+1}/${limit}: ${gameLink}`);
      
      try {
        // 打开游戏详情页
        await page.goto(gameLink, { waitUntil: 'networkidle2' });
        
        // 保存当前页面HTML用于调试
        if (i === 0) {
          const html = await page.content();
          fs.writeFileSync(path.join(__dirname, 'page-debug.html'), html);
        }
        
        // 从页面提取游戏数据
        const gameData = await page.evaluate(() => {
          // 从页面标题提取游戏名称
          let title = document.title.replace(' Game - Play for free on HTML5Games.com', '').trim();
          
          // 获取Play按钮链接
          const playBtn = document.querySelector('a.play-btn, a.btn-highlight.play-btn, .play-btn-container a');
          const playUrl = playBtn ? playBtn.href : '';
          
          // 获取缩略图 - 修复版本
          let imgSrc = '';
          // 首先尝试从Open Graph元标签获取图片
          const ogImage = document.querySelector('meta[property="og:image"]');
          if (ogImage && ogImage.getAttribute('content')) {
            imgSrc = ogImage.getAttribute('content');
          } else {
            // 如果没有OG标签，尝试从其他地方获取
            const imgEl = document.querySelector('.game-image img, .game-thumbnail img, .game img');
            if (imgEl && imgEl.src) {
              imgSrc = imgEl.src;
            }
          }

          // 如果还是没有图片，尝试查找所有img标签
          if (!imgSrc) {
            const allImages = Array.from(document.querySelectorAll('img'));
            // 查找看起来像游戏缩略图的图片
            const gameImage = allImages.find(img => {
              const src = img.src || '';
              return src.includes('teaser') || src.includes('thumbnail') || src.includes('preview');
            });
            
            if (gameImage && gameImage.src) {
              imgSrc = gameImage.src;
            } else if (allImages.length > 0) {
              // 如果还是没找到，使用第一张图片
              const firstValidImage = allImages.find(img => img.src && img.src.startsWith('http'));
              if (firstValidImage) {
                imgSrc = firstValidImage.src;
              }
            }
          }
          
          // 获取分类
          const categories = [];
          document.querySelectorAll('.game-categories a, .game-tags a').forEach(cat => {
            const category = cat.textContent.trim();
            if (category) categories.push(category);
          });
          
          // 获取描述
          let description = '';
          const descEl = document.querySelector('.game-description');
          if (descEl) {
            description = descEl.textContent.trim();
          }
          
          return {
            title,
            playUrl,
            imgSrc,
            categories,
            description,
            pageUrl: window.location.href
          };
        });
        
        // 如果没有提取到标题或游戏链接，则跳过
        if (!gameData.title || !gameData.playUrl) {
          log(`跳过无效游戏数据: ${gameLink} (没有找到标题或游戏链接)`);
          continue;
        }
        
        // 确保URL使用HTTPS
        if (gameData.playUrl.startsWith('//')) {
          gameData.playUrl = 'https:' + gameData.playUrl;
        }
        
        // 处理游戏类型
        const primaryType = gameData.categories[0] || 'Casual';
        
        // 处理图片URL
        let thumbUrl = gameData.imgSrc || '';
        
        // 从游戏URL中提取游戏ID，用于构建更好的缩略图URL
        let gameId = '';
        try {
          // 从Famobi游戏URL提取游戏ID
          const urlMatch = gameData.playUrl.match(/\/wrapper\/([^\/]+)\/A1000-10/);
          if (urlMatch && urlMatch[1]) {
            gameId = urlMatch[1];
            
            // 使用正确的Famobi缩略图格式
            // 将游戏ID转换为驼峰式命名，首字母大写
            const gameIdCamel = gameId.split('-').map(part => 
              part.charAt(0).toUpperCase() + part.slice(1)
            ).join('');
            
            // 构建Famobi格式的缩略图URL
            thumbUrl = `https://img.cdn.famobi.com/portal/html5games/images/tmp/${gameIdCamel}Teaser.jpg?v=0.2-e9a56fac`;
            log(`使用Famobi缩略图: ${thumbUrl}`);
            
            // 确保使用的是正确的缩略图格式
            // Giant-Rush -> GiantRushTeaser.jpg
            // Crazy-Roll -> CrazyRollTeaser.jpg
            // Braindom -> BraindomTeaser.jpg
          } else {
            // 如果无法从URL提取游戏ID，则使用默认图片
            thumbUrl = 'https://img.cdn.famobi.com/portal/html5games/images/html5games_logo.png?v=0.2-e9a56fac';
            log(`无法提取游戏ID，使用Famobi默认LOGO`);
          }
        } catch (urlError) {
          log(`从URL提取游戏ID失败: ${urlError.message}`);
          // 使用Famobi默认图片
          thumbUrl = 'https://img.cdn.famobi.com/portal/html5games/images/html5games_logo.png?v=0.2-e9a56fac';
        }
        
        // 如果仍然没有获取到缩略图，使用默认图片
        if (!thumbUrl) {
          thumbUrl = 'https://img.cdn.famobi.com/portal/html5games/images/html5games_logo.png?v=0.2-e9a56fac';
          log(`使用Famobi默认图片: ${gameLink}`);
        }
        
        // 创建游戏对象，符合系统格式
        const game = {
          title: gameData.title,
          type: primaryType,
          // 嵌入游戏URL - 这是实际可玩的游戏URL
          embedUrl: gameData.playUrl,
          // 缩略图URL
          thumbUrl: thumbUrl,
          // 游戏打开模式
          openMode: "redirect",
          // 游戏标签（热门/新游戏等）
          tag: "",
          // 原始游戏页面URL
          originalUrl: gameData.pageUrl,
          // 游戏描述
          description: gameData.description || `${gameData.title} - 一款有趣的在线游戏，立即免费体验！`,
          // 游戏来源
          source: "html5games.com",
          // 游戏分类
          categories: gameData.categories
        };
        
        games.push(game);
        processedUrls.push(gameLink); // 添加到已处理列表
        
        // 每处理10个游戏保存一次状态
        if (games.length % 10 === 0) {
          const state = { processedUrls };
          fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
          log(`已保存抓取状态到 ${CONFIG.stateFile}`);
          
          // 同时也保存当前游戏数据
          fs.writeFileSync(CONFIG.outputFile, JSON.stringify(games, null, 2));
          log(`已保存${games.length}个游戏数据到 ${CONFIG.outputFile}`);
        }
        
        successCount++;
        log(`成功添加游戏: ${game.title} (${primaryType})`);
        
      } catch (gameError) {
        log(`处理游戏出错 ${gameLink}: ${gameError.message}`);
        errorCount++;
      }
      
      // 为了避免被封IP，增加随机延迟
      const delay = 1500 + Math.floor(Math.random() * 1000);
      log(`等待 ${delay}ms 后继续`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    log(`抓取完成统计:`);
    log(`- 成功: ${successCount} 个游戏`);
    log(`- 失败: ${errorCount} 个游戏`);
    log(`- 跳过: ${skipCount} 个游戏`);
    log(`- 总计处理: ${successCount + errorCount + skipCount} 个游戏`);
    
    // 保存到JSON文件
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(games, null, 2));
    log(`已保存游戏数据到 ${CONFIG.outputFile}`);
    
    // 清理状态文件(如果所有游戏都处理完毕)
    if (fs.existsSync(CONFIG.stateFile)) {
      fs.unlinkSync(CONFIG.stateFile);
      log(`已删除抓取状态文件`);
    }
    
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
    log(`设置最大游戏数量为: ${CONFIG.maxGames}`);
  }
}

// 检查是否为增量模式
if (args.includes('--incremental')) {
  CONFIG.incremental = true;
  log('启用增量模式，将跳过已处理的游戏');
}

// 执行抓取
(async () => {
  try {
    const games = await fetchGames();
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