/**
 * 游戏数据导入脚本
 * 
 * 功能：
 * 1. 从html5games_imported.json读取爬取的游戏数据
 * 2. 将游戏数据导入到allpopulargames_games.json
 * 3. 避免导入重复游戏
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const IMPORTED_GAMES_FILE = path.join(__dirname, '..', 'html5games_imported.json');
const ALL_GAMES_FILE = path.join(__dirname, '..', 'allpopulargames_games.json');

// 日志函数
function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

// 读取JSON文件
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log(`读取文件失败: ${filePath}`);
    log(error.message);
    return null;
  }
}

// 写入JSON文件
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    log(`写入文件失败: ${filePath}`);
    log(error.message);
    return false;
  }
}

// 检查游戏是否重复
function isDuplicateGame(game, existingGames) {
  return existingGames.some(existingGame => 
    existingGame.title.toLowerCase() === game.title.toLowerCase() ||
    existingGame.embedUrl === game.embedUrl
  );
}

// 主函数：导入游戏数据
function importGames() {
  log('开始导入游戏数据');
  
  // 读取导入的游戏数据
  const importedGames = readJsonFile(IMPORTED_GAMES_FILE);
  if (!importedGames || !Array.isArray(importedGames) || importedGames.length === 0) {
    log('没有找到要导入的游戏数据或数据为空');
    return;
  }
  
  log(`找到 ${importedGames.length} 个要导入的游戏`);
  
  // 读取现有的游戏数据
  let allGames = readJsonFile(ALL_GAMES_FILE);
  if (!allGames) {
    log('无法读取现有游戏数据，将创建新的游戏列表');
    allGames = [];
  }
  
  const initialCount = allGames.length;
  let importedCount = 0;
  let duplicateCount = 0;
  
  // 导入新游戏，避免重复
  importedGames.forEach(game => {
    if (!isDuplicateGame(game, allGames)) {
      allGames.push(game);
      importedCount++;
    } else {
      duplicateCount++;
    }
  });
  
  // 如果有新游戏，写入文件
  if (importedCount > 0) {
    if (writeJsonFile(ALL_GAMES_FILE, allGames)) {
      log(`成功导入 ${importedCount} 个新游戏`);
      log(`跳过 ${duplicateCount} 个重复游戏`);
      log(`游戏总数: ${allGames.length} (之前: ${initialCount})`);
    } else {
      log('导入失败: 无法写入游戏数据文件');
    }
  } else {
    log(`没有新游戏可导入，跳过 ${duplicateCount} 个重复游戏`);
  }
}

// 执行导入
importGames(); 