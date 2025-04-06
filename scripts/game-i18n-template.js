// 游戏页面国际化函数模板
// 使用方式：将此文件中的代码复制到每个游戏页面，并替换游戏相关的描述文本
const GameI18N = {
  // 语言定义 - 针对游戏页面特定文本
  translations: {
    "zh": {
      "viewGame": "查看",
      "playNow": "开始游戏",
      "loading": "正在加载游戏，请稍候...",
      "fullscreen": "全屏模式",
      "relatedGames": "您可能也喜欢",
      "noRelatedGames": "暂无相关游戏",
      "loadFailed": "加载相关游戏失败",
      "loadingRelatedGames": "正在加载相关游戏...",
      "backToHome": "返回首页",
      "home": "首页",
      "aboutGame": "关于 GAME_TITLE", // 需替换
      "gameFeatures": "游戏特点",
      "howToStart": "如何开始",
      "freeToPlay": "完全免费游玩",
      "noDownload": "无需下载，即点即玩",
      "deviceSupport": "支持电脑和手机设备",
      "beautifulGraphics": "精美的游戏画面",
      "simpleControls": "简单易懂的操作",
      "allAges": "适合所有年龄段玩家",
      "advertisement": "广告",
      "startInstruction": "点击上方的\"开始游戏\"按钮，即可立即体验《GAME_TITLE》。游戏完全免费，无需下载，支持PC和移动设备。", // 需替换
      "copyright": "保留所有权利。",
      "aboutUs": "关于我们",
      "privacyPolicy": "隐私政策",
      "termsOfUse": "使用条款",
      "contactUs": "联系我们",
      "features": {
        "freeGame": "免费游戏",
        "online": "在线玩",
        "deviceFriendly": "全设备支持"
      },
      // 以下两项需要根据具体游戏替换
      "gameDescription": "《GAME_TITLE》是一款精彩的GAME_TYPE游戏。一款有趣的在线游戏，随时随地畅玩。无需下载，直接在浏览器中即可开始游戏，支持电脑和手机设备。点击\"开始游戏\"立即体验！",
      "gameDetailedDescription": "《GAME_TITLE》为玩家提供了精彩的游戏体验。这款游戏设计精良，玩法简单但富有深度，适合各年龄段的玩家。游戏画面精美，音效出色，为玩家创造了一个身临其境的游戏环境。"
    },
    "en": {
      "viewGame": "View",
      "playNow": "Play Now",
      "loading": "Loading game, please wait...",
      "fullscreen": "Fullscreen Mode",
      "relatedGames": "You May Also Like",
      "noRelatedGames": "No related games available",
      "loadFailed": "Failed to load related games",
      "loadingRelatedGames": "Loading related games...",
      "backToHome": "Back to Home",
      "home": "Home",
      "aboutGame": "About GAME_TITLE", // 需替换
      "gameFeatures": "Game Features",
      "howToStart": "How to Start",
      "freeToPlay": "Completely free to play",
      "noDownload": "No download required, just click and play",
      "deviceSupport": "Supports PC and mobile devices",
      "beautifulGraphics": "Beautiful game graphics",
      "simpleControls": "Simple and intuitive controls",
      "allAges": "Suitable for players of all ages",
      "advertisement": "Advertisement",
      "startInstruction": "Click the \"Play Now\" button above to experience GAME_TITLE immediately. The game is completely free, requires no download, and supports both PC and mobile devices.", // 需替换
      "copyright": "All Rights Reserved.",
      "aboutUs": "About Us",
      "privacyPolicy": "Privacy Policy",
      "termsOfUse": "Terms of Use",
      "contactUs": "Contact Us",
      "features": {
        "freeGame": "Free Game",
        "online": "Play Online",
        "deviceFriendly": "All Devices"
      },
      // 以下两项需要根据具体游戏替换
      "gameDescription": "GAME_TITLE is an exciting GAME_TYPE game. A fun online game that you can play anytime, anywhere. No download required, play directly in your browser, supports both PC and mobile devices. Click \"Play Now\" to experience it immediately!",
      "gameDetailedDescription": "GAME_TITLE offers players an exciting gaming experience. This well-designed game has simple gameplay but great depth, suitable for players of all ages. With beautiful graphics and excellent sound effects, it creates an immersive gaming environment."
    }
  },
  
  // 当前语言（从localStorage获取）
  currentLang: localStorage.getItem('preferred_language') || 'en',
  
  // 获取翻译文本
  t(key) {
    // 支持点notation访问嵌套结构
    const keys = key.split('.');
    let result = this.translations[this.currentLang];
    
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        return key; // 如果找不到翻译，返回原始键
      }
    }
    
    return result;
  },
  
  // 更新页面上的游戏相关文本
  updateGamePageTexts() {
    console.log(`正在应用游戏页面翻译，当前语言: ${this.currentLang}`);
    
    // 更新游戏按钮
    const playButton = document.querySelector('.play-button');
    if (playButton) {
      playButton.innerHTML = `<i class="fas fa-play-circle"></i> ${this.t('playNow')}`;
    }
    
    // 更新游戏描述（红框中的区域）
    const gameDescriptionElement = document.querySelector('.game-description');
    if (gameDescriptionElement) {
      gameDescriptionElement.textContent = this.t('gameDescription');
    }
    
    // 更新详细游戏描述（第二个红框区域）
    const gameDetailedDescriptionElement = document.querySelector('.game-content-seo .seo-content > p:first-child');
    if (gameDetailedDescriptionElement) {
      gameDetailedDescriptionElement.textContent = this.t('gameDetailedDescription');
    }
    
    // 更新加载文本
    const loadingText = document.querySelector('.loading-overlay p');
    if (loadingText) {
      loadingText.textContent = this.t('loading');
    }
    
    // 更新面包屑导航
    const breadcrumbHome = document.querySelector('.breadcrumb li:first-child a');
    if (breadcrumbHome) {
      breadcrumbHome.textContent = this.t('home');
    }
    
    // 更新返回首页按钮
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
      backBtn.innerHTML = `<i class="fas fa-home"></i> ${this.t('backToHome')}`;
    }
    
    // 更新相关游戏标题
    const relatedTitle = document.querySelector('.related-games h2');
    if (relatedTitle) {
      relatedTitle.textContent = this.t('relatedGames');
    }
    
    // 更新正在加载相关游戏的提示
    const loadingRelatedGames = document.querySelector('#related-games-container p');
    if (loadingRelatedGames && loadingRelatedGames.style.color === '#aaa') {
      loadingRelatedGames.textContent = this.t('loadingRelatedGames');
    }
    
    // 更新"关于游戏"标题
    const aboutTitle = document.querySelector('.game-content-seo h2');
    if (aboutTitle) {
      aboutTitle.textContent = this.t('aboutGame');
    }
    
    // 更新游戏特点标题
    const featuresTitle = document.querySelector('.game-content-seo h3:first-of-type');
    if (featuresTitle) {
      featuresTitle.textContent = this.t('gameFeatures');
    }
    
    // 更新如何开始标题
    const howToStartTitle = document.querySelector('.game-content-seo h3:nth-of-type(2)');
    if (howToStartTitle) {
      howToStartTitle.textContent = this.t('howToStart');
    }
    
    // 更新游戏特点列表
    const featuresList = document.querySelectorAll('.game-content-seo ul li');
    if (featuresList.length > 0) {
      const featureTexts = [
        this.t('freeToPlay'),
        this.t('noDownload'),
        this.t('deviceSupport'),
        this.t('beautifulGraphics'),
        this.t('simpleControls'),
        this.t('allAges')
      ];
      
      featuresList.forEach((item, index) => {
        if (index < featureTexts.length) {
          item.textContent = featureTexts[index];
        }
      });
    }
    
    // 更新如何开始说明
    const startInstructions = document.querySelector('.game-content-seo h3:nth-of-type(2) + p');
    if (startInstructions) {
      startInstructions.textContent = this.t('startInstruction');
    }
    
    // 更新广告标签
    const adLabel = document.querySelector('.ad-label');
    if (adLabel) {
      adLabel.textContent = this.t('advertisement');
    }
    
    // 更新特性文本
    document.querySelectorAll('.game-features .feature').forEach(feature => {
      const span = feature.querySelector('span');
      if (!span) return;
      
      const text = span.textContent.trim();
      if (text === '免费游戏' || text === 'Free Game') {
        span.textContent = this.t('features.freeGame');
      } else if (text === '在线玩' || text === 'Play Online') {
        span.textContent = this.t('features.online');
      } else if (text === '全设备支持' || text === 'All Devices') {
        span.textContent = this.t('features.deviceFriendly');
      }
    });
    
    // 更新页脚链接
    const footerLinks = document.querySelectorAll('footer .footer-links a');
    footerLinks.forEach(link => {
      if (link.textContent === '关于我们' || link.textContent === 'About Us') {
        link.textContent = this.t('aboutUs');
      } else if (link.textContent === '隐私政策' || link.textContent === 'Privacy Policy') {
        link.textContent = this.t('privacyPolicy');
      } else if (link.textContent === '使用条款' || link.textContent === 'Terms of Use') {
        link.textContent = this.t('termsOfUse');
      } else if (link.textContent === '联系我们' || link.textContent === 'Contact Us') {
        link.textContent = this.t('contactUs');
      }
    });
    
    // 更新版权信息
    const copyright = document.querySelector('.copyright');
    if (copyright) {
      copyright.textContent = `© ${new Date().getFullYear()} AllPopularGames. ${this.t('copyright')}`;
    }
    
    // 更新相关游戏卡片上的查看按钮
    document.querySelectorAll('.btn-small').forEach(btn => {
      if (btn.textContent === '查看' || btn.textContent === 'View') {
        btn.textContent = this.t('viewGame');
      }
    });
    
    console.log('游戏页面翻译完成');
  },
  
  // 监听语言变化并更新
  listenForLanguageChange() {
    window.addEventListener('languageChanged', (e) => {
      console.log(`检测到语言变更事件，新语言: ${e.detail.language}`);
      this.currentLang = e.detail.language;
      this.updateGamePageTexts();
    });
  },
  
  // 手动切换语言
  switchLanguage() {
    const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
    console.log(`手动切换语言至: ${newLang}`);
    this.currentLang = newLang;
    localStorage.setItem('preferred_language', newLang);
    this.updateGamePageTexts();
    
    // 触发语言变更事件，通知其他组件
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: newLang } 
    }));
    
    // 更新按钮文本
    const langBtn = document.querySelector('.btn-language');
    if (langBtn) {
      langBtn.textContent = newLang === 'zh' ? 'English' : '中文';
    }
  },
  
  // 初始化
  init() {
    console.log('初始化游戏页面国际化，当前语言：', this.currentLang);
    
    // 立即应用翻译
    this.updateGamePageTexts();
    
    // 监听语言变化
    this.listenForLanguageChange();
    
    // 为语言切换按钮添加事件
    const langBtn = document.querySelector('.btn-language');
    if (langBtn) {
      console.log('找到语言切换按钮，添加点击事件');
      // 移除可能存在的旧事件监听器
      langBtn.replaceWith(langBtn.cloneNode(true));
      
      // 重新获取按钮并添加事件
      const newLangBtn = document.querySelector('.btn-language');
      newLangBtn.addEventListener('click', () => this.switchLanguage());
      console.log('语言切换按钮事件已添加');
    } else {
      console.log('未找到语言切换按钮');
    }
  }
};

// 初始化游戏页面国际化
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM已加载完成，初始化游戏页面国际化');
  GameI18N.init();
}); 