/**
 * 自动批量处理所有游戏页面的GameI18N更新
 * 用法: node process-all-games.js [batchSize] [startIndex]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const readdir = util.promisify(fs.readdir);

// 默认配置
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_START_INDEX = 0;

// 从命令行参数解析
const args = process.argv.slice(2);
const batchSize = parseInt(args[0], 10) || DEFAULT_BATCH_SIZE;
const startIndex = parseInt(args[1], 10) || DEFAULT_START_INDEX;

// 运行单个批次
const runBatch = (index, size, totalFiles) => {
  return new Promise((resolve, reject) => {
    console.log(`\n======== 正在处理批次: 索引 ${index} 到 ${Math.min(index + size - 1, totalFiles - 1)} ========`);
    
    const updateProcess = spawn('node', ['update-game-i18n.js', index.toString(), size.toString()], {
      stdio: 'inherit',
      shell: true
    });
    
    updateProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`批次处理完成 (索引 ${index} 到 ${Math.min(index + size - 1, totalFiles - 1)})`);
        resolve(index + size);
      } else {
        console.error(`批次处理失败，退出代码: ${code}`);
        reject(new Error(`批次处理失败，退出代码: ${code}`));
      }
    });
    
    updateProcess.on('error', (err) => {
      console.error(`启动批次处理时出错:`, err);
      reject(err);
    });
  });
};

// 主函数
const processAllGames = async () => {
  console.log('============================================');
  console.log('开始批量处理所有游戏页面');
  console.log(`开始时间: ${new Date().toLocaleString()}`);
  console.log(`批处理大小: ${batchSize}`);
  console.log(`起始索引: ${startIndex}`);
  console.log('============================================\n');
  
  try {
    // 获取游戏页面总数
    const gamesDir = path.join(__dirname, '..', 'games');
    const files = await readdir(gamesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`找到 ${htmlFiles.length} 个游戏页面文件`);
    
    let currentIndex = startIndex;
    let successfulBatches = 0;
    let failedBatches = 0;
    
    // 循环处理每个批次
    while (currentIndex < htmlFiles.length) {
      try {
        // 处理当前批次
        const nextIndex = await runBatch(currentIndex, batchSize, htmlFiles.length);
        currentIndex = nextIndex;
        successfulBatches++;
        
        // 添加延迟以减轻系统负担
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (batchError) {
        console.error(`批次处理失败:`, batchError);
        failedBatches++;
        
        // 跳到下一个批次
        currentIndex += batchSize;
        
        // 如果连续失败过多，则退出
        if (failedBatches >= 3) {
          console.error('连续失败次数过多，脚本退出');
          break;
        }
      }
    }
    
    console.log('\n============================================');
    console.log(`处理完成!`);
    console.log(`成功批次: ${successfulBatches}`);
    console.log(`失败批次: ${failedBatches}`);
    console.log(`结束时间: ${new Date().toLocaleString()}`);
    console.log('============================================');
  } catch (error) {
    console.error('批量处理过程中发生错误:', error);
    process.exit(1);
  }
};

// 执行主函数
processAllGames(); 