/**
 * 游戏数据自动同步脚本
 * 
 * 功能：
 * 1. 从源服务器获取游戏数据
 * 2. 将游戏链接转换为本地静态页面链接
 * 3. 生成静态HTML页面
 * 4. 可选：备份和版本控制
 * 
 * 使用方法:
 * node sync-games.js [sourceUrl] [outputDir] [jsonFile]
 * 
 * 例如:
 * node sync-games.js http://example.com/admin/game-manager.html ../games games-data.json
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const puppeteer = require('puppeteer');

// 配置选项
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
  logFile: path.join(__dirname, 'sync-log.txt'),
  // 游戏数据JSON文件 (可通过命令行参数覆盖)
  jsonFile: path.join(__dirname, '..', 'allpopulargames_games.json')
};

// 命令行参数处理
if (process.argv.length > 2) {
  CONFIG.sourceUrl = process.argv[2];
}
if (process.argv.length > 3) {
  CONFIG.outputDir = process.argv[3];
}
if (process.argv.length > 4) {
  CONFIG.jsonFile = process.argv[4];
}

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`创建目录: ${dir}`);
  }
}

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(CONFIG.logFile, logMessage);
}

// 从源服务器获取游戏数据
async function fetchGamesData(sourceUrl) {
  log(`开始从 ${sourceUrl} 获取游戏数据...`);
  
  try {
    // 先尝试使用Puppeteer获取localStorage数据
    try {
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // 添加这些参数解决权限问题
      });
      const page = await browser.newPage();
      
      // 访问源页面
      await page.goto(sourceUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      
      // 添加调试信息
      log(`页面加载完成，尝试读取localStorage...`);
      
      // 从localStorage中提取游戏数据
      const gamesData = await page.evaluate(() => {
        try {
          const data = localStorage.getItem('allpopulargames_games');
          console.log('localStorage数据:', data);
          return data ? JSON.parse(data) : [];
        } catch (e) {
          console.error('读取localStorage失败:', e);
          return [];
        }
      });
      
      await browser.close();
      
      if (gamesData && gamesData.length > 0) {
        log(`成功从localStorage获取 ${gamesData.length} 个游戏数据`);
        
        // 备份原始数据
        if (CONFIG.backupData) {
          backupGamesData(gamesData);
        }
        
        return gamesData;
      } else {
        log('从localStorage获取游戏数据失败或为空，尝试从JSON文件获取...');
      }
    } catch (error) {
      log(`访问localStorage失败: ${error.message}，尝试从JSON文件获取...`);
    }
    
    // 如果从localStorage获取失败，尝试从JSON文件获取
    if (fs.existsSync(CONFIG.jsonFile)) {
      const jsonData = fs.readFileSync(CONFIG.jsonFile, 'utf8');
      const gamesData = JSON.parse(jsonData);
      
      if (gamesData && gamesData.length > 0) {
        log(`成功从JSON文件获取 ${gamesData.length} 个游戏数据`);
        
        // 备份原始数据
        if (CONFIG.backupData) {
          backupGamesData(gamesData);
        }
        
        return gamesData;
      } else {
        throw new Error('JSON文件中没有有效的游戏数据');
      }
    } else {
      throw new Error('找不到游戏数据JSON文件');
    }
  } catch (error) {
    log(`获取游戏数据失败: ${error.message}`);
    throw error;
  }
}

// 备份游戏数据
function backupGamesData(gamesData) {
  ensureDir(CONFIG.backupDir);
  
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupFile = path.join(CONFIG.backupDir, `games-backup-${timestamp}.json`);
  
  fs.writeFileSync(backupFile, JSON.stringify(gamesData, null, 2));
  log(`游戏数据已备份到: ${backupFile}`);
}

// 转换游戏链接为本地静态页面链接
function convertGameUrls(games) {
  return games.map(game => {
    const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newGame = {...game};
    
    // 如果没有embedUrl字段但有url字段，则将url作为embedUrl
    if (!newGame.embedUrl && newGame.url) {
      newGame.embedUrl = newGame.url;
    }
    
    // 确保嵌入URL正确添加参数，但避免重复添加
    if (newGame.embedUrl) {
      // 清除任何可能存在的重复ref参数
      let cleanUrl = newGame.embedUrl;
      // 移除所有现有的ref=allpopulargames参数
      while (cleanUrl.includes('ref=allpopulargames')) {
        cleanUrl = cleanUrl.replace(/([?&])ref=allpopulargames(&|$)/, (match, p1, p2) => {
          return p2 === '&' ? p1 : '';
        });
      }
      
      // 添加单个ref参数
      if (cleanUrl.includes('?')) {
        newGame.embedUrl = `${cleanUrl}&ref=allpopulargames`;
      } else {
        newGame.embedUrl = `${cleanUrl}?ref=allpopulargames`;
      }
    }
    
    // 保存原始URL（可能是游戏的详情页面URL）
    if (!newGame.originalUrl && newGame.url) {
      newGame.originalUrl = newGame.url;
    }
    
    // 如果原始URL支持添加参数，添加返回URL参数（同样避免重复）
    if (newGame.originalUrl) {
      // 清除任何可能存在的重复ref参数
      let cleanUrl = newGame.originalUrl;
      // 移除所有现有的ref=allpopulargames参数
      while (cleanUrl.includes('ref=allpopulargames')) {
        cleanUrl = cleanUrl.replace(/([?&])ref=allpopulargames(&|$)/, (match, p1, p2) => {
          return p2 === '&' ? p1 : '';
        });
      }
      
      // 添加单个ref参数
      if (cleanUrl.includes('?')) {
        newGame.originalUrl = `${cleanUrl}&ref=allpopulargames`;
      } else {
        newGame.originalUrl = `${cleanUrl}?ref=allpopulargames`;
      }
    }
    
    // 设置静态页面的URL
    newGame.url = `${CONFIG.baseStaticUrl}${gameSlug}.html`;
    
    // 确保在JSON输出中URL是正确的相对路径
    newGame.canonicalUrl = `https://allpopulargames.online/games/${gameSlug}.html`;
    
    // 确保type和categories保持一致
    if (newGame.type && (!newGame.categories || !Array.isArray(newGame.categories) || newGame.categories.length === 0)) {
      // 如果有type但没有categories，从type提取categories
      const types = newGame.type.split(/[,&\/]/).map(t => t.trim());
      newGame.categories = types.filter(t => t);
    } else if ((!newGame.type || newGame.type === '') && newGame.categories && Array.isArray(newGame.categories) && newGame.categories.length > 0) {
      // 如果没有type但有categories，使用第一个category作为type
      newGame.type = newGame.categories[0];
    }
    
    // 将所有游戏的打开模式统一设置为redirect
    newGame.openMode = 'redirect';
    return newGame;
  });
}

// 生成静态HTML页面
function generateStaticPages(games) {
  ensureDir(CONFIG.outputDir);
  
  let generatedCount = 0;
  
  games.forEach(game => {
    const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // 生成常规游戏详情页
    const htmlContent = createGamePageTemplate(game);
    const outputFile = path.join(CONFIG.outputDir, `${gameSlug}.html`);
    fs.writeFileSync(outputFile, htmlContent);
    
    // 生成全屏游戏页面
    const fullscreenContent = createFullscreenGameTemplate(game);
    const fullscreenFile = path.join(CONFIG.outputDir, `${gameSlug}-fullscreen.html`);
    fs.writeFileSync(fullscreenFile, fullscreenContent);
    
    generatedCount += 2; // 计数增加2（详情页和全屏页）
  });
  
  log(`成功生成 ${generatedCount} 个静态页面到 ${CONFIG.outputDir}`);
  
  // 生成索引JS文件
  const indexJsContent = createRedirectScript();
  fs.writeFileSync(path.join(CONFIG.outputDir, 'index.js'), indexJsContent);
  
  // 生成.htaccess文件
  const htaccessContent = createHtaccessRules();
  fs.writeFileSync(path.join(CONFIG.outputDir, '.htaccess'), htaccessContent);
  
  // 生成Cloudflare配置
  createCloudflareConfig();
}

// 生成游戏描述
function generateGameDescription(game) {
  const typeDescriptions = {
    'Puzzle': '挑战你的智力极限，解决各种谜题，享受益智挑战带来的乐趣。',
    'Action': '快节奏的动作游戏，测试你的反应速度和技巧。',
    'Arcade': '重温经典街机体验，简单上手但充满挑战。',
    'Racing': '感受速度与激情，在各种赛道上一展车技。',
    'Strategy': '制定完美策略，智取对手，考验你的战略思维。',
    'Shooting': '精准瞄准，射击目标，展示你的枪法技巧。',
    'Sports': '享受体育竞技的乐趣，成为场上的明星。',
    'Bubble Shooter': '经典泡泡射击游戏，瞄准、发射、消除泡泡，简单有趣。',
    'Card': '策略性卡牌游戏，组合卡牌，击败对手。',
    'Match 3': '连接三个或更多相同元素，触发特效和连击，挑战益智关卡。',
    'Quiz': '测试你的知识，回答各类问题，挑战极限，提升智力。',
    'Girls': '时尚设计、美妆造型、服装搭配和装扮类游戏，展现你的创意和设计才能。',
    'Jump & Run': '控制角色奔跑、跳跃、躲避障碍物，收集道具和金币，体验平台游戏的乐趣。',
    'Multiplayer': '与其他玩家一起游戏，体验多人互动和竞技的乐趣。',
    'Board': '体验经典棋盘游戏的乐趣，挑战你的策略思维。',
    'Casino': '体验赌场游戏的刺激，享受纸牌和轮盘等游戏带来的乐趣。',
    'Adventure': '探索未知世界，完成任务，体验精彩的冒险故事。',
    'Casual': '轻松休闲的游戏体验，简单有趣，随时可玩。',
    'RPG': '扮演角色，升级成长，体验丰富的角色扮演游戏世界。',
    'Simulation': '模拟真实场景和体验，让你在虚拟世界中体验各种职业和生活。',
    'Word': '挑战你的词汇量和语言能力，组合字母，找出单词。',
    'Trivia': '测试你的常识和知识面，回答各种领域的问题。',
    'Fighting': '与对手进行格斗对决，施展各种招式，取得胜利。',
    'Battle Royale': '在大型多人对战中，争夺最后的生存，成为战场上的赢家。'
  };
  
  // 获取游戏类型描述，如果没有匹配则使用默认描述
  let typeDesc = '一款有趣的在线游戏，随时随地畅玩。';
  
  for (const [type, desc] of Object.entries(typeDescriptions)) {
    if (game.type.includes(type)) {
      typeDesc = desc;
      break;
    }
  }
  
  // 根据游戏标签添加描述
  let tagDesc = '';
  if (game.tag === 'hot') {
    tagDesc = '这是目前最热门的游戏之一，受到众多玩家喜爱！';
  } else if (game.tag === 'new') {
    tagDesc = '这是新上线的游戏，快来体验最新游戏乐趣！';
  }
  
  // 组合描述
  return `《${game.title}》是一款精彩的${game.type}游戏。${typeDesc} ${tagDesc} 无需下载，直接在浏览器中即可开始游戏，支持电脑和手机设备。点击"开始游戏"立即体验！`;
}

// 生成扩展描述
function generateExtendedDescription(game) {
  // 根据游戏类型生成详细描述
  const typeExtendedDesc = {
    'Puzzle': `《${game.title}》是一款引人入胜的益智游戏，提供了丰富的谜题挑战。游戏画面精美，操作简单，但解谜过程充满挑战。无论你是休闲玩家还是益智游戏爱好者，都能在这款游戏中找到乐趣。随着关卡的推进，难度会逐渐增加，考验你的逻辑思维和问题解决能力。`,
    'Action': `《${game.title}》是一款节奏紧凑的动作游戏，需要玩家拥有敏捷的反应能力和精准的操作。游戏中充满了各种障碍和挑战，你需要灵活运用角色的各种技能来克服困难。每一关都设计精巧，带来全新的挑战体验。`,
    'Arcade': `《${game.title}》重现了经典街机游戏的乐趣，简单直接的游戏玩法让人容易上手，但要真正掌握却需要不断练习。游戏保留了街机游戏的精髓，同时加入了现代元素，让经典玩法焕发新生。`,
    'Shooting': `《${game.title}》是一款考验你射击精度和反应速度的游戏。玩家需要瞄准各种目标，击中得分。游戏提供了多种武器和场景，让射击体验更加丰富多样。适合喜欢刺激和挑战的玩家。`,
    'Bubble Shooter': `《${game.title}》是经典泡泡射击游戏的精彩演绎。通过发射彩色泡泡，将相同颜色的泡泡连接在一起并消除。游戏设计了多种关卡和挑战，随着游戏进行，难度会逐渐增加，考验你的策略和准确度。`,
    'Sports': `《${game.title}》将体育竞技的激情带到了屏幕上。游戏模拟了真实的体育比赛规则和物理效果，让你在虚拟世界中体验竞技的乐趣。操作简单，但要成为高手需要掌握技巧和策略。`,
    'Match 3': `《${game.title}》是一款经典的三消类益智游戏。游戏中，你需要连接三个或更多相同的元素来消除它们，触发特效和连击，获取高分。游戏界面色彩缤纷，玩法简单直观，但要获得高分，你需要制定策略，合理利用游戏中的各种道具和特殊元素。随着游戏的进行，挑战会不断增加，测试你的策略和观察能力。`,
    'Quiz': `《${game.title}》是一款知识性问答游戏，涵盖了多种领域的问题。从历史、地理、科学到娱乐、体育，应有尽有。游戏提供了多种难度级别，适合不同知识水平的玩家。每一轮问答都是对你知识储备的考验，同时也是一个学习新知识的机会。游戏界面友好，操作简单，让你在答题的过程中既增长知识，又获得乐趣。`,
    'Girls': `《${game.title}》是专为女生设计的精彩游戏。游戏提供了各种时尚、美妆、服装搭配和装饰等元素，让你尽情展现创意和设计才能。游戏界面精美，色彩丰富，充满少女风格，提供了多种场景和主题供你选择。无论你是喜欢打扮角色、设计服装，还是装饰房间，这款游戏都能满足你的创意需求，让你体验成为设计师的乐趣。`,
    'Jump & Run': `《${game.title}》是一款充满动感的跳跃跑酷游戏。在游戏中，你需要控制角色跳跃、奔跑、躲避障碍物，收集道具和金币。游戏关卡设计丰富多样，每一关都有不同的地形和挑战，让你的冒险之旅充满变化。游戏操作简单直观，但要完美通关，你需要精准的操作和反应能力。随着游戏的进行，难度会逐步提升，给你带来持续的挑战和成就感。`,
    'Card': `《${game.title}》是一款富有策略性的卡牌游戏。游戏中，你需要收集和使用各种卡牌，组建强大的卡组，与对手对战。每张卡牌都有独特的能力和特点，如何合理搭配和使用这些卡牌，是取得胜利的关键。游戏规则简单易懂，但要成为高手，你需要深入了解各种卡牌的特性，制定有效的战略。适合喜欢策略和思考的玩家。`,
    'Racing': `《${game.title}》是一款刺激的赛车游戏，让你体验速度与激情。游戏提供了多条赛道和各种车辆，你可以根据自己的喜好和比赛需求选择。操控方式简单直观，但要在比赛中取得好成绩，你需要熟悉赛道，掌握漂移、加速等技巧，同时避免碰撞和失误。游戏图像精美，特效逼真，给你带来身临其境的赛车体验。`,
    'Multiplayer': `《${game.title}》是一款支持多人游戏的精彩作品。在游戏中，你可以与来自世界各地的玩家一起游戏，体验合作或竞争的乐趣。游戏提供了多种多人模式，如团队合作、对抗赛等，满足不同玩家的需求。实时的互动和交流，让游戏体验更加丰富和社交化。无论你是喜欢与朋友一起玩，还是结交新朋友，这款游戏都能为你提供一个理想的平台。`
  };
  
  // 获取扩展描述，如果没有匹配则使用默认描述
  let extendedDesc = `《${game.title}》为玩家提供了精彩的游戏体验。这款游戏设计精良，玩法简单但富有深度，适合各年龄段的玩家。游戏画面精美，音效出色，为玩家创造了一个身临其境的游戏环境。`;
  
  for (const [type, desc] of Object.entries(typeExtendedDesc)) {
    if (game.type.includes(type)) {
      extendedDesc = desc;
      break;
    }
  }
  
  return extendedDesc;
}

// 生成游戏特点列表
function generateGameFeatures(game) {
  // 通用特点
  const commonFeatures = [
    '完全免费游玩',
    '无需下载，即点即玩',
    '支持电脑和手机设备',
    '精美的游戏画面',
    '简单易懂的操作',
    '适合所有年龄段玩家'
  ];
  
  // 根据游戏类型添加特定特点
  const typeSpecificFeatures = {
    'Puzzle': ['丰富的谜题内容', '逐步提升的难度', '锻炼逻辑思维'],
    'Action': ['快节奏的游戏体验', '考验反应速度', '精准的操作控制'],
    'Arcade': ['经典街机风格', '简单易上手', '无尽的挑战'],
    'Racing': ['多样化的赛道', '逼真的驾驶体验', '各种车辆可选'],
    'Strategy': ['深度的战略玩法', '需要缜密的思考', '策略性决策'],
    'Shooting': ['精准的射击体验', '各种武器可选', '多样化的目标'],
    'Bubble Shooter': ['经典泡泡射击', '色彩缤纷的泡泡', '策略性的射击角度'],
    'Sports': ['真实的体育规则', '技巧性操作', '竞技比赛体验'],
    'Match 3': ['连接相同元素', '色彩缤纷的游戏界面', '特殊道具和连击'],
    'Quiz': ['丰富的知识题库', '多种题目类型', '不同难度级别'],
    'Girls': ['时尚装扮元素', '丰富的妆容和服饰', '创意设计空间'],
    'Jump & Run': ['平台跳跃挑战', '角色技能升级', '收集道具和金币'],
    'Multiplayer': ['多人在线互动', '合作或竞争模式', '实时对战体验'],
    'Card': ['策略性卡牌玩法', '卡组构建系统', '丰富的卡牌效果'],
    'Board': ['经典棋盘游戏规则', '策略思考', '对弈乐趣'],
    'Casino': ['赌场经典游戏', '刺激的投注系统', '运气与策略并重'],
    'Adventure': ['丰富的冒险剧情', '探索未知世界', '任务与挑战'],
    'Casual': ['轻松休闲体验', '短时间游戏session', '简单有趣的玩法'],
    'RPG': ['角色成长系统', '丰富的技能树', '沉浸式故事体验'],
    'Simulation': ['真实世界模拟', '自由度高的游戏环境', '多种职业和生活选择'],
    'Word': ['词汇挑战', '提升语言能力', '字母拼接游戏'],
    'Trivia': ['常识问答', '知识面拓展', '多种主题选择'],
    'Fighting': ['格斗技能组合', '多种角色选择', '对战系统'],
    'Battle Royale': ['大型多人竞技', '生存策略', '地图收缩机制']
  };
  
  // 获取特定类型的特点
  let features = [...commonFeatures];
  
  for (const [type, typeFeatures] of Object.entries(typeSpecificFeatures)) {
    if (game.type.includes(type)) {
      features = [...features, ...typeFeatures];
      break;
    }
  }
  
  // 如果是热门或新游戏，添加相应特点
  if (game.tag === 'hot') {
    features.push('玩家热门选择', '社区高度评价');
  } else if (game.tag === 'new') {
    features.push('最新上线', '全新游戏体验');
  }
  
  // 生成HTML列表项
  return features.map(feature => `<li>${feature}</li>`).join('');
}

// 创建游戏页面模板
function createGamePageTemplate(game) {
  // 创建面包屑JSON-LD
  const breadcrumbJsonLd = `{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首页",
        "item": "https://allpopulargames.online/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "${game.type}游戏",
        "item": "https://allpopulargames.online/category/${game.type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${game.title}",
        "item": "https://allpopulargames.online/games/${game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html"
      }
    ]
  }`;
  
  // 创建playGame函数
  const playGameFunction = `function playGame() {
      // 显示加载动画
      document.getElementById('loadingOverlay').style.display = 'flex';
      
      // 跟踪游戏点击
      if (typeof gtag !== 'undefined') {
          gtag('event', 'play_game', {
              'event_category': 'engagement',
              'event_label': "${game.title}",
              'game_type': "${game.type}"
          });
      }
      
      // 直接跳转到游戏嵌入URL
      setTimeout(() => {
          window.location.href = "${game.embedUrl}";
      }, 500);
  }`;

  // 生成游戏页面HTML
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${game.title} - 免费在线玩 - AllPopularGames</title>
    <meta name="description" content="立即在线玩${game.title}，一款精彩的${game.type}游戏。不需下载，即点即玩。">
    <meta name="keywords" content="${game.title}, ${game.type}, 免费游戏, 在线游戏, 休闲游戏, HTML5游戏">
    <meta name="author" content="AllPopularGames">
    <meta property="og:title" content="${game.title} - 免费在线玩 - AllPopularGames">
    <meta property="og:description" content="立即在线玩${game.title}，一款精彩的${game.type}游戏。不需下载，即点即玩。">
    <meta property="og:image" content="${game.thumbUrl || '../images/game-placeholder.jpg'}">
    <meta property="og:url" content="https://allpopulargames.online/games/${game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="AllPopularGames">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${game.title} - 免费在线玩">
    <meta name="twitter:description" content="立即在线玩${game.title}，一款精彩的${game.type}游戏。不需下载，即点即玩。">
    <meta name="twitter:image" content="${game.thumbUrl || '../images/game-placeholder.jpg'}">
    <link rel="canonical" href="https://allpopulargames.online/games/${game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html">
    <!-- 预加载关键资源 -->
    <link rel="preload" href="${game.thumbUrl || '../images/game-placeholder.jpg'}" as="image" fetchpriority="high">
    <link rel="preload" href="../styles.css" as="style">
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" as="style">
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <!-- 添加Font Display Swap提高字体加载性能 -->
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <!-- 添加DNS预取 -->
    <link rel="dns-prefetch" href="https://img.cdn.famobi.com">
    <link rel="dns-prefetch" href="https://play.famobi.com">

    <style>
        /* 页面布局 */
        .game-detail-container {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            max-width: 1200px;
            margin: 20px auto;
            padding: 0 20px;
        }
        
        /* 游戏展示区 */
        .game-showcase {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            background: rgba(0,0,0,0.7);
            border-radius: 12px;
            overflow: hidden;
            -webkit-box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            margin-bottom: 20px;
        }
        
        .game-image {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            min-height: 300px;
            background-position: center;
            background-size: cover;
            position: relative;
        }
        
        .game-info {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            padding: 30px;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
        }
        
        /* 游戏信息 */
        .game-title {
            font-size: 2.5rem;
            margin: 0 0 10px 0;
            color: white;
            -webkit-text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        
        .game-type-badge {
            display: inline-block;
            background: var(--accent-blue);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            margin-bottom: 20px;
        }
        
        .game-description {
            color: #ccc;
            line-height: 1.6;
            margin-bottom: 20px;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
        }
        
        /* 游戏特性 */
        .game-features {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .feature {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            gap: 5px;
            color: #aaa;
            font-size: 0.9rem;
        }
        
        /* 播放按钮 */
        .play-button {
            display: -webkit-inline-box;
            display: -ms-inline-flexbox;
            display: inline-flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            background: -webkit-linear-gradient(315deg, #4CAF50, #2E7D32);
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            color: white;
            font-size: 1.5rem;
            font-weight: bold;
            padding: 15px 30px;
            border-radius: 12px;
            text-decoration: none;
            -webkit-box-shadow: 0 4px 15px rgba(46, 125, 50, 0.4);
            box-shadow: 0 4px 15px rgba(46, 125, 50, 0.4);
            border: none;
            cursor: pointer;
            -webkit-transition: all 0.3s ease;
            transition: all 0.3s ease;
            width: 100%;
            margin-top: auto;
        }
        
        .play-button:hover {
            -webkit-transform: translateY(-2px);
            transform: translateY(-2px);
            -webkit-box-shadow: 0 6px 20px rgba(46, 125, 50, 0.6);
            box-shadow: 0 6px 20px rgba(46, 125, 50, 0.6);
            background: -webkit-linear-gradient(315deg, #2E7D32, #1B5E20);
            background: linear-gradient(135deg, #2E7D32, #1B5E20);
        }
        
        .play-button i {
            margin-right: 12px;
            font-size: 1.5rem;
        }
        
        /* 加载动画 */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            z-index: 9999;
            display: none;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255,255,255,0.1);
            border-top-color: #4CAF50;
            border-radius: 50%;
            -webkit-animation: spin 1s ease-in-out infinite;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 20px;
        }
        
        @-webkit-keyframes spin {
            to { -webkit-transform: rotate(360deg); transform: rotate(360deg); }
        }
        
        @keyframes spin {
            to { -webkit-transform: rotate(360deg); transform: rotate(360deg); }
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .game-showcase {
                -webkit-box-orient: vertical;
                -webkit-box-direction: normal;
                -ms-flex-direction: column;
                flex-direction: column;
            }
            
            .game-image {
                min-height: 200px;
            }
            
            .games-row {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .game-title {
                font-size: 2rem;
            }
            
            .play-button {
                font-size: 1.2rem;
                padding: 12px 24px;
            }
        }

        /* 针对IE11的特别处理 */
        @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
            .game-detail-container, .game-showcase, .game-info, .game-features, .feature {
                display: block;
            }
            
            .game-image, .game-info {
                width: 50%;
                float: left;
            }
            
            .game-features:after {
                content: '';
                display: table;
                clear: both;
            }
            
            .feature {
                display: inline-block;
                margin-right: 15px;
            }
        }
        
        /* SEO内容区域 */
        .game-content-seo {
            background: rgba(0,0,0,0.4);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
        }
        
        .game-content-seo h2, .game-content-seo h3 {
            color: white;
            margin-top: 0;
        }
        
        .game-content-seo p, .game-content-seo li {
            color: #ccc;
            line-height: 1.6;
        }
        
        .game-content-seo ul {
            padding-left: 20px;
            margin-bottom: 20px;
        }
        
        .game-content-seo li {
            margin-bottom: 8px;
        }
        
        /* 相关游戏 */
        .related-games h2 {
            color: white;
            margin-bottom: 20px;
        }
        
        .games-row {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .game-card-small {
            background: rgba(0,0,0,0.4);
            border-radius: 12px;
            overflow: hidden;
            -webkit-transition: all 0.3s;
            transition: all 0.3s;
        }
        
        .game-card-small:hover {
            -webkit-transform: translateY(-5px);
            transform: translateY(-5px);
            -webkit-box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        
        .game-card-small img {
            width: 100%;
            height: 120px;
            -o-object-fit: cover;
            object-fit: cover;
        }
        
        .game-card-small h3 {
            color: white;
            font-size: 1rem;
            padding: 10px 15px;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .btn-small {
            display: block;
            background: var(--accent-blue);
            color: white;
            text-align: center;
            padding: 8px;
            text-decoration: none;
            -webkit-transition: all 0.3s;
            transition: all 0.3s;
        }
        
        .btn-small:hover {
            background: var(--accent-blue-dark);
        }
        
        /* 广告容器 */
        .ad-container {
            margin: 20px 0;
            text-align: center;
            background: rgba(0,0,0,0.4);
            padding: 10px;
            border-radius: 8px;
            position: relative;
        }
        
        .ad-label {
            position: absolute;
            top: 5px;
            left: 5px;
            background: rgba(0,0,0,0.5);
            color: #aaa;
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 4px;
        }
        
        /* 确保在较小屏幕上文本可读性 */
        @media (max-width: 480px) {
            .game-title {
                font-size: 1.8rem;
            }
            
            .game-description {
                font-size: 0.95rem;
            }
            
            .game-content-seo p, .game-content-seo li {
                font-size: 0.95rem;
            }
            
            .game-content-seo h2 {
                font-size: 1.5rem;
            }
            
            .game-content-seo h3 {
                font-size: 1.2rem;
            }
        }
        
        /* 面包屑导航样式 */
        .breadcrumb {
            display: flex;
            list-style: none;
            padding: 0;
            margin: 0 0 20px 0;
            font-size: 0.9rem;
        }
        
        .breadcrumb li {
            display: inline-flex;
            align-items: center;
        }
        
        .breadcrumb li a {
            color: var(--accent-blue);
            text-decoration: none;
            transition: color 0.2s;
        }
        
        .breadcrumb li a:hover {
            color: var(--accent-blue-dark);
            text-decoration: underline;
        }
        
        .breadcrumb li:not(:last-child)::after {
            content: '/';
            margin: 0 8px;
            color: #aaa;
        }
        
        .breadcrumb li:last-child {
            color: #fff;
        }
    </style>
    <!-- 游戏结构化数据 -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      "name": "${game.title}",
      "description": "${generateGameDescription(game).replace(/"/g, '\\"')}",
      "genre": "${game.type}",
      "image": "${game.thumbUrl || '../images/game-placeholder.jpg'}",
      "url": "https://allpopulargames.online/games/${game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html",
      "playMode": "SinglePlayer",
      "applicationCategory": "Game",
      "gamePlatform": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    }
    </script>
    <!-- 面包屑导航结构化数据 -->
    <script type="application/ld+json">
    ${breadcrumbJsonLd}
    </script>
</head>
<body>
    <header>
        <div class="header-content">
            <div class="logo">
                <a href="../index.html">
                    <img src="../images/logo.png" alt="AllPopularGames Logo" width="40" height="40" loading="eager">
                    <h1>AllPopular<span>Games</span></h1>
                </a>
            </div>
            <a href="../index.html" class="btn-back">
                <i class="fas fa-home"></i> 返回首页
            </a>
        </div>
    </header>

    <main>
        <div class="game-detail-container">
            <!-- 面包屑导航 -->
            <ul class="breadcrumb" aria-label="面包屑导航">
                <li><a href="../index.html">首页</a></li>
                <li><a href="../category/${game.type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html">${game.type}游戏</a></li>
                <li>${game.title}</li>
            </ul>
            
            <div class="game-showcase">
                <div class="game-image" style="background-image: url('${game.thumbUrl || '../images/game-placeholder.jpg'}')"></div>
        <div class="game-info">
                    <h1 class="game-title">${game.title}</h1>
                    <span class="game-type-badge">${game.type}</span>
                    
                    <p class="game-description">
                      ${generateGameDescription(game)}
                    </p>
                    
                    <div class="game-features">
                        <div class="feature">
                            <i class="fas fa-gamepad"></i>
                            <span>免费游戏</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-globe"></i>
                            <span>在线玩</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-mobile-alt"></i>
                            <span>全设备支持</span>
                        </div>
                    </div>
                    
                    <button onclick="playGame()" class="play-button">
                        <i class="fas fa-play-circle"></i>
                        开始游戏
                </button>
                </div>
            </div>
            
            <!-- SEO内容区域 -->
            <div class="game-content-seo">
                <h2>关于 ${game.title}</h2>
                <div class="seo-content">
                    <p>${generateExtendedDescription(game)}</p>
                    
                    <h3>游戏特点</h3>
                    <ul>
                        ${generateGameFeatures(game)}
                    </ul>
                    
                    <h3>如何开始</h3>
                    <p>点击上方的"开始游戏"按钮，即可立即体验《${game.title}》。游戏完全免费，无需下载，支持PC和移动设备。</p>
            </div>
            </div>
            
            <!-- 广告位 -->
            <div class="ad-container">
                <div class="ad-label">广告</div>
                <div id="game-detail-ad">
                    <!-- 广告代码将通过JavaScript插入 -->
                </div>
            </div>
            
            <!-- 相关游戏 -->
            <div class="related-games">
                <h2>您可能也喜欢</h2>
                <div class="games-row" id="related-games-container">
                    <!-- 相关游戏将通过JavaScript动态加载 -->
                    <p style="color: #aaa;">正在加载相关游戏...</p>
                </div>
            </div>
        </div>
        
        <div id="loadingOverlay" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p style="color: white; font-size: 18px; margin: 10px 0;">正在加载游戏，请稍候...</p>
            <img src="${game.thumbUrl || '../images/game-placeholder.jpg'}" alt="${game.title}" style="width:150px; margin-top:15px;">
        </div>
    </main>

    <footer>
        <div class="footer-content">
            <div class="footer-links">
                <a href="../about.html">关于我们</a>
                <a href="../privacy.html">隐私政策</a>
                <a href="../terms.html">使用条款</a>
                <a href="../contact.html">联系我们</a>
            </div>
            <p class="copyright">&copy; 2024 AllPopularGames. 保留所有权利。</p>
        </div>
    </footer>

    <script>
        // 播放游戏函数
        ${playGameFunction}
        
        // 页面加载时间
        const pageLoadTime = new Date();

        // 在页面即将离开时统计停留时间
        window.addEventListener('beforeunload', function() {
            const stayDuration = Math.round((new Date() - pageLoadTime) / 1000);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_time', {
                    'event_category': 'engagement',
                    'event_label': "${game.title}",
                    'value': stayDuration
                });
            }
        });
        
        // 延迟加载非关键资源
        document.addEventListener('DOMContentLoaded', function() {
            // 延迟200ms后加载相关游戏
            setTimeout(loadRelatedGames, 200);
        });
        
        // 加载相关游戏
        function loadRelatedGames() {
            fetch('/allpopulargames_games.json')
            .then(response => response.json())
            .then(games => {
                // 筛选相同类型的游戏，排除当前游戏
                const relatedGames = games
                    .filter(game => 
                        game.type.includes("${game.type}") && 
                        game.title !== "${game.title}")
                    .slice(0, 4); // 最多显示4个相关游戏
                
                // 如果相关游戏不足4个，添加其他类型的游戏
                if (relatedGames.length < 4) {
                    const otherGames = games
                        .filter(game => 
                            !game.type.includes("${game.type}") && 
                            game.title !== "${game.title}")
                        .slice(0, 4 - relatedGames.length);
                    
                    relatedGames.push(...otherGames);
                }
                
                // 显示相关游戏
                const gamesContainer = document.getElementById('related-games-container');
                
                if (relatedGames.length > 0) {
                    gamesContainer.innerHTML = relatedGames.map(game => {
                        const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return \`<div class="game-card-small">
                            <img src="\${game.thumbUrl || '../images/game-placeholder.jpg'}" alt="\${game.title}" loading="lazy">
                            <h3>\${game.title}</h3>
                            <a href="/games/\${gameSlug}.html" class="btn-small">查看</a>
                        </div>\`;
                    }).join('');
                } else {
                    gamesContainer.innerHTML = '<p style="color: #aaa;">暂无相关游戏</p>';
                }
            })
            .catch(error => {
                console.error('加载相关游戏失败:', error);
                document.getElementById('related-games-container').innerHTML = 
                    '<p style="color: #aaa;">加载相关游戏失败</p>';
            });
        }
    </script>
</body>
</html>`;
}

// 生成索引JS文件
function createRedirectScript() {
  return `// 游戏页面重定向脚本
document.addEventListener('DOMContentLoaded', function() {
  // 获取当前路径
  const path = window.location.pathname;
  const gameSlug = path.split('/').pop().replace('.html', '');
  
  // 如果是在games目录下但没有具体游戏名，重定向到首页
  if (path === '/games/' || path === '/games') {
    window.location.href = '/index.html';
  }
  
  // 加载游戏数据
  fetch('/allpopulargames_games.json')
    .then(response => response.json())
    .then(games => {
      // 查找匹配的游戏
      const game = games.find(g => {
        const slug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return slug === gameSlug;
      });
      
      // 如果找到游戏，显示游戏页面
      if (game) {
        document.title = game.title + ' - AllPopularGames';
    } else {
        // 未找到游戏，重定向到首页
        window.location.href = '/index.html';
      }
    })
    .catch(error => {
      console.error('加载游戏数据失败:', error);
      // 出错时重定向到首页
      window.location.href = '/index.html';
    });
});`;
}

// 为Cloudflare Pages创建配置文件
function createCloudflareConfig() {
  // 创建 _headers 文件以设置缓存和安全标头
  const headers = `# 全局标头
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  
# 游戏图片缓存
/images/*
  Cache-Control: public, max-age=86400
  
# API数据较短缓存时间  
/allpopulargames_games.json
  Cache-Control: public, max-age=3600
`;

  fs.writeFileSync(path.join(__dirname, '..', '_headers'), headers);
  console.log('已创建Cloudflare标头配置');
}

// 创建Apache .htaccess规则
function createHtaccessRules() {
  return `# AllPopularGames .htaccess
# 配置静态游戏页面的URL重写规则

<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # 如果请求的不是文件或目录，尝试添加.html扩展名
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.+)$ $1.html [L]
  
  # 将其他未匹配的请求重定向到index.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.html [L]
</IfModule>

# 设置MIME类型
<IfModule mod_mime.c>
  AddType text/html .html
  AddType text/javascript .js
  AddType text/css .css
</IfModule>

# 启用GZIP压缩
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/javascript text/css application/javascript
</IfModule>

# 设置缓存控制
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType text/javascript "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType image/ico "access plus 1 month"
</IfModule>`;
}

// 保存转换后的游戏数据到JSON文件
function saveConvertedGames(games) {
  const outputFile = path.join(__dirname, '..', 'allpopulargames_games.json');
  fs.writeFileSync(outputFile, JSON.stringify(games, null, 2));
  log(`转换后的游戏数据已保存到: ${outputFile}`);
}

// 提取游戏分类并保存到JSON文件
function extractAndSaveCategories(games) {
  // 提取所有游戏的唯一分类
  const gameTypes = new Set();
  games.forEach(game => {
    // 处理type字段
    if (game.type) {
      // 如果类型包含多个分类（用逗号或其他分隔符分隔），则分别添加
      const types = game.type.split(/[,&\/]/);
      types.forEach(type => {
        const trimmedType = type.trim();
        if (trimmedType) gameTypes.add(trimmedType);
      });
    }
    
    // 同时处理categories数组
    if (game.categories && Array.isArray(game.categories)) {
      game.categories.forEach(category => {
        if (category) gameTypes.add(category);
      });
    }
  });
  
  // 转换为数组并排序
  const sortedTypes = Array.from(gameTypes).sort();
  
  // 创建分类映射对象，包含分类名和图标
  const categoryMap = {
    "Home": {
      "name": "首页",
      "icon": "fas fa-home"
    }
  };
  
  sortedTypes.forEach(type => {
    categoryMap[type] = {
      name: type,
      icon: getCategoryIconClass(type)
    };
  });
  
  // 保存到JSON文件
  const categoriesJsonPath = path.join(__dirname, '..', 'game_categories.json');
  fs.writeFile(
    categoriesJsonPath, 
    JSON.stringify(categoryMap, null, 2), 
    'utf8', 
    (err) => {
      if (err) {
        console.error('保存分类数据失败:', err);
        return;
      }
      console.log(`已保存 ${sortedTypes.length} 个游戏分类到 game_categories.json`);
    }
  );
}

// 为分类提供图标映射
function getCategoryIconClass(category) {
  // 分类与图标的映射关系
  const iconMap = {
    'Action': 'fas fa-running',
    'Adventure': 'fas fa-mountain',
    'Puzzle': 'fas fa-puzzle-piece',
    'Racing': 'fas fa-car',
    'Shooting': 'fas fa-bullseye',
    'Sports': 'fas fa-futbol',
    'Casual': 'fas fa-smile',
    'Strategy': 'fas fa-chess',
    'RPG': 'fas fa-hat-wizard',
    'Simulation': 'fas fa-gamepad',
    'Card': 'fas fa-cards',
    'Arcade': 'fas fa-joystick',
    'Car': 'fas fa-car',
    'Driving': 'fas fa-car-side'
  };
  
  // 返回对应的图标类，如果没有映射则使用默认图标
  return iconMap[category] || 'fas fa-gamepad';
}

// 生成分类页面
function generateCategoryPages(games) {
  // 获取所有游戏类型
  const categories = [...new Set(games.map(game => game.type))];
  
  // 确保分类目录存在
  const categoryDir = path.join(__dirname, '..', 'category');
  ensureDir(categoryDir);
  
  // 为每个分类创建页面
  categories.forEach(category => {
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const categoryGames = games.filter(game => game.type === category);
    const categoryPageHtml = createCategoryPageTemplate(category, categoryGames);
    
    fs.writeFileSync(path.join(categoryDir, `${categorySlug}.html`), categoryPageHtml);
    log(`已创建分类页面: ${category}`);
  });
}

// 创建分类页面模板
function createCategoryPageTemplate(category, games) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${category}游戏 - AllPopularGames</title>
    <meta name="description" content="在AllPopularGames上免费玩${category}游戏。我们收集了最好玩的${category}游戏，全部免费，无需下载。">
    <meta name="keywords" content="${category}, 免费游戏, 在线游戏, HTML5游戏">
    <link rel="canonical" href="https://allpopulargames.online/category/${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html">
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    
    <!-- 结构化数据 -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "${category}游戏",
      "description": "在AllPopularGames上免费玩${category}游戏。我们收集了最好玩的${category}游戏，全部免费，无需下载。",
      "url": "https://allpopulargames.online/category/${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html",
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": [
          ${games.map((game, index) => `{
            "@type": "ListItem",
            "position": ${index + 1},
            "url": "https://allpopulargames.online/games/${game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html"
          }`).join(',\n          ')}
        ]
      }
    }
    </script>
</head>
<body>
    <header>
        <div class="header-content">
            <div class="logo">
                <a href="../index.html">
                    <img src="../images/logo.png" alt="AllPopularGames Logo" width="40" height="40">
                    <h1>AllPopular<span>Games</span></h1>
                </a>
            </div>
            <a href="../index.html" class="btn-back">
                <i class="fas fa-home"></i> 返回首页
            </a>
        </div>
    </header>

    <main>
        <div class="container">
            <h1 class="category-title">${category}游戏</h1>
            
            <ul class="breadcrumb">
                <li><a href="../index.html">首页</a></li>
                <li>${category}游戏</li>
            </ul>
            
            <p class="category-description">
                探索我们精选的${category}游戏集合。这些游戏全部免费，无需下载，即点即玩。
            </p>
            
            <div class="games-grid">
                ${games.map(game => {
                  const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  return `<div class="game-card">
                    <a href="../games/${gameSlug}.html">
                        <img src="${game.thumbUrl || '../images/game-placeholder.jpg'}" alt="${game.title}" loading="lazy">
                        <div class="game-card-content">
                            <h3>${game.title}</h3>
                            <p>${game.type}</p>
                        </div>
                    </a>
                </div>`;
                }).join('\n                ')}
            </div>
        </div>
    </main>
    
    <footer>
        <div class="footer-content">
            <div class="footer-links">
                <a href="../about.html">关于我们</a>
                <a href="../privacy.html">隐私政策</a>
                <a href="../terms.html">使用条款</a>
                <a href="../contact.html">联系我们</a>
            </div>
            <p class="copyright">&copy; 2024 AllPopularGames. 保留所有权利。</p>
        </div>
    </footer>
</body>
</html>`;
}

// 主函数 - 更新主函数以包含分类页面生成
async function main() {
  log('开始同步游戏数据');
  
  try {
    // 创建状态文件，标记同步开始
    fs.writeFileSync(path.join(__dirname, '..', 'sync-status.json'), JSON.stringify({
      status: 'processing',
      startTime: new Date().toISOString(),
      message: '正在同步游戏数据'
    }, null, 2));
    
    // 获取游戏数据
    const gamesData = await fetchGamesData(CONFIG.sourceUrl);
    
    if (!gamesData || gamesData.length === 0) {
      throw new Error('没有获取到有效的游戏数据');
    }
    
    log(`成功获取 ${gamesData.length} 个游戏数据`);
    
    // 转换游戏链接
    const convertedGames = convertGameUrls(gamesData);
    log(`转换了 ${convertedGames.length} 个游戏链接为本地静态页面链接`);
    
    // 写入JSON文件
    fs.writeFileSync(CONFIG.jsonFile, JSON.stringify(convertedGames, null, 2));
    
    // 生成静态页面
    generateStaticPages(convertedGames);
    
    // 生成分类页面
    generateCategoryPages(convertedGames);
    
    // 生成Meta数据统计
    generateMetaStats(convertedGames);
    log('生成了META数据统计');
    
    // 更新完成状态
    fs.writeFileSync(path.join(__dirname, '..', 'sync-status.json'), JSON.stringify({
      status: 'completed',
      endTime: new Date().toISOString(),
      gamesCount: convertedGames.length,
      message: '同步完成'
    }, null, 2));
    
    log('同步完成');
    return true;
  } catch (error) {
    log(`同步失败: ${error.message}`);
    
    // 更新错误状态
    fs.writeFileSync(path.join(__dirname, '..', 'sync-status.json'), JSON.stringify({
      status: 'error',
      time: new Date().toISOString(),
      error: error.message
    }, null, 2));
    
    return false;
  }
}

// 生成游戏分类数据
function generateCategoriesData(games) {
  try {
    // 提取所有不同的游戏类型
    const gameTypes = new Set();
    games.forEach(game => {
      // 处理type字段
      if (game.type) {
        // 处理可能的多个分类（用逗号或其他分隔符分隔）
        const types = game.type.split(/[,&\/]/);
        types.forEach(type => {
          const trimmedType = type.trim();
          if (trimmedType) gameTypes.add(trimmedType);
        });
      }
      
      // 同时处理categories数组
      if (game.categories && Array.isArray(game.categories)) {
        game.categories.forEach(category => {
          if (category) gameTypes.add(category);
        });
      }
    });
    
    // 创建分类映射对象
    const categoryMap = { 
      "Home": {
        "name": "首页",
        "icon": "fas fa-home"
      }
    };
    
    Array.from(gameTypes).sort().forEach(type => {
      categoryMap[type] = {
        name: type,
        icon: getCategoryIconClass(type)
      };
    });
    
    // 写入分类数据文件
    const outputFile = path.join(__dirname, '..', 'game_categories.json');
    fs.writeFileSync(outputFile, JSON.stringify(categoryMap, null, 2));
    
    log(`生成了包含 ${Object.keys(categoryMap).length} 个分类的数据文件`);
  } catch (error) {
    log(`生成分类数据失败: ${error.message}`);
  }
}

// 生成META数据，包括游戏数量统计
function generateMetaData(games) {
  try {
    const metaData = {
      gamesCount: games.length,
      lastUpdate: new Date().toISOString(),
      categoryCounts: {}
    };
    
    // 统计各分类的游戏数量
    games.forEach(game => {
      if (game.type) {
        const types = game.type.split(/[,&\/]/).map(t => t.trim());
        types.forEach(type => {
          if (type) {
            metaData.categoryCounts[type] = (metaData.categoryCounts[type] || 0) + 1;
          }
        });
      }
    });
    
    // 统计标签数量
    metaData.tagCounts = {
      hot: games.filter(g => g.tag === 'hot').length,
      new: games.filter(g => g.tag === 'new').length
    };
    
    // 写入页面计数数据
    const pageCountFile = path.join(__dirname, '..', 'admin', 'pagecount.json');
    fs.writeFileSync(pageCountFile, JSON.stringify(metaData, null, 2));
    
    log(`生成了META数据统计`);
  } catch (error) {
    log(`生成META数据失败: ${error.message}`);
  }
}

// 辅助函数：获取分类对应的图标类
function getCategoryIconClass(category) {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('action') || lowerCategory.includes('动作')) 
    return 'fas fa-running';
  if (lowerCategory.includes('adventure') || lowerCategory.includes('冒险')) 
    return 'fas fa-mountain';
  if (lowerCategory.includes('casual') || lowerCategory.includes('休闲')) 
    return 'fas fa-smile';
  if (lowerCategory.includes('puzzle') || lowerCategory.includes('解谜')) 
    return 'fas fa-puzzle-piece';
  if (lowerCategory.includes('racing') || lowerCategory.includes('car') || lowerCategory.includes('赛车')) 
    return 'fas fa-car';
  if (lowerCategory.includes('shoot') || lowerCategory.includes('射击')) 
    return 'fas fa-bullseye';
  if (lowerCategory.includes('sport') || lowerCategory.includes('体育')) 
    return 'fas fa-futbol';
  if (lowerCategory.includes('strategy') || lowerCategory.includes('策略')) 
    return 'fas fa-chess';
  if (lowerCategory.includes('multi') || lowerCategory.includes('多人')) 
    return 'fas fa-users';
  if (lowerCategory.includes('io')) 
    return 'fas fa-globe';
  if (lowerCategory.includes('two') || lowerCategory.includes('双人')) 
    return 'fas fa-user-friends';
  
  // 默认图标
  return 'fas fa-gamepad';
}

// 生成元数据统计
function generateMetaStats(games) {
  const stats = {
    totalGames: games.length,
    categories: {},
    createdAt: new Date().toISOString(),
  };

  // 按分类统计游戏数量
  games.forEach(game => {
    const category = game.type || 'Unknown';
    if (!stats.categories[category]) {
      stats.categories[category] = 0;
    }
    stats.categories[category]++;
  });

  // 写入统计文件
  fs.writeFileSync(
    path.join(__dirname, '..', 'meta-stats.json'),
    JSON.stringify(stats, null, 2)
  );
}

// 修改createFullscreenGameTemplate函数，优化加载体验
function createFullscreenGameTemplate(game) {
  const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  // 从embedUrl中提取域名，用于预连接
  let preconnectDomain = '';
  try {
    const urlObj = new URL(game.embedUrl);
    preconnectDomain = urlObj.origin;
  } catch (e) {
    // 如果URL解析失败，忽略错误
  }
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${game.title} - 全屏模式 - AllPopularGames</title>
    <meta name="description" content="全屏体验${game.title}游戏，一款精彩的${game.type}游戏。">
    <link rel="canonical" href="https://allpopulargames.online/games/${gameSlug}-fullscreen.html">
    
    <!-- 性能优化：预连接到游戏资源域名 -->
    ${preconnectDomain ? `<link rel="preconnect" href="${preconnectDomain}" crossorigin>
    <link rel="dns-prefetch" href="${preconnectDomain}">` : ''}
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000;
            font-family: Arial, sans-serif;
        }
        
        .game-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10;
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        iframe.loaded {
            opacity: 1;
        }
        
        .controls {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 100;
            display: flex;
            gap: 10px;
        }
        
        .control-button {
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .control-button:hover {
            background: rgba(0, 0, 0, 0.8);
        }
        
        .control-button i {
            margin-right: 5px;
        }
        
        #loadingOverlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            transition: opacity 0.5s ease;
        }
        
        .loading-spinner {
            width: 60px;
            height: 60px;
            margin-bottom: 20px;
            position: relative;
        }
        
        .loading-spinner:before,
        .loading-spinner:after {
            content: '';
            display: block;
            position: absolute;
            border-radius: 50%;
            border: 4px solid transparent;
            border-top-color: #fff;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            animation: spinner 1.2s linear infinite;
        }
        
        .loading-spinner:after {
            border-top-color: #4caf50;
            animation-delay: 0.3s;
        }
        
        @keyframes spinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: white;
            font-size: 18px;
            margin: 15px 0;
            text-align: center;
        }
        
        .loading-progress {
            width: 200px;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            margin: 10px 0;
            overflow: hidden;
        }
        
        .loading-progress-bar {
            height: 100%;
            width: 0%;
            background: #4caf50;
            border-radius: 3px;
            transition: width 0.3s ease;
        }
        
        .game-thumb {
            width: 150px;
            margin: 15px auto;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
            transform: scale(1);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="controls">
        <button class="control-button" onclick="window.location.href='${gameSlug}.html'">
            <i class="fas fa-info-circle"></i> 游戏信息
        </button>
        <button class="control-button" onclick="window.location.href='../index.html'">
            <i class="fas fa-home"></i> 返回首页
        </button>
    </div>
    
    <div class="game-container">
        <iframe id="game-frame" src="about:blank" data-src="${game.embedUrl}" allow="fullscreen" allowfullscreen="true"></iframe>
    </div>
    
    <div id="loadingOverlay">
        <div class="loading-spinner"></div>
        <p class="loading-text">游戏加载中，请稍候...</p>
        <div class="loading-progress">
            <div class="loading-progress-bar" id="progressBar"></div>
        </div>
        <img src="${game.thumbUrl || '../images/game-placeholder.jpg'}" alt="${game.title}" class="game-thumb">
        <p class="loading-text" style="font-size: 14px; opacity: 0.7;">由于游戏资源较大，首次加载可能需要一些时间</p>
    </div>
    
    <script>
        // 改进的加载动画
        let loadingProgress = 0;
        const progressBar = document.getElementById('progressBar');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const iframe = document.getElementById('game-frame');
        
        // 显示渐进式加载进度
        const loadingInterval = setInterval(() => {
            loadingProgress += Math.random() * 2;
            if (loadingProgress > 70) {
                clearInterval(loadingInterval);
            }
            progressBar.style.width = Math.min(loadingProgress, 70) + '%';
        }, 200);
        
        // 延迟加载iframe内容，减少初始加载时间
        setTimeout(() => {
            iframe.src = iframe.getAttribute('data-src');
        }, 300);
        
        // 监听iframe加载事件
        iframe.onload = function() {
            // 标记iframe为已加载
            this.classList.add('loaded');
            
            // 完成进度条
            loadingProgress = 100;
            progressBar.style.width = '100%';
            
            // 给用户一个短暂的完成感后再隐藏加载动画
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);
            }, 500);
        };
        
        // 设置超时保护，防止长时间加载
        setTimeout(() => {
            if (loadingProgress < 100) {
                loadingProgress = 100;
                progressBar.style.width = '100%';
                
                setTimeout(() => {
                    loadingOverlay.style.opacity = '0';
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                    }, 500);
                }, 500);
            }
        }, 15000);
        
        // 跟踪游戏加载
        if (typeof gtag !== 'undefined') {
            gtag('event', 'play_game_fullscreen', {
                'event_category': 'engagement',
                'event_label': "${game.title}",
                'game_type': "${game.type}"
            });
        }
    </script>
</body>
</html>`;
}

// 如果是直接运行脚本，则执行主流程
if (require.main === module) {
  try {
    // 尝试从JSON文件直接读取游戏数据
    if (fs.existsSync(CONFIG.jsonFile)) {
      console.log(`正在从 ${CONFIG.jsonFile} 读取游戏数据...`);
      const jsonData = fs.readFileSync(CONFIG.jsonFile, 'utf8');
      const gamesData = JSON.parse(jsonData);
      
      if (gamesData && gamesData.length > 0) {
        console.log(`成功读取 ${gamesData.length} 个游戏数据`);
        
        // 提取并保存分类
        extractAndSaveCategories(gamesData);
        
        console.log('分类数据处理完成');
      } else {
        console.error('JSON文件中没有有效的游戏数据');
      }
    } else {
      console.error(`找不到游戏数据文件: ${CONFIG.jsonFile}`);
    }
  } catch (error) {
    console.error(`运行脚本时出错: ${error.message}`);
  }
} 