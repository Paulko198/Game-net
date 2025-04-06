/**
 * 游戏网站大数据量优化脚本
 * 针对大量游戏数据进行前端优化
 */

/**
 * 优化方案实现 - 应用于main.js中
 */

// 1. 分页加载游戏卡片
function implementPaginatedLoading() {
  // 每页游戏数量
  const GAMES_PER_PAGE = 50;
  let currentPage = 1;
  
  // 替代原有的displayGames函数
  function displayGamesPaginated(games, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 计算总页数
    const totalPages = Math.ceil(games.length / GAMES_PER_PAGE);
    
    // 清空容器
    container.innerHTML = '';
    
    // 计算当前页显示的游戏
    const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
    const endIndex = Math.min(startIndex + GAMES_PER_PAGE, games.length);
    const pageGames = games.slice(startIndex, endIndex);
    
    // 使用DocumentFragment批量添加游戏卡片
    const fragment = document.createDocumentFragment();
    
    // 添加游戏卡片
    pageGames.forEach(game => {
      const card = createGameCard(game);
      fragment.appendChild(card);
    });
    
    // 一次性添加到DOM
    container.appendChild(fragment);
    
    // 如果还有更多游戏，添加"加载更多"按钮
    if (currentPage < totalPages) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'load-more-btn';
      loadMoreBtn.textContent = '加载更多游戏';
      loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        displayGamesPaginated(games, containerId);
      });
      container.appendChild(loadMoreBtn);
    }
  }
  
  // 优化的游戏卡片创建函数
  function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.gameUrl = game.url;
    card.dataset.openMode = game.openMode;
    
    // 使用简化的HTML结构
    const thumbUrl = game.thumbUrl || 'images/game-placeholder.jpg';
    const tagHTML = game.tag ? 
      `<span class="game-tag tag-${game.tag}">${game.tag === 'hot' ? 'HOT' : 'NEW'}</span>` : '';
      
    // 使用模板字符串一次设置innerHTML
    card.innerHTML = `
      <img src="${thumbUrl}" alt="${game.title}" loading="lazy">
      ${tagHTML}
      <div class="game-card-content">
        <h3>${game.title}</h3>
        <p>${game.type}</p>
      </div>
    `;
    
    // 添加点击事件
    card.addEventListener('click', () => {
      console.log(`Loading game: ${game.title}, Mode: ${game.openMode}, URL: ${game.url}`);
      handleGameOpen(game.url, game.openMode);
    });
    
    // 添加鼠标悬停效果 - 使用CSS类替代内联样式
    card.addEventListener('mouseenter', () => {
      card.classList.add('card-hover');
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('card-hover');
    });
    
    return card;
  }
  
  return {
    displayGamesPaginated,
    resetPagination: () => { currentPage = 1; }
  };
}

