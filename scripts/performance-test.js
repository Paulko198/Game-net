/**
 * 游戏网站性能测试脚本
 * 用于测试系统在不同游戏数量下的加载性能
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 游戏类型列表
const gameTypes = [
  'Arcade', 'Puzzle', 'Action', 'Adventure', 'Racing', 
  'Shooting', 'Sports', 'Strategy', 'Multiplayer', 'Card',
  'Bubble Shooter', 'Tower Defense', 'RPG', 'Horror', 'Casual',
  'Educational', 'Board', 'Simulation', 'Platform', 'Fighting'
];

// 游戏标签
const gameTags = ['hot', 'new', ''];

// 创建随机游戏数据
function createRandomGame(index) {
  // 选择1-3个随机游戏类型
  const typeCount = Math.floor(Math.random() * 3) + 1;
  const selectedTypes = [];
  
  for (let i = 0; i < typeCount; i++) {
    const randomType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    if (!selectedTypes.includes(randomType)) {
      selectedTypes.push(randomType);
    }
  }
  
  const type = selectedTypes.join(' & ');
  
  // 选择一个随机标签（有75%的游戏没有标签）
  const tagIndex = Math.random() < 0.25 ? Math.floor(Math.random() * 2) : 2;
  const tag = gameTags[tagIndex];
  
  // 构建游戏对象
  return {
    title: `Test Game ${index}`,
    type: type,
    url: `/games/test-game-${index}.html`,
    thumbUrl: `https://picsum.photos/200/200?random=${index}`,
    openMode: 'redirect',
    tag: tag,
    originalUrl: `https://example.com/games/test-game-${index}?ref=allpopulargames`,
    canonicalUrl: `https://allpopulargames.online/games/test-game-${index}.html`
  };
}

// 生成指定数量的游戏数据
function generateGames(count) {
  console.log(`正在生成 ${count} 个测试游戏数据...`);
  
  const games = [];
  for (let i = 1; i <= count; i++) {
    games.push(createRandomGame(i));
    
    // 每生成1000个游戏显示一次进度
    if (i % 1000 === 0) {
      console.log(`已生成 ${i} 个游戏数据`);
    }
  }
  
  return games;
}

// 保存游戏数据到文件
function saveGames(games, filename) {
  const filepath = path.join(__dirname, '..', filename);
  fs.writeFileSync(filepath, JSON.stringify(games, null, 2));
  console.log(`已将 ${games.length} 个游戏数据保存到 ${filepath}`);
}

// 执行测试
function runTest(gameCount) {
  console.log(`
⚠️ 警告：生成大量游戏数据可能导致浏览器性能问题！
---------------------------------------------
您正准备生成 ${gameCount} 个游戏数据进行测试。
此操作将覆盖现有的 allpopulargames_games.json 文件。
  `);
  
  rl.question('是否继续？(y/n) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      const games = generateGames(gameCount);
      saveGames(games, 'allpopulargames_games.json');
      
      // 输出测试结果，以便用户在浏览器中执行前端测试
      console.log(`
===================================
性能测试准备完成 - ${gameCount} 游戏
===================================

现在请运行以下步骤：
1. 启动本地服务器：npx serve
2. 在浏览器中打开开发者工具 (F12)
3. 切换到 Performance 选项卡
4. 访问 http://localhost:3000/ 
5. 记录并分析加载性能

提示：记录以下指标：
- 页面加载总时间
- 首次内容绘制 (FCP)
- 最大内容绘制 (LCP)
- 总JavaScript执行时间
- 内存使用情况
      `);
      rl.close();
    } else {
      console.log('测试已取消');
      rl.close();
    }
  });
}

// 使用命令行参数获取游戏数量
const args = process.argv.slice(2);
const gameCount = parseInt(args[0]) || 10; // 默认生成10个游戏

// 运行测试
runTest(gameCount); 