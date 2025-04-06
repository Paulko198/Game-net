// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    console.log('GameNet 大型游戏平台已加载');
    
    // 检测环境
    const isProduction = window.location.hostname.includes('cloudflare') || 
                         !window.location.hostname.includes('localhost');
    console.log(`当前运行环境: ${isProduction ? '生产环境' : '开发环境'}`);
    
    // 应用大数据量优化设置
    const ENABLE_OPTIMIZATIONS = true;
    const GAMES_THRESHOLD = 500; // 触发优化的游戏数量阈值
    
    // 加载优化模块(如果已启用)
    if (ENABLE_OPTIMIZATIONS) {
        console.log('正在加载性能优化模块...');
        // 异步加载优化脚本
        const script = document.createElement('script');
        script.src = 'scripts/optimize-for-large-data.js';
        script.onload = function() {
            console.log('性能优化模块已加载，将在需要时应用');
        };
        document.head.appendChild(script);
    }
    
    // 保存当前侧边栏状态
    let activeCategoryElement = null;
    let activeCategory = 'Home';
    
    // 初始化
    adjustGameGrids();
    loadGamesAndInitialize();
    
    // 检查本地存储状态并应用
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('main');
    
    // 应用本地存储的状态
    if (sidebar && main && navToggle) {
        console.log('找到导航切换按钮和相关元素，应用已保存状态...');
        
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (sidebarCollapsed) {
            console.log('从本地存储恢复侧边栏折叠状态');
            sidebar.classList.add('sidebar-collapsed');
            main.classList.add('content-expanded');
            navToggle.classList.add('active');
            
            // 隐藏文本
            document.querySelectorAll('.sidebar-categories li span').forEach(span => {
                span.style.opacity = '0';
            });
        } else {
            console.log('侧边栏默认为展开状态');
            sidebar.classList.remove('sidebar-collapsed');
            main.classList.remove('content-expanded');
            navToggle.classList.remove('active');
        }
    } else {
        console.error('无法找到导航切换按钮或相关元素!');
        if (!navToggle) console.error('- 未找到导航切换按钮');
        if (!sidebar) console.error('- 未找到侧边栏');
        if (!main) console.error('- 未找到主内容区域');
    }
    
    // Control game grid layout
    function adjustGameGrids() {
        const gameGrids = document.querySelectorAll('.games-grid');
        const windowWidth = window.innerWidth;
        
        gameGrids.forEach(grid => {
            const availableWidth = grid.offsetWidth;
            const gameCards = grid.querySelectorAll('.game-card');
            
            // Adjust game card size and layout based on different screen sizes
            if (windowWidth <= 480) {
                grid.style.maxWidth = '350px';
            } else if (windowWidth <= 580) {
                grid.style.maxWidth = '500px';
            } else if (windowWidth <= 768) {
                grid.style.maxWidth = '700px';
            } else if (windowWidth <= 1100) {
                grid.style.maxWidth = '900px';
            } else {
                grid.style.maxWidth = '1200px';
            }
        });
    }
    
    // 加载游戏数据并初始化页面
    function loadGamesAndInitialize() {
        console.log('加载游戏数据...');
        // 尝试从localStorage读取游戏数据
        const storedGames = localStorage.getItem('allpopulargames_games');
        
        if (storedGames) {
            const games = JSON.parse(storedGames);
            console.log(`从localStorage加载了 ${games.length} 个游戏`);
            
            // 使用新的分类管理器初始化
            categoryManager.initialize(games);
            
            // 处理并显示游戏
            processAndDisplayGames(games);
            
            // 更新侧边栏分类
            updateSidebarCategories(games);
            
            // 初始化搜索功能
            initializeSearch();
            
            // 延迟加载图片
            setupImageLazyLoading();
            
            // 添加滚动监听以懒加载元素
            setupScrollHandler();
            
            // 标记初始化完成
            isStartupDone = true;
        } else {
            console.log('本地没有游戏数据，尝试从服务器加载...');
            
            // 尝试从服务器获取游戏数据
            fetch('/top50games.json')
        .then(response => {
                    if (!response.ok) throw new Error('获取游戏数据失败');
            return response.json();
        })
                .then(games => {
                    console.log(`从服务器加载了 ${games.length} 个游戏`);
                    
                    // 保存到localStorage
                    localStorage.setItem('allpopulargames_games', JSON.stringify(games));
                    
                    // 使用新的分类管理器初始化
                    categoryManager.initialize(games);
                    
                    // 处理并显示游戏
                    processAndDisplayGames(games);
                
                // 更新侧边栏分类
                    updateSidebarCategories(games);
                    
                    // 初始化搜索功能
                    initializeSearch();
                    
                    // 延迟加载图片
                    setupImageLazyLoading();
                    
                    // 添加滚动监听以懒加载元素
                    setupScrollHandler();
                    
                    // 标记初始化完成
                    isStartupDone = true;
            })
            .catch(error => {
                    console.error('加载游戏数据失败:', error);
                    showNotification('无法加载游戏数据，请刷新页面重试', 'error');
                });
        }
    }
    
    // 从游戏数据中提取分类并更新侧边栏
    function updateSidebarCategories(games) {
        console.log('正在更新侧边栏分类...');
        
        // 获取侧边栏分类列表容器
        const sidebarCategoriesList = document.querySelector('.sidebar-categories');
        if (!sidebarCategoriesList) {
            console.error('无法找到侧边栏分类列表元素');
            return;
        }
        
        // 使用DocumentFragment进行批量DOM操作
        const fragment = document.createDocumentFragment();
        
        // 首先添加Home分类（首页）
        const homeLi = document.createElement('li');
        homeLi.className = categoryManager.activeCategory === 'Home' ? 'active' : '';
        homeLi.innerHTML = `<i class="fas fa-home category-icon"></i> <a href="index.html"><span>首页</span></a>`;
        fragment.appendChild(homeLi);
        
        // 获取按游戏数量排序的分类
        const sortedCategories = categoryManager.getSortedCategories();
        
        // 添加排序后的分类到侧边栏
        sortedCategories.forEach(({category, displayName, count}) => {
            // 跳过Home分类（已单独处理）
            if (category === 'Home') return;
            
            // 创建分类URL
            const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const categoryUrl = `category/${categorySlug}.html`;
            
            // 获取图标
            const icon = getCategoryIconClass(category);
            
            // 创建分类列表项
            const li = document.createElement('li');
            li.className = categoryManager.activeCategory === category ? 'active' : '';
            li.innerHTML = `<i class="${icon} category-icon"></i> <a href="${categoryUrl}"><span>${displayName} (${count})</span></a>`;
            fragment.appendChild(li);
        });
        
        // 清空并一次性更新DOM
        sidebarCategoriesList.innerHTML = '';
        sidebarCategoriesList.appendChild(fragment);
        
        console.log(`已更新侧边栏，共 ${sortedCategories.length + 1} 个分类`);
        
        // 如果侧边栏处于折叠状态，隐藏文本
        if (document.querySelector('.sidebar').classList.contains('sidebar-collapsed')) {
            document.querySelectorAll('.sidebar-categories li span').forEach(span => {
                span.style.opacity = '0';
            });
        }
        
        // 绑定分类点击事件
        attachCategoryClickEvents();
    }
    
    // 根据分类名称获取对应的图标类
    function getCategoryIconClass(category) {
        // 分类与图标的映射关系
        const iconMap = {
            // 主要分类
            'Action': 'fas fa-running',
            'Adventure': 'fas fa-mountain',
            'Casual': 'fas fa-smile',
            'Puzzle': 'fas fa-puzzle-piece',
            'Racing': 'fas fa-car',
            'Shooting': 'fas fa-bullseye',
            'Sports': 'fas fa-futbol',
            'Match 3': 'fas fa-th',
            'Bubble Shooter': 'fas fa-bullseye',
            'Quiz': 'fas fa-question',
            'Girls': 'fas fa-female',
            'Jump & Run': 'fas fa-running',
            
            // 扩展分类
            'Basketball': 'fas fa-basketball-ball',
            'Beauty': 'fas fa-magic',
            'Bike': 'fas fa-bicycle',
            'Car': 'fas fa-car-side',
            'Card': 'fas fa-cards',
            'Clicker': 'fas fa-mouse-pointer',
            'Dress Up': 'fas fa-tshirt',
            'Driving': 'fas fa-steering-wheel',
            'Escape': 'fas fa-door-open',
            'FPS': 'fas fa-crosshairs',
            'Horror': 'fas fa-ghost',
            'IO': 'fas fa-globe',
            'Mahjong': 'fas fa-th',
            'Minecraft': 'fas fa-cubes',
            'Multiplayer': 'fas fa-users',
            'Pool': 'fas fa-circle',
            'Soccer': 'fas fa-futbol',
            'Stickman': 'fas fa-child',
            'Strategy': 'fas fa-chess',
            'Tower Defense': 'fas fa-chess-rook',
            'Two Players': 'fas fa-user-friends',
            
            // 特殊标签
            'hot': 'fas fa-fire',
            'new': 'fas fa-star'
        };
        
        // 返回对应的图标类，如果没有映射则使用默认图标
        return iconMap[category] || 'fas fa-gamepad';
    }
    
    // 为分类项绑定点击事件
    function attachCategoryClickEvents() {
        console.log('绑定分类点击事件...');
        
        // 使用事件委托，将事件绑定到父容器上
        const sidebarCategories = document.querySelector('.sidebar-categories');
        if (!sidebarCategories) return;
        
        // 移除现有事件监听器（如果有）
        const newSidebar = sidebarCategories.cloneNode(true);
        sidebarCategories.parentNode.replaceChild(newSidebar, sidebarCategories);
        
        // 使用事件委托添加点击事件
        newSidebar.addEventListener('click', (event) => {
            // 阻止默认行为
            event.preventDefault();
            
            // 查找被点击的元素
            let target = event.target;
            
            // 向上查找直到找到li元素或a元素
            let targetLi = null;
            let targetA = null;
            
            while (target && target !== newSidebar) {
                if (target.tagName === 'LI') {
                    targetLi = target;
                } else if (target.tagName === 'A') {
                    targetA = target;
                }
                target = target.parentElement;
            }
            
            // 如果没有找到有效目标，则退出
            if (!targetLi) return;
            
            // 查找分类名称 - 首先尝试从span获取
            const span = targetLi.querySelector('span');
            if (!span) return;
            
            // 提取分类名称（去除数量部分）
            const fullText = span.textContent.trim();
            const categoryName = fullText.split(' (')[0];
            
            console.log(`点击分类: "${categoryName}"`);
            
            // 特殊处理首页
            if (categoryName === '首页') {
                console.log('处理首页点击事件');
                // 直接设置活动分类为Home，不需要跳转
                categoryManager.setActiveCategory('Home');
                // 如果点击的是链接元素，阻止默认跳转行为
                if (targetA && window.location.pathname.indexOf('index.html') > -1) {
                    return false;
                }
                return;
            }
            
            // 检查是否在主页
            if (!window.location.pathname.endsWith('index.html') && 
                !window.location.pathname.endsWith('/') &&
                !window.location.pathname.endsWith('/Gamenet/')) {
                // 不在主页，跳转到主页并带上分类参数
                window.location.href = `index.html?category=${encodeURIComponent(categoryName)}`;
                return;
            }
            
            // 设置活动分类
            try {
                categoryManager.setActiveCategory(categoryName);
            } catch (error) {
                console.error('设置活动分类时出错:', error);
                
                // 回退方案：直接过滤内容
                document.querySelectorAll('.games-section').forEach(section => {
                    const title = section.querySelector('.section-title')?.textContent.trim().split(' (')[0];
                    if (title === categoryName || title?.includes(categoryName) || categoryName.includes(title)) {
                        section.style.display = 'block';
                        section.scrollIntoView({ behavior: 'smooth' });
                    } else if (categoryName !== '首页') {
                        section.style.display = 'none';
                    }
                });
            }
        });
        
        console.log('分类点击事件绑定完成');
    }
    
    // 处理并显示各类游戏
    function processAndDisplayGames(games) {
        console.log('处理并显示游戏分类...');
        
        // 检查是否需要应用优化
        const shouldApplyOptimizations = ENABLE_OPTIMIZATIONS && games.length > GAMES_THRESHOLD;
        
        if (shouldApplyOptimizations && window.applyOptimizations) {
            console.log(`正在为${games.length}个游戏应用性能优化...`);
            // 在这里调用优化脚本中的函数
            window.optimizedDisplayGames = window.applyOptimizations();
        }
        
        // 创建分类映射
        const categoryMapping = {
            // 特殊标签
            'hot': { selector: 'popular-games', title: '热门游戏', icon: 'fas fa-fire' },
            'new': { selector: 'new-games', title: '新游戏', icon: 'fas fa-star' },
            
            // 主要分类
            'Action': { selector: 'action-adventure-games', title: '动作游戏', icon: 'fas fa-running' },
            'Adventure': { selector: 'adventure-games', title: '冒险游戏', icon: 'fas fa-mountain' },
            'Casual': { selector: 'casual-games', title: '休闲游戏', icon: 'fas fa-smile' },
            'Puzzle': { selector: 'puzzle-games', title: '解谜游戏', icon: 'fas fa-puzzle-piece' },
            'Racing': { selector: 'racing-games', title: '赛车游戏', icon: 'fas fa-car' },
            'Car': { selector: 'racing-games', title: '赛车游戏', icon: 'fas fa-car' },
            'Cars': { selector: 'cars-games', title: '汽车游戏', icon: 'fas fa-car-side' },
            'Driving': { selector: 'racing-games', title: '赛车游戏', icon: 'fas fa-car' },
            'Shooting': { selector: 'shooting-games', title: '射击游戏', icon: 'fas fa-bullseye' },
            'FPS': { selector: 'shooting-games', title: '射击游戏', icon: 'fas fa-crosshairs' },
            'Sports': { selector: 'sports-games', title: '体育游戏', icon: 'fas fa-futbol' },
            'Sport': { selector: 'sports-games', title: '体育游戏', icon: 'fas fa-futbol' },
            'Basketball': { selector: 'sports-games', title: '体育游戏', icon: 'fas fa-basketball-ball' },
            'Soccer': { selector: 'sports-games', title: '体育游戏', icon: 'fas fa-futbol' },
            'Strategy': { selector: 'strategy-games', title: '策略游戏', icon: 'fas fa-chess' },
            'Tower Defense': { selector: 'strategy-games', title: '策略游戏', icon: 'fas fa-chess-rook' },
            'Time Management & Strategy': { selector: 'time-management-strategy-games', title: '时间管理与策略游戏', icon: 'fas fa-clock' },
            'Multiplayer': { selector: 'multiplayer-games', title: '多人游戏', icon: 'fas fa-users' },
            'IO': { selector: 'multiplayer-games', title: '多人游戏', icon: 'fas fa-globe' },
            'Two Players': { selector: 'multiplayer-games', title: '多人游戏', icon: 'fas fa-user-friends' },
            'Match 3': { selector: 'match3-games', title: '三消游戏', icon: 'fas fa-th' },
            'Bubble Shooter': { selector: 'bubble-shooter-games', title: '泡泡射击', icon: 'fas fa-bullseye' },
            'Breakout': { selector: 'breakout-games', title: '打砖块游戏', icon: 'fas fa-cube' },
            'Quiz': { selector: 'quiz-games', title: '问答游戏', icon: 'fas fa-question' },
            'Girls': { selector: 'girls-games', title: '女生游戏', icon: 'fas fa-female' },
            'Dress-up': { selector: 'dress-up-games', title: '换装游戏', icon: 'fas fa-tshirt' },
            'Make-up': { selector: 'make-up-games', title: '化妆游戏', icon: 'fas fa-magic' },
            'Cooking and Baking': { selector: 'cooking-baking-games', title: '烹饪烘焙游戏', icon: 'fas fa-utensils' },
            'Jump & Run': { selector: 'jump-run-games', title: '跳跃跑酷', icon: 'fas fa-running' },
            'Arcade': { selector: 'arcade-games', title: '街机游戏', icon: 'fas fa-gamepad' },
            'Best': { selector: 'best-games', title: '精选游戏', icon: 'fas fa-award' },
            'Cards': { selector: 'cards-games', title: '卡牌游戏', icon: 'fas fa-cards' },
            'Educational': { selector: 'educational-games', title: '教育游戏', icon: 'fas fa-graduation-cap' },
            'Skill': { selector: 'skill-games', title: '技巧游戏', icon: 'fas fa-hand-paper' },
            'Tamagotchi': { selector: 'tamagotchi-games', title: '电子宠物游戏', icon: 'fas fa-paw' }
        };
        
        // 创建分类游戏映射
        const categoryGames = {};
        
        // 初始化所有分类的游戏数组
        Object.values(categoryMapping).forEach(({selector}) => {
            categoryGames[selector] = [];
        });
        
        // 创建反向映射表以跟踪主页中实际分类和对应的原始分类
        const selectorToCategoryMap = {};
        Object.entries(categoryMapping).forEach(([category, {selector}]) => {
            if (!selectorToCategoryMap[selector]) {
                selectorToCategoryMap[selector] = [];
            }
            selectorToCategoryMap[selector].push(category);
        });
        
        // 分类游戏
        games.forEach(game => {
            // 处理标签分类（热门和新游戏）
            if (game.tag && categoryMapping[game.tag]) {
                categoryGames[categoryMapping[game.tag].selector].push(game);
            }
            
            // 处理游戏类型分类
            if (game.type) {
                const types = game.type.split(/[,&\/]/).map(t => t.trim());
                types.forEach(type => {
                    if (categoryMapping[type]) {
                        categoryGames[categoryMapping[type].selector].push(game);
                    }
                });
            }
        });
        
        // 使用DocumentFragment进行高效DOM操作
        const mainContainer = document.querySelector('main');
        if (!mainContainer) return;
        
        // 获取欢迎横幅
        const welcomeBanner = document.querySelector('.welcome-banner');
        const fragment = document.createDocumentFragment();
        
        // 如果已有分类区域，先移除
        let nextSibling = welcomeBanner ? welcomeBanner.nextElementSibling : null;
        while (nextSibling) {
            const current = nextSibling;
            nextSibling = current.nextElementSibling;
            if (current.classList.contains('games-section')) {
                mainContainer.removeChild(current);
            }
        }
        
        // 按游戏数量排序分类
        const sortedCategorySections = [];
        
        // 先处理优先级分类（热门和新游戏）
        categoryManager.priorityCategories.forEach(priorityCategory => {
            Object.entries(categoryMapping).forEach(([category, {selector, title, icon}]) => {
                if (category.toLowerCase() === priorityCategory) {
                    const gamesList = categoryGames[selector];
                    if (gamesList && gamesList.length > 0) {
                        sortedCategorySections.push({
                            selector,
                            title,
                            icon,
                            count: gamesList.length,
                            games: gamesList,
                            score: 1000 + gamesList.length, // 给优先分类一个高基础分
                            originalCategories: selectorToCategoryMap[selector] || [category]
                        });
                    }
                }
            });
        });
        
        // 处理其他分类
        Object.entries(categoryMapping).forEach(([category, {selector, title, icon}]) => {
            // 跳过已处理的优先分类
            if (categoryManager.priorityCategories.includes(category.toLowerCase())) {
                return;
            }
            
            const gamesList = categoryGames[selector];
            if (gamesList && gamesList.length > 0) {
                // 检查此选择器是否已经存在于排序分类中
                const existingSection = sortedCategorySections.find(s => s.selector === selector);
                if (!existingSection) {
                    sortedCategorySections.push({
                        selector,
                        title,
                        icon,
                        count: gamesList.length,
                        games: gamesList,
                        score: gamesList.length, // 普通分类的分数就是游戏数量
                        originalCategories: selectorToCategoryMap[selector] || [category]
                    });
                }
            }
        });
        
        // 按分数排序（从高到低）
        sortedCategorySections.sort((a, b) => b.score - a.score);
        
        // 更新分类计数器以匹配实际在主页上显示的分类
        const updatedCategoryCounts = {...categoryManager.categoryCounts};
        
        // 使用DocumentFragment创建所有分类区域
        sortedCategorySections.forEach(({selector, title, icon, count, games, originalCategories}) => {
            // 更新分类计数器以匹配主页显示
            originalCategories.forEach(cat => {
                if (cat && cat !== 'Home') {
                    updatedCategoryCounts[cat] = count;
                }
            });
            
            // 创建分类区域
            const section = document.createElement('section');
            section.className = 'games-section';
            
            // 创建标题区域
            const headerDiv = document.createElement('div');
            headerDiv.className = 'section-header';
            
            const titleContainerDiv = document.createElement('div');
            titleContainerDiv.className = 'title-container';
            titleContainerDiv.style.display = 'flex';
            titleContainerDiv.style.justifyContent = 'center';
            titleContainerDiv.style.width = '100%';
            
            const titleH2 = document.createElement('h2');
            titleH2.className = 'section-title';
            titleH2.innerHTML = `<i class="${icon}"></i> ${title} (${count})`;
            
            const viewMoreLink = document.createElement('a');
            viewMoreLink.href = `category/${selector.replace('-games', '')}.html`;
            viewMoreLink.className = 'view-more';
            viewMoreLink.textContent = `查看更多 (${count})`;
            
            titleContainerDiv.appendChild(titleH2);
            titleContainerDiv.appendChild(viewMoreLink);
            headerDiv.appendChild(titleContainerDiv);
            
            // 创建游戏网格
            const gamesGrid = document.createElement('div');
            gamesGrid.className = 'games-grid';
            gamesGrid.id = selector;
            
            // 显示游戏（最多10个）
            const gamesToShow = games.slice(0, 10);
            
            // 使用内部DocumentFragment进行批量添加
            const cardsFragment = document.createDocumentFragment();
            
            if (gamesToShow.length === 0) {
                // 如果没有游戏，显示空卡片
                const emptyCard = document.createElement('div');
                emptyCard.className = 'game-card empty-card';
                emptyCard.innerHTML = `
                    <div class="game-card-content">
                        <h3>Add games from admin panel</h3>
                        <p>Type: ${title}</p>
                    </div>
                `;
                cardsFragment.appendChild(emptyCard);
            } else {
                // 添加游戏卡片
                gamesToShow.forEach(game => {
                    const card = createGameCard(game);
                    cardsFragment.appendChild(card);
                });
            }
            
            // 一次性将所有卡片添加到网格
            gamesGrid.appendChild(cardsFragment);
            
            // 直接组装分类区域
            section.appendChild(headerDiv);
            section.appendChild(gamesGrid);
            
            // 添加到文档片段
            fragment.appendChild(section);
        });
        
        // 将所有内容一次性添加到主容器
        mainContainer.insertBefore(fragment, welcomeBanner ? welcomeBanner.nextSibling : null);
        
        console.log(`已显示 ${sortedCategorySections.length} 个游戏分类，按游戏数量排序`);
        
        // 更新categoryManager中的分类计数值
        categoryManager.categoryCounts = updatedCategoryCounts;
        
        // 重新更新侧边栏以显示准确的游戏计数
        updateSidebarCategories(games);
    }
    
    // 在指定区域显示游戏
    const GAMES_PER_PAGE = 50; // 主页外的每页显示游戏数量
    let currentPage = 1;
    
    function displayGames(games, containerId, showPagination = true) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 计算总页数
        const totalPages = Math.ceil(games.length / GAMES_PER_PAGE);
        
        // 如果是第一页，清空容器
        if (currentPage === 1) {
            container.innerHTML = '';
        }
        
        // 计算当前页显示的游戏
        const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
        let endIndex;
        
        // 如果不需要分页（在主页上），限制显示游戏数量为10个
        if (!showPagination) {
            endIndex = Math.min(10, games.length);
        } else {
            endIndex = Math.min(startIndex + GAMES_PER_PAGE, games.length);
        }
        
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
        
        // 如果需要分页并且还有更多游戏，添加"加载更多"按钮
        if (showPagination && currentPage < totalPages) {
            // 移除旧的按钮（如果存在）
            const oldBtn = container.querySelector('.load-more-btn');
            if (oldBtn) container.removeChild(oldBtn);
            
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.textContent = '加载更多游戏';
            loadMoreBtn.addEventListener('click', () => {
                currentPage++;
                displayGames(games, containerId);
                
                // 初始化新加载图片的延迟加载
                setupImageLazyLoading();
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
        
        // 创建游戏卡片内容
        // 使用空白占位符作为初始src，实际图片URL放在data-src
        const placeholderUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" style="background-color:%23f0f0f0"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3ELoading...%3C/text%3E%3C/svg%3E';
        const thumbUrl = game.thumbUrl || 'images/game-placeholder.jpg';
        const tagHTML = game.tag ? 
            `<span class="game-tag tag-${game.tag}">${game.tag === 'hot' ? 'HOT' : 'NEW'}</span>` : '';
            
        // 使用模板字符串一次设置innerHTML
        card.innerHTML = `
            <img src="${placeholderUrl}" data-src="${thumbUrl}" alt="${game.title}" class="lazy-image">
            ${tagHTML}
            <div class="game-card-content">
                <h3>${game.title}</h3>
                <p>${game.type}</p>
            </div>
        `;
        
        // 添加点击事件
        card.addEventListener('click', () => {
            handleGameOpen(game.url, game.openMode);
        });
        
        // 添加鼠标悬停效果 - 使用CSS类替代JS样式
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
        
        return card;
    }
    
    // 图片延迟加载功能
    function setupImageLazyLoading() {
        // 检查浏览器是否支持Intersection Observer
        if (!('IntersectionObserver' in window)) {
            console.log('浏览器不支持Intersection Observer，使用基础延迟加载');
            
            // 回退方案：直接加载所有图片
            document.querySelectorAll('img.lazy-image').forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.remove('lazy-image');
                    img.classList.add('loaded');
                }
            });
            
            return;
        }
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    // 加载真实图片
                    if (image.dataset.src) {
                        image.src = image.dataset.src;
                        image.classList.add('loaded');
                        image.removeAttribute('data-src');
                        image.classList.remove('lazy-image');
                        // 图片加载后停止观察
                        observer.unobserve(image);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px', // 提前50px加载
            threshold: 0.01 // 只需少量可见即开始加载
        });
        
        // 将所有带有data-src的图片添加到观察列表
        document.querySelectorAll('img.lazy-image').forEach(img => {
            imageObserver.observe(img);
        });
        
        console.log('图片延迟加载已初始化，监控', document.querySelectorAll('img.lazy-image').length, '张图片');
    }
    
    // 在页面加载完成后初始化延迟加载
    document.addEventListener('DOMContentLoaded', () => {
        console.log('页面加载完成，初始化分类管理器...');
        
        // 获取已加载的游戏数据
        const games = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
        if (games.length > 0) {
            // 初始化分类管理器
            categoryManager.initialize(games);
            
            // 检查URL参数中是否有分类
            const urlParams = new URLSearchParams(window.location.search);
            const categoryParam = urlParams.get('category');
            
            if (categoryParam) {
                console.log(`从URL参数中检测到分类: ${categoryParam}`);
                // 根据URL参数设置活动分类
                try {
                    categoryManager.setActiveCategory(categoryParam);
                } catch (error) {
                    console.error('设置活动分类时出错:', error);
                }
            }
        } else {
            console.warn('尚未加载游戏数据，分类管理器将在数据加载后初始化');
        }
        
        // 在游戏加载后设置图片延迟加载
        setTimeout(setupImageLazyLoading, 500);
    });
    
    // 监听滚动事件，确保在滚动时也初始化新出现的延迟加载图片
    window.addEventListener('scroll', debounce(setupImageLazyLoading, 200));
    
    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Game card click events for initial cards
    const initialGameCards = document.querySelectorAll('.game-card.empty-card');
    
    initialGameCards.forEach(card => {
        card.addEventListener('click', () => {
            alert('请使用管理面板添加游戏。');
        });
    });
    
    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.toLowerCase().trim();
                if (searchTerm) {
                    console.log(`Searching for games: ${searchTerm}`);
                    // Search logic
                    searchGames(searchTerm);
                }
            }
        });
    }
    
    // Login button event
    const loginButton = document.querySelector('.btn-login');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Login button clicked');
            alert('登录功能正在开发中。敬请期待！');
        });
    }
    
    // Search function simulation
    function searchGames(term) {
        // 获取所有游戏数据
        const allGames = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
        const shouldUseOptimized = ENABLE_OPTIMIZATIONS && 
                                  allGames.length > GAMES_THRESHOLD && 
                                  window.optimizedDisplayGames && 
                                  window.optimizedDisplayGames.asyncSearch;
        
        // 创建搜索结果容器（如果不存在）
        let searchResultsContainer = document.getElementById('search-results-container');
        
        if (!searchResultsContainer) {
            const mainContent = document.querySelector('main');
            searchResultsContainer = document.createElement('div');
            searchResultsContainer.id = 'search-results-container';
            searchResultsContainer.className = 'games-section search-results';
            searchResultsContainer.innerHTML = `
                <h2>搜索结果: "${term}"</h2>
                <div class="game-grid" id="search-results"></div>
            `;
            
            if (mainContent) {
                mainContent.prepend(searchResultsContainer);
            } else {
                document.body.appendChild(searchResultsContainer);
            }
        } else {
            // 更新标题
            const title = searchResultsContainer.querySelector('h2');
            if (title) {
                title.textContent = `搜索结果: "${term}"`;
            }
            
            // 显示搜索结果容器
            searchResultsContainer.style.display = 'block';
        }
        
        // 使用优化搜索或标准搜索
        if (shouldUseOptimized) {
            console.log('使用优化搜索功能');
            
            window.optimizedDisplayGames.asyncSearch(allGames, term, (results) => {
                if (results.length > 0) {
                    // 显示搜索结果
                    window.optimizedDisplayGames.displayGamesPaginated(results, 'search-results');
                    
                    // 滚动到搜索结果
                    searchResultsContainer.scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert(`没有找到与"${term}"相关的游戏`);
                    searchResultsContainer.style.display = 'none';
                }
            });
        } else {
            // 标准搜索方法
            const results = allGames.filter(game => {
                const title = game.title.toLowerCase();
                const type = (game.type || '').toLowerCase();
                const description = (game.description || '').toLowerCase();
                return title.includes(term) || type.includes(term) || description.includes(term);
            });
            
            if (results.length > 0) {
                // 显示搜索结果
                displayGames(results, 'search-results');
                
                // 滚动到搜索结果
                searchResultsContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert(`没有找到与"${term}"相关的游戏`);
                searchResultsContainer.style.display = 'none';
            }
        }
    }
    
    // 页面加载完成后检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
        console.log(`从URL参数中检测到分类: ${categoryParam}`);
        // URL参数处理会在categoryManager.initialize中完成
    }
    
    // 搜索相关功能
    function initializeSearch() {
        const searchInput = document.querySelector('.search-bar input');
        const searchContainer = document.querySelector('.search-bar');
        
        if (!searchInput || !searchContainer) return;
        
        // 添加搜索按钮
        const searchButton = document.createElement('button');
        searchButton.className = 'search-button';
        searchButton.innerHTML = '<i class="fas fa-search"></i>';
        searchContainer.appendChild(searchButton);
        
        // 添加建议容器
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions';
        searchContainer.appendChild(suggestionsContainer);
        
        // 防抖函数
        let debounceTimer;
        
        // 监听输入
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const term = searchInput.value.trim().toLowerCase();
                if (term.length >= 1) {
                    showSearchSuggestions(term);
                } else {
                    suggestionsContainer.style.display = 'none';
                }
            }, 300);
        });
        
        // 保留原有的回车搜索功能
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.toLowerCase().trim();
                if (searchTerm) {
                    console.log(`搜索游戏: ${searchTerm}`);
                    searchGames(searchTerm);
                    suggestionsContainer.style.display = 'none';
                }
            }
        });
        
        // 点击搜索按钮
        searchButton.addEventListener('click', () => {
            const term = searchInput.value.trim();
            if (term) {
                searchGames(term);
                suggestionsContainer.style.display = 'none';
            }
        });
        
        // 点击其他区域关闭建议
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }
    
    // 显示搜索建议
    function showSearchSuggestions(term) {
        const games = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
        const suggestionsContainer = document.querySelector('.search-suggestions');
        
        if (!suggestionsContainer) return;
        
        // 过滤匹配的游戏
        const matches = games.filter(game => {
            const title = game.title.toLowerCase();
            const type = (game.type || '').toLowerCase();
            return title.includes(term) || type.includes(term);
        }).slice(0, 5); // 最多显示5个建议
        
        if (matches.length > 0) {
            suggestionsContainer.innerHTML = matches.map(game => `
                <div class="suggestion-item" data-url="${game.url}" data-mode="${game.openMode}">
                    <img src="${game.thumbUrl || 'images/game-placeholder.jpg'}" class="suggestion-thumb" alt="${game.title}">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${game.title}</div>
                        <small class="suggestion-type">${game.type || ''}</small>
                    </div>
                </div>
            `).join('');
            
            // 为每个建议项添加点击事件
            suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const url = item.dataset.url;
                    const mode = item.dataset.openMode;
                    handleGameOpen(url, mode);
                    suggestionsContainer.style.display = 'none';
                    searchInput.value = item.querySelector('.suggestion-title').textContent;
                });
            });
            
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }
    
    // 处理游戏打开
    function handleGameOpen(url, mode) {
        // 获取游戏数据
        const games = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
        const game = games.find(g => g.url === url);
        
        if (!game) {
            alert('游戏数据不存在');
            return;
        }
        
        console.log(`Opening game: ${game.title}, Mode: ${mode}, URL: ${url}`);
        
        switch (mode) {
            case 'internal':
                // 直接打开内部游戏页面
                window.location.href = url;
                break;
                
            case 'iframe':
                // 直接打开游戏URL（已经是静态页面）
                window.location.href = url;
                break;
                
            case 'external':
                // 询问是否访问外部网站
                if (confirm(`这将在外部网站打开 ${game.title}。是否继续？`)) {
                    window.open(url, '_blank');
                }
                break;
                
            case 'redirect':
                // 重定向模式 - 直接打开游戏详情页面
                window.location.href = url;
                break;
                
            default:
                // 如果没有指定打开模式，尝试使用游戏对象中的模式
                if (game.openMode) {
                    handleGameOpen(url, game.openMode);
                } else {
                    alert('游戏正在开发中，敬请期待！');
                }
        }
    }
    
    // 初始化搜索功能
    initializeSearch();
    
    // 诊断分类点击问题
    function diagnoseCategoryIssues() {
        console.log('开始诊断分类点击问题...');
        
        // 获取所有分类项
        const categoryItems = document.querySelectorAll('.sidebar-categories li');
        console.log(`发现 ${categoryItems.length} 个侧边栏分类项`);
        
        // 检查每个分类项
        categoryItems.forEach((item, index) => {
            const span = item.querySelector('span');
            if (!span) {
                console.warn(`分类项 #${index+1} 没有span元素`);
                return;
            }
            
            const categoryText = span.textContent.trim();
            const categoryName = categoryText.split(' (')[0];
            
            console.log(`分类 #${index+1}: "${categoryName}" (完整文本: "${categoryText}")`);
            
            // 查找主内容区域中对应的分类
            let found = false;
            document.querySelectorAll('.games-section').forEach(section => {
                const titleElement = section.querySelector('.section-title');
                if (!titleElement) return;
                
                const sectionTitle = titleElement.textContent.trim();
                const sectionName = sectionTitle.split(' (')[0];
                
                // 尝试匹配
                if (categoryManager.matchCategory(categoryName, sectionName)) {
                    found = true;
                    console.log(`  ✓ 匹配到主内容区域: "${sectionName}"`);
                }
            });
            
            if (!found && categoryName !== '首页') {
                console.warn(`  ✗ 未找到主内容区域匹配: "${categoryName}"`);
            }
        });
        
        console.log('分类诊断完成');
    }
    
    // 在页面加载完成后执行诊断
    document.addEventListener('DOMContentLoaded', () => {
        // 延迟执行诊断，确保所有内容都已加载
        setTimeout(diagnoseCategoryIssues, 2000);
    });

    // 添加页面加载完成后的诊断函数，检查导航切换按钮的状态和事件
    setTimeout(() => {
        diagnoseSidebarToggleIssue();
    }, 2000); // 延迟2秒执行诊断，确保不会与初始事件绑定冲突
    
    // 检查页面URL参数
    checkUrlParameters();
});

