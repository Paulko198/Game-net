// 全面的国际化模块
const I18N = {
  // 语言定义 - 完整的翻译映射表
  languages: {
    zh: {
      // 导航和分类
      home: '首页',
      puzzleGames: '解谜游戏',
      arcadeGames: '街机游戏',
      actionGames: '动作游戏',
      adventureGames: '冒险游戏',
      casualGames: '休闲游戏',
      racingGames: '赛车游戏',
      shootingGames: '射击游戏',
      sportsGames: '体育游戏',
      strategyGames: '策略游戏',
      multiplayerGames: '多人游戏',
      match3Games: '三消游戏',
      bubbleShooter: '泡泡射击',
      quizGames: '问答游戏',
      girlsGames: '女生游戏',
      jumpAndRunGames: '跳跃跑酷',
      skillGames: '技巧游戏',
      bestGames: '精选游戏',
      newGames: '新游戏',
      popularGames: '热门游戏',
      cardsGames: '卡牌游戏',
      dressUpGames: '换装游戏',
      makeUpGames: '化妆游戏',
      basketballGames: '篮球游戏',
      soccerGames: '足球游戏',
      educationalGames: '教育游戏',
      
      // 界面元素
      viewMore: '查看更多',
      login: '登录',
      search: '搜索游戏...',
      addGames: '从管理面板添加游戏',
      useTag: '使用标签',
      type: '类型',
      
      // 特性描述
      onlineGames: '在线游戏',
      noInstallation: '无需安装',
      deviceFriendly: '设备友好',
      playWithFriends: '与朋友一起玩',
      
      // 页面标题
      pageTitle: 'All Popular Games - 游戏合集',
      
      // 底部信息
      copyright: '版权所有',
      allRightsReserved: '保留所有权利',
      privacyPolicy: '隐私政策',
      termsOfService: '服务条款',
      contactUs: '联系我们'
    },
    en: {
      // 导航和分类
      home: 'Home',
      puzzleGames: 'Puzzle Games',
      arcadeGames: 'Arcade Games',
      actionGames: 'Action Games',
      adventureGames: 'Adventure Games',
      casualGames: 'Casual Games',
      racingGames: 'Racing Games',
      shootingGames: 'Shooting Games',
      sportsGames: 'Sports Games',
      strategyGames: 'Strategy Games',
      multiplayerGames: 'Multiplayer Games',
      match3Games: 'Match 3 Games',
      bubbleShooter: 'Bubble Shooter',
      quizGames: 'Quiz Games',
      girlsGames: 'Girls Games',
      jumpAndRunGames: 'Jump & Run Games',
      skillGames: 'Skill Games',
      bestGames: 'Best Games',
      newGames: 'New Games',
      popularGames: 'Popular Games',
      cardsGames: 'Cards Games',
      dressUpGames: 'Dress-up Games',
      makeUpGames: 'Make-up Games',
      basketballGames: 'Basketball Games',
      soccerGames: 'Soccer Games',
      educationalGames: 'Educational Games',
      
      // 界面元素
      viewMore: 'View More',
      login: 'Login',
      search: 'Search games...',
      addGames: 'Add games from admin panel',
      useTag: 'Use tag',
      type: 'Type',
      
      // 特性描述
      onlineGames: 'Online Games',
      noInstallation: 'No Installation',
      deviceFriendly: 'Device Friendly',
      playWithFriends: 'Play with Friends',
      
      // 页面标题
      pageTitle: 'All Popular Games - Game Collection',
      
      // 底部信息
      copyright: 'Copyright',
      allRightsReserved: 'All Rights Reserved',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      contactUs: 'Contact Us'
    }
  },
  
  // 分类名映射（用于匹配中英文分类）
  categoryMapping: {},
  
  // 当前语言
  currentLang: 'zh',
  
  // 获取翻译
  t(key) {
    return this.languages[this.currentLang][key] || key;
  },
  
  // 根据值查找键（反向查找）
  getKeyByValue(value, lang = 'zh') {
    for (const [key, val] of Object.entries(this.languages[lang])) {
      if (val === value) return key;
    }
    return null;
  },
  
  // 切换语言
  setLanguage(lang) {
    if (this.languages[lang]) {
      this.currentLang = lang;
      localStorage.setItem('preferred_language', lang);
      
      // 更新页面标题
      document.title = this.t('pageTitle');
      
      return true;
    }
    return false;
  },
  
  // 初始化
  init() {
    console.log('初始化国际化模块...');
    
    // 构建分类映射表
    this.buildCategoryMapping();
    
    // 从本地存储加载语言设置
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang && this.languages[savedLang]) {
      this.currentLang = savedLang;
      console.log(`从本地存储加载语言设置: ${savedLang}`);
    }
    
    // 更新页面标题
    document.title = this.t('pageTitle');
    
    // 添加语言切换按钮
    this.addLanguageSwitcher();
    
    // 初次应用翻译
    setTimeout(() => this.applyTranslations(), 100);
  },
  
  // 构建分类映射表（用于匹配不同语言版本的分类）
  buildCategoryMapping() {
    const zhLang = this.languages.zh;
    const enLang = this.languages.en;
    
    for (const key in zhLang) {
      if (enLang[key]) {
        this.categoryMapping[zhLang[key]] = key;
        this.categoryMapping[enLang[key]] = key;
      }
    }
    
    console.log('分类映射表构建完成');
  },
  
  // 添加语言切换器
  addLanguageSwitcher() {
    // 首先尝试在用户操作区域添加
    const userActions = document.querySelector('.user-actions');
    
    // 如果在主页找到用户操作区域
    if (userActions) {
      // 防止重复添加
      if (document.querySelector('.btn-language')) {
        return;
      }
      
      const langBtn = document.createElement('button');
      langBtn.className = 'btn-language';
      langBtn.textContent = this.currentLang === 'zh' ? 'English' : '中文';
      langBtn.style.cssText = `
        background-color: var(--tertiary-bg);
        color: var(--text-primary);
        border: 1px solid var(--separator);
        border-radius: 4px;
        padding: 6px 12px;
        margin-left: 10px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      `;
      
      // 添加悬停效果
      langBtn.onmouseover = function() { 
        this.style.backgroundColor = 'var(--accent-blue)';
        this.style.borderColor = 'var(--accent-blue)';
      };
      langBtn.onmouseout = function() { 
        if (I18N.currentLang === 'en' && this.textContent === '中文' || 
            I18N.currentLang === 'zh' && this.textContent === 'English') {
          this.style.backgroundColor = 'var(--tertiary-bg)';
          this.style.borderColor = 'var(--separator)';
        }
      };
      
      langBtn.addEventListener('click', () => {
        const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
        console.log(`切换语言至: ${newLang}`);
        this.setLanguage(newLang);
        langBtn.textContent = newLang === 'zh' ? 'English' : '中文';
        this.applyTranslations();
        
        // 触发语言变更事件，通知其他组件
        window.dispatchEvent(new CustomEvent('languageChanged', { 
          detail: { language: newLang } 
        }));
      });
      
      userActions.appendChild(langBtn);
      console.log('语言切换按钮已添加到用户操作区域');
    } 
    // 如果在游戏页面找不到用户操作区域，则尝试在页面头部添加
    else {
      // 防止重复添加
      if (document.querySelector('.btn-language')) {
        return;
      }
      
      // 尝试找到游戏页面的header区域
      const headerContent = document.querySelector('.header-content');
      if (headerContent) {
        const langBtn = document.createElement('button');
        langBtn.className = 'btn-language';
        langBtn.textContent = this.currentLang === 'zh' ? 'English' : '中文';
        langBtn.style.cssText = `
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          margin-left: 10px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        `;
        
        // 添加悬停效果
        langBtn.onmouseover = function() { 
          this.style.backgroundColor = '#3451b2';
        };
        langBtn.onmouseout = function() { 
          this.style.backgroundColor = '#4a6cf7';
        };
        
        langBtn.addEventListener('click', () => {
          const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
          console.log(`切换语言至: ${newLang}`);
          this.setLanguage(newLang);
          langBtn.textContent = newLang === 'zh' ? 'English' : '中文';
          this.applyTranslations();
          
          // 触发语言变更事件，通知游戏页面的元数据更新
          window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: newLang } 
          }));
        });
        
        headerContent.appendChild(langBtn);
        console.log('语言切换按钮已添加到游戏页面头部');
      } else {
        console.warn('未找到用户操作区域或页面头部，无法添加语言切换按钮');
      }
    }
  },
  
  // 应用翻译到页面元素
  applyTranslations() {
    console.log(`应用翻译，当前语言: ${this.currentLang}`);
    
    // 更新侧边栏
    this.updateSidebar();
    
    // 更新主要内容
    this.updateMainContent();
    
    // 更新其他界面元素
    this.updateUIElements();
    
    console.log('翻译应用完成');
  },
  
  // 更新侧边栏内容
  updateSidebar() {
    document.querySelectorAll('.sidebar-categories li span').forEach(span => {
      const fullText = span.textContent;
      const text = fullText.split(' (')[0].trim();
      const countMatch = fullText.match(/\((\d+)\)/);
      const count = countMatch ? ` (${countMatch[1]})` : '';
      
      // 获取分类键
      const key = this.getKeyByValue(text) || this.categoryMapping[text];
      if (key) {
        span.textContent = this.t(key) + count;
      }
    });
  },
  
  // 更新主内容区域
  updateMainContent() {
    // 更新分类标题
    document.querySelectorAll('.section-title').forEach(title => {
      const originalHTML = title.innerHTML;
      const text = title.textContent.split(' (')[0].trim();
      const countMatch = title.textContent.match(/\((\d+)\)/);
      const count = countMatch ? ` (${countMatch[1]})` : '';
      
      // 获取分类键
      const key = this.getKeyByValue(text) || this.categoryMapping[text];
      if (key) {
        // 保留原始HTML中的图标
        const iconMatch = originalHTML.match(/<i[^>]*><\/i>/);
        const icon = iconMatch ? iconMatch[0] + ' ' : '';
        title.innerHTML = icon + this.t(key) + count;
      }
    });
    
    // 更新查看更多链接
    document.querySelectorAll('.view-more').forEach(link => {
      const originalText = link.textContent;
      if (originalText.includes('查看更多') || originalText.includes('View More')) {
        const restText = originalText.replace(/查看更多|View More/g, '').trim();
        link.textContent = this.t('viewMore') + (restText ? ' ' + restText : '');
      }
    });
    
    // 更新空卡片内容
    document.querySelectorAll('.empty-card .game-card-content h3').forEach(h3 => {
      if (h3.textContent.includes('Add games from admin panel') || 
          h3.textContent.includes('从管理面板添加游戏')) {
        h3.textContent = this.t('addGames');
      }
    });
    
    document.querySelectorAll('.empty-card .game-card-content p').forEach(p => {
      if (p.textContent.includes('Use tag') || p.textContent.includes('使用标签')) {
        const tagMatch = p.textContent.match(/:\s*(.+)$/);
        const tag = tagMatch ? tagMatch[1].trim() : '';
        p.textContent = `${this.t('useTag')}: ${tag}`;
      } else if (p.textContent.includes('Type') || p.textContent.includes('类型')) {
        const typeMatch = p.textContent.match(/:\s*(.+)$/);
        const type = typeMatch ? typeMatch[1].trim() : '';
        p.textContent = `${this.t('type')}: ${type}`;
      }
    });
  },
  
  // 更新其他界面元素
  updateUIElements() {
    // 登录按钮
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
      if (loginBtn.textContent === '登录' || loginBtn.textContent === 'Login') {
        loginBtn.textContent = this.t('login');
      }
    }
    
    // 搜索框
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput && searchInput.placeholder) {
      if (searchInput.placeholder === '搜索游戏...' || 
          searchInput.placeholder === 'Search games...') {
        searchInput.placeholder = this.t('search');
      }
    }
    
    // 特色功能
    document.querySelectorAll('.feature span').forEach(span => {
      const text = span.textContent.trim();
      
      if (text.includes('Online Games') || text.includes('在线游戏')) {
        const numMatch = text.match(/\d+\+/);
        const num = numMatch ? numMatch[0] + ' ' : '';
        span.textContent = num + this.t('onlineGames');
      } else if (text === 'No Installation' || text === '无需安装') {
        span.textContent = this.t('noInstallation');
      } else if (text === 'Device Friendly' || text === '设备友好') {
        span.textContent = this.t('deviceFriendly'); 
      } else if (text === 'Play with Friends' || text === '与朋友一起玩') {
        span.textContent = this.t('playWithFriends');
      }
    });
    
    // 底部信息
    const footerLinks = document.querySelectorAll('footer a');
    footerLinks.forEach(link => {
      const text = link.textContent.trim();
      if (text === '隐私政策' || text === 'Privacy Policy') {
        link.textContent = this.t('privacyPolicy');
      } else if (text === '服务条款' || text === 'Terms of Service') {
        link.textContent = this.t('termsOfService');
      } else if (text === '联系我们' || text === 'Contact Us') {
        link.textContent = this.t('contactUs');
      }
    });
    
    // 版权信息
    const copyright = document.querySelector('footer p');
    if (copyright) {
      const year = new Date().getFullYear();
      copyright.textContent = `© ${year} AllPopularGames. ${this.t('allRightsReserved')}.`;
    }
  }
};

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化国际化模块
  I18N.init();
}); 