// 2. 虚拟滚动实现
function implementVirtualScroll() {
  class VirtualScroller {
    constructor(options) {
      this.options = Object.assign({
        container: null,
        itemHeight: 200,
        buffer: 5,
        renderItem: null,
        totalItems: 0
      }, options);
      
      this.visibleItems = [];
      this.scrollHandler = this.onScroll.bind(this);
      this.lastScrollTop = 0;
      this.renderRange = { start: 0, end: 0 };
      
      this.initialize();
    }
    
    initialize() {
      const { container } = this.options;
      if (!container) return;
      
      // 创建内部结构
      container.style.position = 'relative';
      container.style.overflow = 'auto';
      container.style.willChange = 'transform';
      
      // 创建占位容器
      this.placeholder = document.createElement('div');
      this.placeholder.style.width = '100%';
      this.updatePlaceholderHeight();
      
      // 创建实际渲染的内容容器
      this.content = document.createElement('div');
      this.content.style.position = 'absolute';
      this.content.style.width = '100%';
      this.content.style.top = '0';
      this.content.style.left = '0';
      
      container.appendChild(this.placeholder);
      container.appendChild(this.content);
      
      // 添加滚动事件监听
      container.addEventListener('scroll', this.scrollHandler, { passive: true });
      
      // 初始渲染
      this.render();
    }
    
    updatePlaceholderHeight() {
      const { itemHeight, totalItems } = this.options;
      this.placeholder.style.height = `${itemHeight * totalItems}px`;
    }
    
    onScroll() {
      const { container } = this.options;
      const scrollTop = container.scrollTop;
      
      // 检测滚动方向和大小，决定是否需要重新渲染
      if (Math.abs(scrollTop - this.lastScrollTop) > (this.options.itemHeight / 2)) {
        this.lastScrollTop = scrollTop;
        this.render();
      }
    }
    
    getVisibleRange() {
      const { container, itemHeight, buffer, totalItems } = this.options;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      // 计算可见区域的起始和结束索引
      let start = Math.floor(scrollTop / itemHeight) - buffer;
      let end = Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer;
      
      // 边界检查
      start = Math.max(0, start);
      end = Math.min(totalItems - 1, end);
      
      return { start, end };
    }
    
    render() {
      const { renderItem } = this.options;
      if (!renderItem) return;
      
      const { start, end } = this.getVisibleRange();
      
      // 避免不必要的重新渲染
      if (start === this.renderRange.start && end === this.renderRange.end) {
        return;
      }
      
      this.renderRange = { start, end };
      
      // 清空当前内容
      this.content.innerHTML = '';
      
      // 创建一个文档片段减少重绘
      const fragment = document.createDocumentFragment();
      
      // 渲染可见区域的项目
      for (let i = start; i <= end; i++) {
        const item = renderItem(i);
        if (item) {
          const itemContainer = document.createElement('div');
          itemContainer.style.position = 'absolute';
          itemContainer.style.width = '100%';
          itemContainer.style.height = `${this.options.itemHeight}px`;
          itemContainer.style.top = `${i * this.options.itemHeight}px`;
          itemContainer.appendChild(item);
          fragment.appendChild(itemContainer);
        }
      }
      
      this.content.appendChild(fragment);
    }
    
    updateItems(totalItems) {
      this.options.totalItems = totalItems;
      this.updatePlaceholderHeight();
      this.render();
    }
    
    // 清理资源，需要在不再使用时调用
    destroy() {
      this.options.container.removeEventListener('scroll', this.scrollHandler);
    }
  }
  
  return VirtualScroller;
}

// 3. 优化游戏数据结构与搜索
function optimizeDataStructures() {
  // 为游戏数据创建索引
  function createGameIndexes(games) {
    const indexes = {
      byId: {},
      byType: {},
      byTag: { hot: [], new: [], none: [] }
    };
    
    games.forEach((game, index) => {
      // 以游戏标题的slug作为ID
      const id = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      indexes.byId[id] = index;
      
      // 按类型索引
      if (game.type) {
        const types = game.type.split(/[,&\/]/).map(t => t.trim());
        types.forEach(type => {
          if (!indexes.byType[type]) {
            indexes.byType[type] = [];
          }
          indexes.byType[type].push(index);
        });
      }
      
      // 按标签索引
      if (game.tag === 'hot') {
        indexes.byTag.hot.push(index);
      } else if (game.tag === 'new') {
        indexes.byTag.new.push(index);
      } else {
        indexes.byTag.none.push(index);
      }
    });
    
    return indexes;
  }
  
  // 使用索引优化分类过滤
  function optimizedFilterByCategory(category, games, indexes) {
    if (category === 'Home') {
      return games; // 返回所有游戏
    }
    
    if (category === 'hot' || category === 'new') {
      return indexes.byTag[category].map(index => games[index]);
    }
    
    if (indexes.byType[category]) {
      return indexes.byType[category].map(index => games[index]);
    }
    
    // 回退到模糊匹配
    return games.filter(game => {
      if (!game.type) return false;
      const types = game.type.split(/[,&\/]/).map(t => t.trim());
      return types.some(type => 
        type === category || 
        type.includes(category) || 
        category.includes(type)
      );
    });
  }
  
  return {
    createGameIndexes,
    optimizedFilterByCategory
  };
}