// 诊断侧边栏切换问题
function diagnoseSidebarToggleIssue() {
    console.log('开始诊断导航切换按钮问题...');
    
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('main');
    
    if (!navToggle) {
        console.error('导航切换按钮不存在！');
        return;
    }
    
    if (!sidebar) {
        console.error('侧边栏元素不存在！');
        return;
    }
    
    if (!main) {
        console.error('主内容区域不存在！');
        return;
    }
    
    console.log('导航切换按钮状态：', {
        'active类': navToggle.classList.contains('active'),
        'z-index': getComputedStyle(navToggle).zIndex,
        'position': getComputedStyle(navToggle).position,
        '可见性': getComputedStyle(navToggle).visibility,
        '透明度': getComputedStyle(navToggle).opacity
    });
    
    console.log('侧边栏状态：', {
        '折叠类': sidebar.classList.contains('sidebar-collapsed'),
        'z-index': getComputedStyle(sidebar).zIndex,
        '宽度': getComputedStyle(sidebar).width
    });
    
    // 检查本地存储状态
    const savedState = localStorage.getItem('sidebarCollapsed');
    console.log('本地存储的侧边栏状态:', savedState);
}

// 检查URL参数
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
        console.log(`URL中检测到分类参数: ${categoryParam}`);
        
        // 如果分类管理器已初始化，设置活动分类
        if (typeof categoryManager !== 'undefined') {
            categoryManager.setActiveCategory(categoryManager.normalizeCategory(categoryParam));
        } else {
            console.warn('分类管理器尚未初始化，无法设置分类');
        }
    }
}

