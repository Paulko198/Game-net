/**
 * category-utils.js
 * 用于处理所有游戏分类页面的通用功能
 */

/**
 * 初始化分类页面
 * @param {Array<string>} gameTypes - 游戏类型数组，用于筛选游戏
 * @param {string} containerId - 游戏容器的ID
 */
function initCategoryPage(gameTypes, containerId) {
    // 从localStorage加载游戏数据
    const allGames = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
    
    // 筛选特定类型的游戏
    const filteredGames = allGames.filter(game => {
        if (!game.type) return false;
        const types = game.type.split(/[,&\/]/).map(t => t.trim());
        return gameTypes.some(type => types.includes(type));
    });
    
    const container = document.getElementById(containerId);
    
    // 移除加载指示器
    const loadingIndicator = container.querySelector('.loading-indicator');
    if (loadingIndicator) {
        container.removeChild(loadingIndicator);
    }
    
    if (filteredGames.length === 0) {
        const noGamesMessage = document.createElement('p');
        noGamesMessage.className = 'no-games-message';
        noGamesMessage.textContent = '暂无相关游戏。请稍后再来查看！';
        container.appendChild(noGamesMessage);
        return;
    }
    
    // 显示游戏卡片
    filteredGames.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        const link = document.createElement('a');
        link.href = `..${game.url}`;
        
        const img = document.createElement('img');
        img.src = game.thumbUrl || '../images/game-placeholder.jpg';
        img.alt = game.title;
        img.loading = 'lazy';
        img.dataset.src = img.src; // 用于延迟加载
        
        const content = document.createElement('div');
        content.className = 'game-card-content';
        
        const title = document.createElement('h3');
        title.textContent = game.title;
        
        const type = document.createElement('p');
        type.textContent = game.type;
        
        content.appendChild(title);
        content.appendChild(type);
        
        link.appendChild(img);
        link.appendChild(content);
        
        card.appendChild(link);
        container.appendChild(card);
    });
}

/**
 * 设置图片延迟加载
 */
function setupImageLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            imageObserver.observe(img);
        });
    }
} 