// 4. 游戏缩略图延迟加载优化
function implementLazyLoading() {
  // 使用Intersection Observer API实现真正的惰性加载
  function setupImageLazyLoading() {
    // 如果浏览器不支持Intersection Observer，退回到基础实现
    if (!('IntersectionObserver' in window)) {
      return function(element) {
        // 简单的基于视图的加载实现
        setTimeout(() => {
          if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
          }
        }, 200);
      };
    }
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          // 加载真实图片
          if (image.dataset.src) {
            image.src = image.dataset.src;
            image.removeAttribute('data-src');
            // 图片加载后停止观察
            observer.unobserve(image);
          }
        }
      });
    }, {
      rootMargin: '50px 0px', // 提前50px加载
      threshold: 0.01 // 只需少量可见即开始加载
    });
    
    return function(element) {
      imageObserver.observe(element);
    };
  }
  
  // 优化的游戏卡片图片处理
  function createLazyLoadingGameCard(game, lazyLoader) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    // 使用空白占位符作为初始src，实际图片URL放在data-src
    const placeholderUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3C/svg%3E';
    const thumbUrl = game.thumbUrl || 'images/game-placeholder.jpg';
    
    const image = document.createElement('img');
    image.src = placeholderUrl;
    image.setAttribute('data-src', thumbUrl);
    image.alt = game.title;
    image.loading = 'lazy'; // 使用浏览器原生懒加载作为备份
    
    // 应用懒加载
    lazyLoader(image);
    
    // 添加卡片内容
    const tagHTML = game.tag ? 
      `<span class="game-tag tag-${game.tag}">${game.tag === 'hot' ? 'HOT' : 'NEW'}</span>` : '';
    
    const content = document.createElement('div');
    content.className = 'game-card-content';
    content.innerHTML = `
      <h3>${game.title}</h3>
      <p>${game.type}</p>
    `;
    
    card.appendChild(image);
    if (tagHTML) {
      const tagElement = document.createElement('div');
      tagElement.innerHTML = tagHTML;
      card.appendChild(tagElement.firstChild);
    }
    card.appendChild(content);
    
    return card;
  }
  
  return {
    setupImageLazyLoading,
    createLazyLoadingGameCard
  };
}

// 5. Web Worker优化搜索
function implementWebWorkerSearch() {
  // 创建Web Worker代码
  function createSearchWorker() {
    const workerCode = `
      // 搜索游戏数据的Web Worker
      
      // 当接收到主线程消息时执行
      self.onmessage = function(e) {
        const { games, searchTerm } = e.data;
        
        if (!games || !searchTerm) {
          self.postMessage({ error: 'Invalid search parameters' });
          return;
        }
        
        // 执行搜索
        const results = searchGames(games, searchTerm);
        
        // 返回结果给主线程
        self.postMessage({ results });
      };
      
      // 搜索游戏函数
      function searchGames(games, term) {
        const searchTerm = term.toLowerCase();
        
        return games.filter(game => {
          // 搜索标题
          if (game.title && game.title.toLowerCase().includes(searchTerm)) {
            return true;
          }
          
          // 搜索类型
          if (game.type && game.type.toLowerCase().includes(searchTerm)) {
            return true;
          }
          
          // 如果有其他字段需要搜索，可以在这里添加
          
          return false;
        });
      }
    `;
    
    // 创建Blob对象
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    // 创建一个指向Blob的URL
    const workerUrl = URL.createObjectURL(blob);
    // 使用URL创建Worker
    const worker = new Worker(workerUrl);
    
    return worker;
  }
  
  // 使用Web Worker执行搜索
  function setupWorkerSearch() {
    let searchWorker;
    
    try {
      searchWorker = createSearchWorker();
    } catch (error) {
      console.error('创建Web Worker失败:', error);
      // 如果无法创建Worker，返回同步搜索函数
      return function syncSearch(games, term, callback) {
        const results = games.filter(game => {
          const searchTerm = term.toLowerCase();
          return (
            (game.title && game.title.toLowerCase().includes(searchTerm)) ||
            (game.type && game.type.toLowerCase().includes(searchTerm))
          );
        });
        callback(results);
      };
    }
    
    // 返回异步搜索函数
    return function asyncSearch(games, term, callback) {
      // 设置消息处理函数
      searchWorker.onmessage = function(e) {
        if (e.data.results) {
          callback(e.data.results);
        } else if (e.data.error) {
          console.error('搜索错误:', e.data.error);
          callback([]);
        }
      };
      
      // 发送搜索请求到Worker
      searchWorker.postMessage({ games, searchTerm: term });
    };
  }
  
  return {
    setupWorkerSearch
  };
}

