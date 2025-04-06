/**
 * 前端性能监控脚本
 * 在浏览器中测量和记录性能指标
 */

// 在页面加载时开始监控
(function() {
  console.log('性能监控已启动');
  
  // 测量加载时间
  window.addEventListener('load', () => {
    // 使用Performance API获取时间戳
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReadyTime = perfData.domComplete - perfData.domLoading;
    const networkLatency = perfData.responseEnd - perfData.requestStart;
    const backendTime = perfData.responseStart - perfData.navigationStart;
    const frontendTime = perfData.loadEventEnd - perfData.responseEnd;
    
    // 报告基本时间指标
    console.group('📊 页面加载性能指标');
    console.log(`🕒 总加载时间: ${pageLoadTime}ms`);
    console.log(`⚡ DOM准备时间: ${domReadyTime}ms`);
    console.log(`🌐 网络延迟: ${networkLatency}ms`);
    console.log(`🖥️ 后端处理时间: ${backendTime}ms`);
    console.log(`🎨 前端处理时间: ${frontendTime}ms`);
    console.groupEnd();
    
    // 监控内存使用
    if (window.performance.memory) {
      const memoryInfo = window.performance.memory;
      console.group('📊 内存使用情况');
      console.log(`📈 已使用的JS堆大小: ${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB`);
      console.log(`⚠️ JS堆大小限制: ${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB`);
      console.groupEnd();
    }
    
    // 监控游戏数据加载情况
    setTimeout(() => {
      try {
        const games = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
        console.group('📊 游戏数据统计');
        console.log(`🎮 加载的游戏总数: ${games.length}`);
        
        // 统计游戏类型数量
        const gameTypes = {};
        games.forEach(game => {
          if (game.type) {
            const types = game.type.split(/[,&\/]/).map(t => t.trim());
            types.forEach(type => {
              gameTypes[type] = (gameTypes[type] || 0) + 1;
            });
          }
        });
        
        console.log('🎯 游戏类型统计:');
        Object.entries(gameTypes)
          .sort((a, b) => b[1] - a[1])
          .forEach(([type, count]) => {
            console.log(`  - ${type}: ${count}个游戏`);
          });
        
        // 统计标签数量
        const tagCounts = {
          hot: 0,
          new: 0,
          none: 0
        };
        
        games.forEach(game => {
          if (game.tag === 'hot') tagCounts.hot++;
          else if (game.tag === 'new') tagCounts.new++;
          else tagCounts.none++;
        });
        
        console.log('🏷️ 标签统计:');
        console.log(`  - HOT标签: ${tagCounts.hot}个游戏`);
        console.log(`  - NEW标签: ${tagCounts.new}个游戏`);
        console.log(`  - 无标签: ${tagCounts.none}个游戏`);
        
        console.groupEnd();
      } catch (error) {
        console.error('统计游戏数据时出错:', error);
      }
    }, 1000);
  });
  
  // 监控Web Vitals核心指标
  if ('PerformanceObserver' in window) {
    // 监控LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`📝 LCP (最大内容绘制): ${lastEntry.startTime}ms`);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP监控不可用', e);
    }
    
    // 监控FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0];
        const inputDelay = firstInput.processingStart - firstInput.startTime;
        console.log(`📝 FID (首次输入延迟): ${inputDelay}ms`);
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID监控不可用', e);
    }
    
    // 监控CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      let clsEntries = [];
      
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        });
        
        console.log(`📝 CLS (累积布局偏移): ${clsValue}`);
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS监控不可用', e);
    }
  }
  
  // 添加性能分析UI
  window.addEventListener('load', () => {
    setTimeout(() => {
      createPerformanceUI();
    }, 2000);
  });
  
  // 创建性能分析UI
  function createPerformanceUI() {
    // 创建UI容器
    const container = document.createElement('div');
    container.id = 'performance-monitor';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 15px;
      border-radius: 10px;
      font-family: monospace;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = '性能监控';
    title.style.margin = '0 0 10px 0';
    container.appendChild(title);
    
    // 添加游戏计数
    const gameCount = document.createElement('div');
    try {
      const games = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
      gameCount.textContent = `游戏数量: ${games.length}`;
    } catch (e) {
      gameCount.textContent = '游戏数量: 未知';
    }
    gameCount.style.marginBottom = '8px';
    container.appendChild(gameCount);
    
    // 添加内存使用
    const memoryUsage = document.createElement('div');
    if (window.performance.memory) {
      const memUsed = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
      const memTotal = Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024));
      memoryUsage.textContent = `内存使用: ${memUsed}MB / ${memTotal}MB`;
    } else {
      memoryUsage.textContent = '内存使用: 不可用';
    }
    memoryUsage.style.marginBottom = '8px';
    container.appendChild(memoryUsage);
    
    // 添加加载时间
    const loadTime = document.createElement('div');
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    loadTime.textContent = `页面加载时间: ${pageLoadTime}ms`;
    loadTime.style.marginBottom = '8px';
    container.appendChild(loadTime);
    
    // 添加DOM渲染时间
    const domTime = document.createElement('div');
    const domReadyTime = perfData.domComplete - perfData.domLoading;
    domTime.textContent = `DOM渲染时间: ${domReadyTime}ms`;
    container.appendChild(domTime);
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 2px 6px;
      cursor: pointer;
      font-size: 12px;
    `;
    closeBtn.onclick = () => container.remove();
    container.appendChild(closeBtn);
    
    // 添加到文档
    document.body.appendChild(container);
    
    // 定期更新内存使用
    if (window.performance.memory) {
      setInterval(() => {
        const memUsed = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
        const memTotal = Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024));
        memoryUsage.textContent = `内存使用: ${memUsed}MB / ${memTotal}MB`;
      }, 2000);
    }
  }

  // 错误跟踪
  window.addEventListener('error', function(event) {
    console.error('捕获到错误:', event.error ? event.error.message : event.message);
    
    // 如果在生产环境，可以发送错误日志到服务器
    const isProduction = window.location.hostname.includes('cloudflare') ||
                        !window.location.hostname.includes('localhost');
    
    if (isProduction) {
        // 记录错误但不阻塞用户体验
        setTimeout(() => {
            try {
                const errorInfo = {
                    message: event.error ? event.error.message : event.message,
                    source: event.filename || 'unknown',
                    lineno: event.lineno || 0,
                    colno: event.colno || 0,
                    stack: event.error ? event.error.stack : '',
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                };
                
                console.log('错误详情:', errorInfo);
                
                // 这里可以添加将错误发送到服务器的代码
                // 或者使用Cloudflare Worker记录错误
            } catch (e) {
                // 忽略错误处理过程中的错误
            }
        }, 0);
    }
    
    // 不阻止默认处理
    return false;
  });
})(); 