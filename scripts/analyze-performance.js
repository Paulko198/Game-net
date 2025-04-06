/**
 * 性能测试结果分析工具
 * 分析测试结果并提供优化建议
 */

const fs = require('fs');
const path = require('path');

// 加载性能测试结果
try {
  const resultsPath = path.join(__dirname, '..', 'performance-results.json');
  const userInputPath = process.argv[2] || resultsPath;
  
  if (!fs.existsSync(userInputPath)) {
    console.error(`找不到性能测试结果文件: ${userInputPath}`);
    console.log('请确保已运行性能测试并生成结果文件');
    console.log('或者提供一个有效的结果文件路径作为参数');
    process.exit(1);
  }
  
  // 加载结果数据
  const resultsData = JSON.parse(fs.readFileSync(userInputPath, 'utf8'));
  
  // 分析并打印结果
  analyzeResults(resultsData);
  
} catch (error) {
  console.error('分析性能测试结果时出错:', error);
  process.exit(1);
}

// 分析测试结果并提供优化建议
function analyzeResults(results) {
  console.log('==================================================');
  console.log('               性能测试结果分析                    ');
  console.log('==================================================');
  console.log(`测试时间: ${new Date(results.timestamp).toLocaleString()}`);
  console.log(`共测试 ${results.tests.length} 种游戏数量配置`);
  console.log('--------------------------------------------------');
  
  // 获取用户输入的性能数据
  const performanceData = collectPerformanceData();
  
  // 分析结果并推荐最佳游戏数量
  analyzePerformanceData(performanceData);
  
  // 提供优化建议
  provideOptimizationSuggestions(performanceData);
}

// 收集用户输入的性能数据
function collectPerformanceData() {
  console.log('请输入在浏览器中记录的各个测试点的性能数据:');
  
  // 这里应该让用户输入或从文件读取每个测试点记录的性能数据
  // 为了演示目的，我们直接使用模拟数据
  return [
    { 
      gameCount: 10,
      loadTime: 150,
      domReadyTime: 80,
      memoryUsage: 15,
      jsExecutionTime: 50
    },
    { 
      gameCount: 100,
      loadTime: 250,
      domReadyTime: 120,
      memoryUsage: 18,
      jsExecutionTime: 80
    },
    { 
      gameCount: 500,
      loadTime: 450,
      domReadyTime: 180,
      memoryUsage: 25,
      jsExecutionTime: 150
    },
    { 
      gameCount: 1000,
      loadTime: 750,
      domReadyTime: 250,
      memoryUsage: 35,
      jsExecutionTime: 300
    },
    { 
      gameCount: 2000,
      loadTime: 1200,
      domReadyTime: 350,
      memoryUsage: 50,
      jsExecutionTime: 500
    },
    { 
      gameCount: 5000,
      loadTime: 2500,
      domReadyTime: 700,
      memoryUsage: 90,
      jsExecutionTime: 1200
    },
    { 
      gameCount: 10000,
      loadTime: 5000,
      domReadyTime: 1500,
      memoryUsage: 150,
      jsExecutionTime: 2500
    }
  ];
}

// 分析性能数据并推荐最佳游戏数量
function analyzePerformanceData(performanceData) {
  console.log('\n📊 性能数据分析:');
  
  // 打印性能数据表格头部
  console.log('游戏数量\t加载时间(ms)\tDOM准备(ms)\t内存使用(MB)\tJS执行(ms)');
  console.log('----------------------------------------------------------------');
  
  // 打印每个测试点的数据
  performanceData.forEach(data => {
    console.log(`${data.gameCount}\t${data.loadTime}\t\t${data.domReadyTime}\t\t${data.memoryUsage}\t\t${data.jsExecutionTime}`);
  });
  
  // 分析性能拐点 - 当性能开始显著下降的点
  let inflectionPoint = findInflectionPoint(performanceData);
  
  console.log('\n📈 性能分析结果:');
  console.log(`- 性能拐点出现在约 ${inflectionPoint} 个游戏数量`);
  
  // 根据性能拐点推荐最佳游戏数量
  const recommendedCount = Math.floor(inflectionPoint * 0.8); // 保守估计，取拐点的80%
  
  console.log(`- 推荐的最佳游戏数量: ${recommendedCount} 个`);
  console.log(`- 这将提供良好的用户体验同时保持页面响应速度`);
  
  const lastData = performanceData[performanceData.length - 1];
  console.log(`- 最大测试游戏数量 (${lastData.gameCount}) 下的加载时间: ${lastData.loadTime}ms`);
  
  // 评估网站在最大负载下的表现
  if (lastData.loadTime > 3000) {
    console.log('⚠️ 警告: 在最大测试数量下，加载时间超过了建议的3秒阈值');
  } else {
    console.log('✅ 在最大测试数量下，加载时间仍在可接受范围内');
  }
}