// 6. 内存优化
function implementMemoryOptimization() {
  // 游戏对象简化
  function optimizeGameObject(game) {
    // 只保留必要字段，减少内存占用
    return {
      title: game.title,
      type: game.type,
      url: game.url,
      thumbUrl: game.thumbUrl,
      openMode: game.openMode,
      tag: game.tag || '',
      originalUrl: game.originalUrl
    };
  }
  
  // 批量优化游戏数据
  function optimizeGameData(games) {
    return games.map(optimizeGameObject);
  }
  
  // 内存使用监控与管理
  function setupMemoryManager() {
    let isMemoryLow = false;
    const memoryLimit = 150; // MB
    
    // 检查内存使用
    function checkMemory() {
      if (window.performance && window.performance.memory) {
        const usedMemory = window.performance.memory.usedJSHeapSize / (1024 * 1024);
        // 如果内存使用接近限制，触发内存优化
        if (usedMemory > memoryLimit && !isMemoryLow) {
          isMemoryLow = true;
          return true;
        } else if (usedMemory < memoryLimit * 0.7 && isMemoryLow) {
          isMemoryLow = false;
        }
      }
      return false;
    }
    
    // 清理不必要的资源
    function cleanup() {
      // 清除不可见游戏卡片的部分DOM
      const hiddenCards = document.querySelectorAll('.game-card:not(:visible)');
      hiddenCards.forEach(card => {
        // 移除事件监听器但保留基本结构
        const clone = card.cloneNode(true);
        card.parentNode.replaceChild(clone, card);
      });
      
      // 触发垃圾回收
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {
          console.log('无法强制垃圾回收');
        }
      }
    }
    
    return {
      checkMemory,
      cleanup
    };
  }
  
  return {
    optimizeGameObject,
    optimizeGameData,
    setupMemoryManager
  };
}

/**
 * 导出所有优化函数
 */
function applyOptimizations() {
  const { displayGamesPaginated, resetPagination } = implementPaginatedLoading();
  const VirtualScroller = implementVirtualScroll();
  const { createGameIndexes, optimizedFilterByCategory } = optimizeDataStructures();
  const { setupImageLazyLoading, createLazyLoadingGameCard } = implementLazyLoading();
  const { asyncSearch } = implementWebWorkerSearch();
  const { setupMemoryManager } = implementMemoryOptimization();
  
  // 应用内存管理
  const memoryManager = setupMemoryManager();
  
  // 初始化延迟加载
  setupImageLazyLoading();
  
  console.log('所有优化已应用，分页加载和延迟加载已启用');
  
  return {
    // 直接返回可用的优化函数
    displayGamesPaginated,
    resetPagination,
    VirtualScroller,
    createGameIndexes,
    optimizedFilterByCategory,
    createLazyLoadingGameCard,
    asyncSearch,
    memoryManager
  };
}

// 在Node.js环境中，导出优化模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    implementPaginatedLoading,
    implementVirtualScroll,
    optimizeDataStructures,
    implementLazyLoading,
    implementWebWorkerSearch,
    implementMemoryOptimization,
    applyOptimizations
  };
}

// 在浏览器环境中，将优化函数绑定到全局对象
if (typeof window !== 'undefined') {
  // 直接绑定到window对象
  window.applyOptimizations = applyOptimizations;
}

// 如果直接运行此脚本，输出使用说明
if (typeof require !== 'undefined' && require.main === module) {
  console.log('游戏网站大数据量优化脚本');
  console.log('=============================');
  console.log('此脚本提供多种优化方法，用于处理大量游戏数据情况下的前端性能优化。');
  console.log('使用方法:');
  console.log('1. 在浏览器中直接引入此脚本');
  console.log('2. 调用 GameOptimizations.applyOptimizations() 应用优化');
  console.log('3. 也可以单独引入特定的优化模块');
  console.log('');
  console.log('提供的优化包括:');
  console.log('- 分页加载游戏卡片');
  console.log('- 虚拟滚动实现');
  console.log('- 游戏数据结构与搜索优化');
  console.log('- 游戏缩略图延迟加载');
  console.log('- Web Worker优化搜索');
  console.log('- 内存使用优化');
  console.log('');
  console.log('针对大量游戏数据时的性能问题，建议:');
  console.log('- 游戏数量 < 500: 使用基本的分页和懒加载优化');
  console.log('- 游戏数量 500-2000: 添加数据结构优化和Web Worker搜索');
  console.log('- 游戏数量 > 2000: 启用所有优化，包括虚拟滚动和内存管理');
} 