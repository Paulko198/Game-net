/**
 * GameLoader - 优化游戏加载体验的轻量级加载器
 * 用于解决Famobi游戏加载问题，提供更好的用户体验
 */
class GameLoader {
  /**
   * 初始化游戏加载器
   * @param {string} gameUrl - 游戏ID或URL路径
   * @param {HTMLElement} container - 游戏容器元素
   * @param {Object} options - 配置选项
   */
  constructor(gameUrl, container, options = {}) {
    // 基础配置
    this.baseUrl = options.baseUrl || 'https://play.famobi.com/wrapper/';
    this.gameUrl = gameUrl;
    this.container = container;
    this.isLoaded = false;
    this.isLoading = false;
    this.retryCount = 0;
    this.maxRetries = options.maxRetries || 2;
    this.loadTimeout = options.loadTimeout || 25000; // 25秒超时
    this.gameDomains = [
      'play.famobi.com',
      'games.cdn.famobi.com', 
      'api.famobi.com',
      'cdnjs.cloudflare.com'
    ];
    
    // 存储超时计时器
    this.timeoutId = null;
    
    // 创建事件监听器绑定
    this.handleIframeLoadBound = this.handleIframeLoad.bind(this);
    
    // 初始化UI元素
    this.initElements();
  }
  
  /**
   * 初始化UI元素
   */
  initElements() {
    // 确保容器有必要的样式
    this.container.classList.add('game-iframe-container');
    
    // 创建加载状态容器
    this.loadingContainer = document.createElement('div');
    this.loadingContainer.className = 'game-loading-container';
    
    // 创建加载动画
    this.spinner = document.createElement('div');
    this.spinner.className = 'loading-spinner';
    
    // 创建加载文本
    this.loadingText = document.createElement('div');
    this.loadingText.className = 'loading-text';
    this.loadingText.textContent = '游戏加载中...';
    
    // 创建进度条
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'loading-progress';
    this.progressBarFill = document.createElement('div');
    this.progressBarFill.className = 'loading-progress-fill';
    this.progressBar.appendChild(this.progressBarFill);
    
    // 创建错误信息容器
    this.errorContainer = document.createElement('div');
    this.errorContainer.className = 'loading-error';
    this.errorContainer.style.display = 'none';
    
    // 创建错误图标
    this.errorIcon = document.createElement('div');
    this.errorIcon.className = 'error-icon';
    this.errorIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
    
    // 创建错误消息
    this.errorMessage = document.createElement('div');
    this.errorMessage.className = 'error-message';
    this.errorMessage.textContent = '游戏加载失败';
    
    // 创建错误详情
    this.errorDetail = document.createElement('div');
    this.errorDetail.className = 'error-detail';
    this.errorDetail.textContent = '请检查您的网络连接并尝试重新加载';
    
    // 创建重试按钮
    this.retryButton = document.createElement('button');
    this.retryButton.className = 'retry-button';
    this.retryButton.textContent = '重试';
    this.retryButton.addEventListener('click', () => this.retry());
    
    // 组装错误容器
    this.errorContainer.appendChild(this.errorIcon);
    this.errorContainer.appendChild(this.errorMessage);
    this.errorContainer.appendChild(this.errorDetail);
    this.errorContainer.appendChild(this.retryButton);
    
    // 组装加载容器
    this.loadingContainer.appendChild(this.spinner);
    this.loadingContainer.appendChild(this.loadingText);
    this.loadingContainer.appendChild(this.progressBar);
    this.loadingContainer.appendChild(this.errorContainer);
    
    // 添加到容器
    this.container.appendChild(this.loadingContainer);
    
    // 创建iframe容器（但不添加，等待加载时添加）
    this.iframe = null;
  }
  