// 显示系统通知
function showSystemNotification(title, message, type = 'info') {
    // 创建通知容器（如果不存在）
    let notificationContainer = document.getElementById('system-notifications');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'system-notifications';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `system-notification ${type}`;
    notification.style.backgroundColor = type === 'info' ? '#2196F3' : '#f44336';
    notification.style.color = '#fff';
    notification.style.padding = '15px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.width = '300px';
    notification.style.transition = 'opacity 0.3s';
    
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <strong>${title}</strong>
            <button style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">&times;</button>
        </div>
        <div>${message}</div>
    `;
    
    // 添加关闭按钮事件
    const closeBtn = notification.querySelector('button');
    closeBtn.addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // 添加到容器并自动消失
    notificationContainer.appendChild(notification);
    
    // 5秒后自动消失
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    return notification;
} 

// 全局变量和配置
const ENABLE_OPTIMIZATIONS = true;
const GAMES_THRESHOLD = 500; // 触发优化的游戏数量阈值
let isStartupDone = false;

// 添加分类状态管理器
const categoryManager = {
    activeCategory: 'Home',
    categoryCounts: {},
    priorityCategories: ['hot', 'new'],
    categoryMappings: {
        // 首页特殊映射
        'Home': '首页',
        '首页': 'Home',
        
        // 英文到中文的映射
        'Action': '动作游戏',
        'Adventure': '冒险游戏',
        'Casual': '休闲游戏',
        'Puzzle': '解谜游戏',
        'Racing': '赛车游戏',
        'Shooting': '射击游戏',
        'Sports': '体育游戏',
        'Strategy': '策略游戏',
        'Multiplayer': '多人游戏',
        'Match 3': '三消游戏',
        'Bubble Shooter': '泡泡射击',
        'Quiz': '问答游戏',
        'Girls': '女生游戏',
        'Jump & Run': '跳跃跑酷',
        
        // 中文到英文的映射
        '动作游戏': 'Action',
        '冒险游戏': 'Adventure',
        '休闲游戏': 'Casual',
        '解谜游戏': 'Puzzle',
        '赛车游戏': 'Racing',
        '射击游戏': 'Shooting',
        '体育游戏': 'Sports',
        '策略游戏': 'Strategy',
        '多人游戏': 'Multiplayer',
        '三消游戏': 'Match 3',
        '泡泡射击': 'Bubble Shooter',
        '问答游戏': 'Quiz',
        '女生游戏': 'Girls',
        '跳跃跑酷': 'Jump & Run'
    },
    
    // 初始化分类状态管理器
    initialize(games) {
        console.log('初始化分类状态管理器...');
        this.updateCategoryCounts(games);
        
        // 检查URL参数中是否有指定分类
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        
        if (categoryParam) {
            console.log(`从URL参数中检测到分类: ${categoryParam}`);
            this.setActiveCategory(this.normalizeCategory(categoryParam));
        }
    },
    
    // 更新各分类的游戏数量
    updateCategoryCounts(games) {
        this.categoryCounts = {};
        
        games.forEach(game => {
            // 处理type字段
            if (game.type) {
                const types = game.type.split(/[,&\/]/).map(t => t.trim());
                types.forEach(type => {
                    if (type) {
                        this.categoryCounts[type] = (this.categoryCounts[type] || 0) + 1;
                    }
                });
            }
            
            // 处理categories数组
            if (game.categories && Array.isArray(game.categories)) {
                game.categories.forEach(category => {
                    if (category) {
                        this.categoryCounts[category] = (this.categoryCounts[category] || 0) + 1;
                    }
                });
            }
            
            // 处理标签
            if (game.tag) {
                const tag = game.tag.toLowerCase();
                if (tag === 'hot' || tag === 'new') {
                    this.categoryCounts[tag] = (this.categoryCounts[tag] || 0) + 1;
                }
            }
        });
        
        console.log('分类数量统计完成:', this.categoryCounts);
    },
    
    // 设置当前活动分类
    setActiveCategory(category) {
        console.log(`设置活动分类: "${category}"`);
        
        // 处理特殊情况 - 首页
        if (category === '首页') {
            category = 'Home';
        }
        
        this.activeCategory = category;
        
        // 更新侧边栏状态
        this.updateSidebarActive();
        
        // 过滤主页内容
        this.filterMainContent();
        
        // 更新URL参数，但不刷新页面
        if (category !== 'Home') {
            const url = new URL(window.location);
            url.searchParams.set('category', category);
            window.history.pushState({}, '', url);
        } else {
            // 如果是首页，移除URL参数
            const url = new URL(window.location);
            url.searchParams.delete('category');
            window.history.pushState({}, '', url);
        }
        
        console.log(`活动分类设置完成: "${category}"`);
    },
    
    // 更新侧边栏活动状态
    updateSidebarActive() {
        // 移除之前的活动状态
        document.querySelector('.sidebar-categories li.active')?.classList.remove('active');
        
        // 设置新的活动状态
        const items = document.querySelectorAll('.sidebar-categories li');
        let found = false;
        
        for (const item of items) {
            const span = item.querySelector('span');
            if (!span) continue;
            
            const itemText = span.textContent.trim();
            const categoryName = itemText.split(' (')[0]; // 移除计数部分
            
            // 特殊处理首页
            if (this.activeCategory === 'Home' && categoryName === '首页') {
                item.classList.add('active');
                found = true;
                console.log('首页分类已标记为活动状态');
                break;
            }
            
            // 处理其他分类
            if (this.matchCategory(categoryName, this.activeCategory)) {
                item.classList.add('active');
                found = true;
                console.log(`侧边栏分类 "${categoryName}" 已标记为活动状态`);
                break;
            }
        }
        
        console.log(`侧边栏活动状态更新: ${found ? '找到匹配' : '未找到匹配'}`);
    },
    
    // 过滤主内容区域
    filterMainContent() {
        console.log(`过滤主内容: "${this.activeCategory}"`);
        
        // 如果是Home，显示所有分类
        if (this.activeCategory === 'Home') {
            console.log('显示所有分类（首页模式）');
            document.querySelectorAll('.games-section').forEach(section => {
                section.style.display = 'block';
            });
            
            // 隐藏提示信息（如果存在）
            const notFoundMessage = document.getElementById('category-not-found');
            if (notFoundMessage) {
                notFoundMessage.style.display = 'none';
            }
            
            return;
        }
        
        // 创建一个标记，记录是否找到任何匹配的分类
        let foundMatch = false;
        
        // 处理其他分类
        document.querySelectorAll('.games-section').forEach(section => {
            const titleElement = section.querySelector('.section-title');
            if (!titleElement) return;
            
            const sectionTitle = titleElement.textContent.trim().split(' (')[0]; // 移除计数部分
            const gamesGrid = section.querySelector('.games-grid');
            if (!gamesGrid) return;
            
            // 特殊处理：热门游戏和新游戏分区始终显示
            const isSpecialSection = this.priorityCategories.some(
                pCat => sectionTitle.includes(this.getCategoryDisplayName(pCat))
            );
            
            if (isSpecialSection) {
                // 特殊分区保持显示
                section.style.display = 'block';
                
                // 过滤游戏卡片
                this.filterGameCards(gamesGrid, this.activeCategory);
            }
            else if (this.matchCategory(sectionTitle, this.activeCategory)) {
                // 显示匹配的分类区域
                section.style.display = 'block';
                foundMatch = true;
                
                // 确保所有游戏卡片都可见
                gamesGrid.querySelectorAll('.game-card').forEach(card => {
                    card.style.display = '';
                });
                
                // 滚动到该分类
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // 隐藏其他分类
                section.style.display = 'none';
            }
        });
        
        // 如果未找到任何匹配，显示一个提示信息
        if (!foundMatch && this.activeCategory !== 'Home') {
            console.log(`未找到与 "${this.activeCategory}" 匹配的分类区域`);
            
            // 创建提示信息元素（如果不存在）
            let notFoundMessage = document.getElementById('category-not-found');
            if (!notFoundMessage) {
                notFoundMessage = document.createElement('div');
                notFoundMessage.id = 'category-not-found';
                notFoundMessage.className = 'notification';
                notFoundMessage.style.textAlign = 'center';
                notFoundMessage.style.padding = '20px';
                notFoundMessage.style.marginTop = '20px';
                notFoundMessage.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                notFoundMessage.style.borderRadius = '5px';
                
                const mainContent = document.querySelector('main');
                if (mainContent) {
                    // 插入到欢迎横幅后面
                    const welcomeBanner = document.querySelector('.welcome-banner');
                    if (welcomeBanner && welcomeBanner.nextSibling) {
                        mainContent.insertBefore(notFoundMessage, welcomeBanner.nextSibling);
                    } else {
                        mainContent.appendChild(notFoundMessage);
                    }
                }
            }
            
            // 更新提示信息
            notFoundMessage.innerHTML = `
                <p>未找到 "${this.activeCategory}" 分类的游戏。</p>
                <p>请尝试选择其他分类或返回<a href="#" onclick="categoryManager.setActiveCategory('Home'); return false;">首页</a>查看所有游戏。</p>
            `;
            notFoundMessage.style.display = 'block';
        } else {
            // 隐藏提示信息（如果存在）
            const notFoundMessage = document.getElementById('category-not-found');
            if (notFoundMessage) {
                notFoundMessage.style.display = 'none';
            }
        }
    },
    
    // 过滤游戏卡片
    filterGameCards(container, category) {
        const gameCards = container.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            const typeElement = card.querySelector('p');
            if (!typeElement) return;
            
            const gameType = typeElement.textContent.trim();
            if (!gameType) return;
            
            // 检查游戏类型是否匹配所选分类
            const gameTypes = gameType.split(/[,&\/]/).map(t => t.trim());
            const matches = gameTypes.some(type => this.matchCategory(type, category));
            
            // 显示或隐藏游戏卡片
            card.style.display = matches ? 'block' : 'none';
        });
    },
    
    // 标准化分类名称
    normalizeCategory(category) {
        if (!category) return 'Home';
        
        // 移除计数部分
        const baseName = category.split(' (')[0].trim();
        
        // 移除多余空格
        const trimmed = baseName.replace(/\s+/g, ' ');
        
        // 移除特殊字符（保留中文字符）
        const cleaned = trimmed.replace(/[^\w\u4e00-\u9fa5\s&-]/g, '');
        
        // 检查是否有映射
        const mapped = this.categoryMappings[cleaned] || cleaned;
        
        return mapped;
    },
    
    // 匹配两个分类名称是否相关
    matchCategory(category1, category2) {
        // 记录日志便于调试
        console.log(`尝试匹配分类: "${category1}" 和 "${category2}"`);
        
        if (!category1 || !category2) return false;
        
        // 移除分类名称中的数量部分和特殊字符
        const clean1 = this.normalizeCategory(category1);
        const clean2 = this.normalizeCategory(category2);
        
        console.log(`规范化后: "${clean1}" 和 "${clean2}"`);
        
        // 精确匹配
        if (clean1 === clean2) {
            console.log(`✓ 精确匹配成功`);
            return true;
        }
        
        // 映射匹配
        if (this.categoryMappings[clean1] === clean2) {
            console.log(`✓ 通过映射1→2匹配成功`);
            return true;
        }
        if (this.categoryMappings[clean2] === clean1) {
            console.log(`✓ 通过映射2→1匹配成功`);
            return true;
        }
        
        // 部分匹配 (更宽松的匹配)
        if (clean1.includes(clean2) || clean2.includes(clean1)) {
            console.log(`✓ 部分包含匹配成功`);
            return true;
        }
        
        // 对于特殊情况的处理
        const specialMappings = {
            'Arcade': ['街机游戏', 'Arcade', '街机'],
            'Skill': ['技巧游戏', 'Skill', '技巧'],
            'Make-up': ['化妆游戏', 'Make-up', '化妆', '美妆'],
            'Dress-up': ['换装游戏', 'Dress-up', '换装'],
            'Sport': ['体育游戏', 'Sports', 'Sport', '体育', '运动'],
            '三消游戏': ['Match 3', 'Match-3', '三消', 'Match 3 Games'],
            '女生游戏': ['Girls', 'Girls Games', '女生'],
            '赛车游戏': ['Racing', 'Car', 'Cars', 'Driving'],
            '泡泡射击': ['Bubble Shooter', 'Bubbles']
        };
        
        // 检查特殊映射
        for (const [key, values] of Object.entries(specialMappings)) {
            if ((key === clean1 && values.includes(clean2)) || 
                (key === clean2 && values.includes(clean1))) {
                console.log(`✓ 通过特殊映射匹配成功`);
                return true;
            }
        }
        
        console.log(`✗ 匹配失败`);
        return false;
    },
    
    // 获取分类的显示名称
    getCategoryDisplayName(category) {
        // 将英文分类名转为对应的中文显示名
        return this.categoryMappings[category] || category;
    },
    
    // 获取按游戏数量排序的分类
    getSortedCategories() {
        // 定义分类权重
        const weights = {};
        this.priorityCategories.forEach((cat, index) => {
            weights[cat] = 1000 - index * 100; // 优先级递减
        });
        
        // 结合权重和游戏数量计算排序分数
        return Object.entries(this.categoryCounts)
            .map(([category, count]) => {
                // 跳过游戏数量为0的分类
                if (count === 0) return null;
                
                return {
                    category,
                    count,
                    displayName: this.getCategoryDisplayName(category),
                    score: (weights[category] || 0) + count
                };
            })
            .filter(Boolean) // 移除null项
            .sort((a, b) => b.score - a.score);
    }
}; 

// 页面完全加载后的最后一道保障
window.addEventListener('load', function() {
    console.log('页面完全加载完成，执行最终检查...');
    
    // 调试信息
    console.log('页面环境:', {
        URL: window.location.href,
        是否为本地文件: window.location.protocol === 'file:',
        是否为服务器: window.location.protocol.includes('http')
    });
}); 