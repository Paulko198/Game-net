/**
 * 性能测试自动化脚本
 * 自动运行不同游戏数量的测试并收集结果
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 要测试的游戏数量
const testCounts = [
  10,     // 很少游戏
  100,    // 少量游戏
  500,    // 中等数量
  1000,   // 较多游戏
  2000,   // 大量游戏
  5000,   // 极大量游戏
  10000   // 压力测试
];

// 测试结果保存路径
const resultsPath = path.join(__dirname, '..', 'performance-results.json');

// 初始化结果对象
const results = {
  timestamp: new Date().toISOString(),
  tests: []
};

// 按顺序运行测试
async function runTests() {
  console.log('开始自动化性能测试');
  console.log('=====================');
  
  for (const count of testCounts) {
    console.log(`准备测试 ${count} 个游戏的加载性能...`);
    
    try {
      // 生成指定数量的测试数据
      await runCommand(`node scripts/performance-test.js ${count}`);
      
      // 记录测试数据
      const testData = {
        gameCount: count,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      results.tests.push(testData);
      
      // 保存当前结果
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
      
      console.log(`已完成 ${count} 个游戏的测试数据生成`);
      console.log('=====================');
      
      // 等待一段时间，给用户测试前端的时间
      console.log(`请在浏览器中测试这 ${count} 个游戏的前端性能`);
      console.log('运行以下命令启动服务器（如果还没启动）：npx serve');
      console.log('然后打开浏览器访问: http://localhost:3000');
      console.log('记录完性能数据后，按任意键继续下一个测试...');
      
      // 等待用户按键继续
      await waitForKeypress();
      
    } catch (error) {
      console.error(`测试 ${count} 个游戏时出错:`, error);
      results.tests.push({
        gameCount: count,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message
      });
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    }
  }
  
  console.log('所有测试完成！');
  console.log(`结果已保存到: ${resultsPath}`);
  console.log('你可以根据测试结果确定网站能够承载的最佳游戏数量');
}

// 运行命令的Promise包装
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      console.log(stdout);
      resolve();
    });
  });
}

// 等待用户按键的Promise
function waitForKeypress() {
  return new Promise((resolve) => {
    console.log('按Enter键继续...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

// 运行测试
runTests().catch(err => {
  console.error('测试过程中发生错误:', err);
}); 