  /**
   * 开始加载游戏
   */
  load() {
    if (this.isLoading) return;
    this.isLoading = true;
    
    // 重置UI状态
    this.resetLoadingUI();
    
    // 预连接到游戏域名
    this.preconnectGameDomains();
    
    // 启动加载进度动画
    this.startProgressAnimation();
    
    // 创建游戏iframe
    setTimeout(() => {
      this.createGameIframe();
    }, 500);
    
    // 设置加载超时
    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, this.loadTimeout);
  }
  
  /**
   * 预连接到游戏相关域名以提高加载速度
   */
  preconnectGameDomains() {
    this.gameDomains.forEach(domain => {
      // 检查是否已经存在相同域名的预连接
      const exists = document.querySelector(`link[rel="preconnect"][href="https://${domain}"]`);
      if (!exists) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = `https://${domain}`;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }
  
  /**
   * 创建游戏iframe
   */
  createGameIframe() {
    // 如果已经有iframe，先移除
    if (this.iframe) {
      this.iframe.removeEventListener('load', this.handleIframeLoadBound);
      this.container.removeChild(this.iframe);
      this.iframe = null;
    }
    
    // 创建新iframe
    this.iframe = document.createElement('iframe');
    this.iframe.className = 'game-iframe';
    this.iframe.setAttribute('allowfullscreen', '');
    this.iframe.setAttribute('scrolling', 'no');
    
    // 构建游戏URL
    let gameFullUrl = this.gameUrl;
    
    // 检查是否需要添加前缀
    if (!this.gameUrl.includes('://')) {
      // 确保URL格式正确
      gameFullUrl = this.baseUrl + this.gameUrl;
    }
    
    // 设置iframe源
    this.iframe.src = gameFullUrl;
    
    // 添加加载事件监听器
    this.iframe.addEventListener('load', this.handleIframeLoadBound);
    
    // 添加到容器
    this.container.appendChild(this.iframe);
  }
  
  /**
   * 处理iframe加载事件
   */
  handleIframeLoad() {
    // 清除超时计时器
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    // 标记为已加载
    this.isLoaded = true;
    this.isLoading = false;
    
    // 显示游戏
    setTimeout(() => {
      this.showGame();
    }, 500);
    
    // 记录加载成功
    this.logGameLoad(true);
  }
  
  /**
   * 显示游戏
   */
  showGame() {
    // 隐藏加载UI
    this.loadingContainer.style.opacity = '0';
    setTimeout(() => {
      this.loadingContainer.style.display = 'none';
    }, 300);
    
    // 显示iframe
    if (this.iframe) {
      this.iframe.style.opacity = '1';
    }
  }
  
  /**
   * 处理加载超时
   */
  handleTimeout() {
    this.isLoading = false;
    
    // 记录加载失败
    this.logGameLoad(false);
    
    // 显示错误UI
    this.showError('游戏加载超时', '请检查您的网络连接并尝试重新加载');
  }
  
  /**
   * 显示错误信息
   */
  showError(message, detail) {
    // 停止进度条动画
    this.stopProgressAnimation();
    
    // 隐藏加载动画
    this.spinner.style.display = 'none';
    this.loadingText.style.display = 'none';
    this.progressBar.style.display = 'none';
    
    // 设置错误信息
    this.errorMessage.textContent = message || '游戏加载失败';
    this.errorDetail.textContent = detail || '请尝试重新加载';
    
    // 显示错误容器
    this.errorContainer.style.display = 'flex';
  }
  
  /**
   * 重试加载游戏
   */
  retry() {
    // 检查重试次数
    if (this.retryCount >= this.maxRetries) {
      this.showError('无法加载游戏', '已达到最大重试次数，请稍后再试');
      this.showAlternativeContent();
      return;
    }
    
    // 增加重试计数
    this.retryCount++;
    
    // 重置UI
    this.resetLoadingUI();
    
    // 重新加载
    this.load();
  }
  
  /**
   * 重置加载UI
   */
  resetLoadingUI() {
    // 显示加载容器
    this.loadingContainer.style.display = 'flex';
    this.loadingContainer.style.opacity = '1';
    
    // 显示加载动画
    this.spinner.style.display = 'block';
    this.loadingText.style.display = 'block';
    this.progressBar.style.display = 'block';
    
    // 隐藏错误容器
    this.errorContainer.style.display = 'none';
    
    // 重置进度条
    this.progressBarFill.style.width = '0%';
  }
  
  /**
   * 启动进度条动画
   */
  startProgressAnimation() {
    let progress = 0;
    const increment = () => {
      // 如果已经加载完成，直接设为100%
      if (this.isLoaded) {
        this.progressBarFill.style.width = '100%';
        return;
      }
      
      // 根据时间递增加载进度，但不超过95%
      if (progress < 95) {
        progress += Math.random() * 1.5;
        // 加载速度随时间减慢
        if (progress > 70) progress += Math.random() * 0.2;
        else if (progress > 50) progress += Math.random() * 0.5;
        else if (progress > 30) progress += Math.random() * 0.8;
        
        progress = Math.min(progress, 95);
        this.progressBarFill.style.width = `${progress}%`;
        this.loadingText.textContent = `游戏加载中... ${Math.floor(progress)}%`;
        
        // 继续动画
        setTimeout(increment, 200 + Math.random() * 300);
      }
    };
    
    // 启动动画
    increment();
  }
  
  /**
   * 停止进度条动画
   */
  stopProgressAnimation() {
    // 动画已通过setTimeout实现，不需要特别停止
    // 仅修改文本
    this.loadingText.textContent = '加载失败';
  }
  
  /**
   * 显示替代内容
   * 在多次尝试失败后显示
   */
  showAlternativeContent() {
    // 创建替代内容容器
    const altContainer = document.createElement('div');
    altContainer.className = 'alternative-content';
    
    // 创建标题
    const altTitle = document.createElement('h3');
    altTitle.textContent = '您可能还喜欢这些游戏';
    altContainer.appendChild(altTitle);
    
    // 创建替代游戏列表
    const altGames = document.createElement('div');
    altGames.className = 'alternative-games';
    
    // 查找相关游戏卡片
    const relatedGames = document.querySelectorAll('.related-games .game-card');
    
    if (relatedGames.length > 0) {
      // 使用已有的相关游戏
      relatedGames.forEach(gameCard => {
        const clone = gameCard.cloneNode(true);
        // 添加点击事件到克隆的游戏卡片
        clone.querySelector('.play-button').addEventListener('click', () => {
          const gameUrl = clone.getAttribute('data-game-url');
          if (gameUrl) {
            this.gameUrl = gameUrl;
            this.retryCount = 0;
            this.load();
            
            // 移除替代内容
            if (altContainer.parentNode) {
              altContainer.parentNode.removeChild(altContainer);
            }
          }
        });
        altGames.appendChild(clone);
      });
    } else {
      // 没有相关游戏时显示消息
      const noGamesMsg = document.createElement('p');
      noGamesMsg.textContent = '当前没有推荐游戏';
      altGames.appendChild(noGamesMsg);
    }
    
    // 添加替代游戏
    altContainer.appendChild(altGames);
    
    // 添加到错误容器
    this.errorContainer.appendChild(altContainer);
  }
  
  /**
   * 记录游戏加载情况
   * @param {boolean} success - 是否成功加载
   */
  logGameLoad(success) {
    // 检查谷歌分析是否存在
    if (typeof gtag !== 'undefined') {
      gtag('event', success ? 'game_load_success' : 'game_load_failure', {
        'event_category': 'game_loading',
        'event_label': this.gameUrl,
        'value': this.retryCount
      });
    }
    
    // 控制台记录
    console.log(`游戏${success ? '成功' : '失败'}加载: ${this.gameUrl}`, 
      success ? '' : `重试次数: ${this.retryCount}`);
  }
}

/**
 * 为页面上的所有游戏卡片初始化游戏加载器
 */
function initializeGameCards() {
  // 查找所有带有data-game-url属性的游戏卡片
  document.querySelectorAll('[data-game-url]').forEach(card => {
    const playButton = card.querySelector('.play-button') || card;
    
    // 如果已经绑定了事件，就跳过
    if (playButton.hasGameLoaderEvent) return;
    
    playButton.hasGameLoaderEvent = true;
    playButton.addEventListener('click', function() {
      const gameUrl = card.dataset.gameUrl;
      
      // 创建游戏容器
      const gameContainer = document.createElement('div');
      gameContainer.className = 'game-iframe-container';
      
      // 替换卡片或指定的容器
      const targetContainer = document.getElementById('game-container') || card;
      if (targetContainer.id === 'game-container') {
        // 如果是指定容器，清空内容后添加
        targetContainer.innerHTML = '';
        targetContainer.appendChild(gameContainer);
      } else {
        // 否则替换整个卡片
        card.parentNode.replaceChild(gameContainer, card);
      }
      
      // 初始化加载器并开始加载
      const loader = new GameLoader(gameUrl, gameContainer);
      loader.load();
    });
  });
}

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 预连接到游戏域名
  const domains = [
    'https://play.famobi.com',
    'https://games.cdn.famobi.com'
  ];
  
  domains.forEach(domain => {
    if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
  
  // 初始化游戏卡片
  initializeGameCards();
  
  // 如果页面URL中包含game参数，直接加载该游戏
  const urlParams = new URLSearchParams(window.location.search);
  const gameParam = urlParams.get('game');
  if (gameParam && document.getElementById('game-container')) {
    const gameContainer = document.getElementById('game-container');
    const loader = new GameLoader(gameParam, gameContainer);
    loader.load();
  }
});

// 导出GameLoader供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameLoader, initializeGameCards };
} 