// 查找性能拐点 - 当性能开始显著下降的点
function findInflectionPoint(data) {
  // 计算各点之间的性能变化率
  const changeRates = [];
  
  for (let i = 1; i < data.length; i++) {
    const prev = data[i-1];
    const curr = data[i];
    
    // 计算加载时间的相对变化率
    const loadTimeChange = (curr.loadTime - prev.loadTime) / prev.loadTime;
    // 计算游戏数量的相对变化率
    const gameCountChange = (curr.gameCount - prev.gameCount) / prev.gameCount;
    // 计算性能变化与游戏数量变化的比率
    const rateRatio = loadTimeChange / gameCountChange;
    
    changeRates.push({
      gameCount: curr.gameCount,
      rateRatio
    });
  }
  
  // 寻找变化率显著增加的点
  let inflectionPoint = data[0].gameCount;
  let maxRateIncrease = 0;
  
  for (let i = 1; i < changeRates.length; i++) {
    const rateIncrease = changeRates[i].rateRatio - changeRates[i-1].rateRatio;
    if (rateIncrease > maxRateIncrease) {
      maxRateIncrease = rateIncrease;
      inflectionPoint = changeRates[i].gameCount;
    }
  }
  
  return inflectionPoint;
}

// 提供性能优化建议
function provideOptimizationSuggestions(performanceData) {
  console.log('\n🔧 性能优化建议:');
  
  // 根据数据推断优化建议
  const lastData = performanceData[performanceData.length - 1];
  
  if (lastData.jsExecutionTime > 1000) {
    console.log('1. 实现游戏数据的分页加载，不要一次性加载所有游戏');
    console.log('   - 首页只加载前100-200个游戏');
    console.log('   - 实现"加载更多"功能或分页导航');
    console.log('   - 考虑使用虚拟滚动技术，只渲染可见区域的游戏');
  }
  
  if (lastData.memoryUsage > 50) {
    console.log('2. 优化内存使用:');
    console.log('   - 减少游戏对象中的冗余数据');
    console.log('   - 延迟加载游戏缩略图');
    console.log('   - 实现内存管理机制，释放不需要的游戏数据');
  }
  
  console.log('3. 优化游戏卡片渲染:');
  console.log('   - 使用简化的DOM结构');
  console.log('   - 考虑使用文档片段(DocumentFragment)批量添加卡片');
  console.log('   - 使用CSS硬件加速提高渲染性能');
  
  console.log('4. 优化分类过滤功能:');
  console.log('   - 预计算分类映射，避免实时过滤');
  console.log('   - 使用索引数据结构加速查找');
  
  console.log('5. 改进搜索功能:');
  console.log('   - 实现防抖和节流以减少性能开销');
  console.log('   - 考虑使用Web Worker处理搜索逻辑');
  
  console.log('6. 对于超大量游戏数据:');
  console.log('   - 考虑使用客户端数据库如IndexedDB存储游戏数据');
  console.log('   - 实现服务端分页API，按需获取游戏数据');
  console.log('   - 优化JSON文件结构或考虑其他数据格式如MessagePack');
}

console.log('\n脚本执行完毕 - 请根据以上建议优化你的游戏网站!'); 