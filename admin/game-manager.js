document.addEventListener('DOMContentLoaded', () => {
    // 初始化时不再清除localStorage，而是从服务器获取最新数据
    console.log('游戏管理系统初始化，尝试从服务器获取最新数据');
    
    // 尝试从服务器获取游戏数据
    loadGamesFromServer().then(serverGames => {
        if (serverGames && serverGames.length > 0) {
            // 如果服务器有数据，则使用服务器数据
            games = serverGames;
            // 更新本地存储
            localStorage.setItem('allpopulargames_games', JSON.stringify(games));
            renderGameList();
        } else {
            // 如果服务器没有数据，尝试从本地存储加载
            games = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
            renderGameList();
        }
    }).catch(err => {
        console.error('从服务器加载数据失败:', err);
        // 加载失败时使用本地存储的数据
        games = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
        renderGameList();
    });
    
    // 从服务器获取游戏数据
    async function loadGamesFromServer() {
        try {
            const response = await fetch('/allpopulargames_games.json');
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('从服务器加载数据出错:', error);
            return [];
        }
    }
    
    // Display game list
    function renderGameList() {
        const gameList = document.getElementById('game-list');
        
        if (games.length === 0) {
            gameList.innerHTML = '<p>没有游戏。请使用上方表单添加游戏。</p>';
            return;
        }
        
        let html = '';
        games.forEach((game, index) => {
            const thumbUrl = game.thumbUrl || '../images/game-placeholder.jpg';
            const tagHTML = game.tag ? 
                `<span class="game-tag tag-${game.tag}">${game.tag === 'hot' ? '热门' : '新游戏'}</span>` : '';
            
            html += `
            <div class="game-item">
                <img src="${thumbUrl}" alt="${game.title}">
                <div class="game-item-info">
                    <h3>${game.title} ${tagHTML}</h3>
                    <p>类型: ${game.type}</p>
                    <p>链接: <a href="${game.url}" target="_blank">${game.url.substring(0, 30)}${game.url.length > 30 ? '...' : ''}</a></p>
                    <p>打开方式: ${game.openMode === 'iframe' ? '内嵌框架' : (game.openMode === 'external' ? '外部链接' : '内部页面')}</p>
                </div>
                <div class="game-item-actions">
                    <button class="btn btn-secondary btn-edit" data-index="${index}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-delete" data-index="${index}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            `;
        });
        
        gameList.innerHTML = html;
        
        // Add edit and delete event listeners
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                editGame(index);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                if (confirm(`确定要删除"${games[index].title}"吗？`)) {
                    games.splice(index, 1);
                    localStorage.setItem('allpopulargames_games', JSON.stringify(games));
                    renderGameList();
                    showAlert('游戏已删除！', 'success');
                }
            });
        });
    }
    
    // Add game
    const addGameForm = document.getElementById('add-game-form');
    addGameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newGame = {
            title: document.getElementById('game-title').value,
            type: document.getElementById('game-type').value,
            url: document.getElementById('game-url').value,
            thumbUrl: document.getElementById('game-thumb').value,
            openMode: document.getElementById('game-mode').value,
            tag: document.getElementById('game-tag').value
        };
        
        if (editingIndex !== null) {
            // Update existing game
            games[editingIndex] = newGame;
            editingIndex = null;
            addGameForm.querySelector('button[type="submit"]').textContent = '添加游戏';
        } else {
            // Add new game
            games.push(newGame);
        }
        
        localStorage.setItem('allpopulargames_games', JSON.stringify(games));
        addGameForm.reset();
        renderGameList();
        showAlert('游戏已保存！', 'success');
    });
    
    // Edit game
    let editingIndex = null;
    function editGame(index) {
        const game = games[index];
        document.getElementById('game-title').value = game.title;
        
        // Set game type dropdown
        const gameTypeSelect = document.getElementById('game-type');
        const gameTypeOptions = Array.from(gameTypeSelect.options);
        
        // Try exact match first
        const exactMatch = gameTypeOptions.find(option => 
            option.value.toLowerCase() === game.type.toLowerCase() || 
            option.text.includes(game.type)
        );
        
        if (exactMatch) {
            gameTypeSelect.value = exactMatch.value;
        } else {
            // If no exact match, check for partial matches
            const partialMatch = gameTypeOptions.find(option => 
                game.type.toLowerCase().includes(option.value.toLowerCase()) || 
                option.value.toLowerCase().includes(game.type.toLowerCase())
            );
            
            if (partialMatch) {
                gameTypeSelect.value = partialMatch.value;
            } else {
                // If still no match, set to empty
                gameTypeSelect.value = "";
            }
        }
        
        document.getElementById('game-url').value = game.url;
        document.getElementById('game-thumb').value = game.thumbUrl || '';
        document.getElementById('game-mode').value = game.openMode;
        document.getElementById('game-tag').value = game.tag || '';
        
        editingIndex = index;
        addGameForm.querySelector('button[type="submit"]').textContent = '更新游戏';
        window.scrollTo(0, addGameForm.offsetTop - 20);
    }
    
    // Export games
    document.getElementById('export-btn').addEventListener('click', () => {
        const jsonStr = JSON.stringify(games, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'allpopulargames_games.json';
        a.click();
    });
    
    // Import games
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-container').style.display = 'block';
    });
    
    document.getElementById('cancel-import-btn').addEventListener('click', () => {
        document.getElementById('import-container').style.display = 'none';
    });
    
    document.getElementById('process-import-btn').addEventListener('click', () => {
        try {
            const jsonText = document.getElementById('import-json').value;
            const importedGames = JSON.parse(jsonText);
            
            if (Array.isArray(importedGames)) {
                const validGames = importedGames.filter(game => 
                    game.title && game.url && game.type && game.openMode
                );
                
                if (confirm(`确定要导入 ${validGames.length} 个游戏吗？这将替换现有列表。`)) {
                    games = validGames;
                    localStorage.setItem('allpopulargames_games', JSON.stringify(games));
                    renderGameList();
                    document.getElementById('import-container').style.display = 'none';
                    showAlert(`成功导入 ${validGames.length} 个游戏！`, 'success');
                }
            } else {
                throw new Error('导入的数据不是数组格式');
            }
        } catch (err) {
            showAlert(`导入失败: ${err.message}`, 'danger');
        }
    });
    
    // Auto sync button
    document.getElementById('auto-sync-btn').addEventListener('click', autoSyncAndConvert);
    
    // Generate static pages
    document.getElementById('generate-static').addEventListener('click', () => {
        if (games.length === 0) {
            showAlert('没有游戏可以生成静态页面', 'danger');
            return;
        }
        
        generateZipWithStaticPages(games);
    });
    
    // Show alert message
    function showAlert(message, type) {
        const alertsContainer = document.getElementById('alerts');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alertsContainer.appendChild(alert);
        
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alertsContainer.removeChild(alert), 500);
        }, 3000);
    }
    
    // Generate ZIP with static pages
    async function generateZipWithStaticPages(games) {
        try {
            // Check if JSZip is available
            if (typeof JSZip === 'undefined') {
                // If JSZip is not available, load it dynamically
                await loadJSZip();
            }
            
            // Create a new ZIP file
            const zip = new JSZip();
            
            // Create games folder
            const gamesFolder = zip.folder("games");
            
            // Add HTML file for each game
            games.forEach(game => {
                const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const htmlContent = createGamePageTemplate(game);
                gamesFolder.file(`${gameSlug}.html`, htmlContent);
            });
            
            // Add index.js for redirects
            gamesFolder.file("index.js", createRedirectScript());
            
            // Add .htaccess for Apache servers
            gamesFolder.file(".htaccess", createHtaccessRules());
            
            // Add README file with instructions
            const readmeContent = 
    `# 静态游戏页面
    此ZIP文件包含您收藏中所有游戏的静态HTML页面。
    
    ## 目录结构
    - games/ - 包含所有游戏HTML文件
      - *.html - 各个游戏页面
      - index.js - 重定向脚本
      - .htaccess - Apache服务器配置（可选）
      
    ## 使用方法
    1. 将所有文件解压到您的网站根目录
    2. 通过以下方式访问游戏：yourdomain.com/games/game-name.html
    3. 或更新您的游戏卡片直接链接到这些文件
    
    ## 游戏URL列表
    ${games.map(game => {
        const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `- ${game.title}: games/${gameSlug}.html`;
    }).join('\n')}`;
            
            zip.file("README.md", readmeContent);
            
            // Generate ZIP file
            const blob = await zip.generateAsync({type: "blob"});
            
            // Create download link
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'static_game_pages.zip';
            a.click();
            
            showAlert(`已生成包含 ${games.length} 个静态游戏页面的ZIP文件。`, 'success');
        } catch (error) {
            console.error("Error generating ZIP file:", error);
            showAlert(`生成ZIP文件时出错: ${error.message}。改用文本说明。`, 'danger');
            
            // Fallback to the original text-based method if ZIP generation fails
            generateStaticPagesInstructions(games);
        }
    }
    
    // Generate individual HTML files directly
    function generateAndDownloadHtmlFiles(games) {
        if (!games || games.length === 0) {
            showAlert('没有游戏可以生成静态页面', 'danger');
            return;
        }
        
        try {
            // 为每个游戏创建并下载HTML文件
            games.forEach((game, index) => {
                setTimeout(() => {
                    const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const htmlContent = createGamePageTemplate(game);
                    
                    // 创建Blob和下载链接
                    const blob = new Blob([htmlContent], { type: 'text/html' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${gameSlug}.html`;
                    a.click();
                    
                    // 如果是最后一个游戏，还需要下载index.js文件
                    if (index === games.length - 1) {
                        setTimeout(() => {
                            const jsBlob = new Blob([createRedirectScript()], { type: 'text/javascript' });
                            const jsLink = document.createElement('a');
                            jsLink.href = URL.createObjectURL(jsBlob);
                            jsLink.download = 'index.js';
                            jsLink.click();
                            
                            showAlert(`已生成${games.length}个游戏页面和1个index.js文件。请将它们放在网站的games目录中。`, 'success');
                        }, 500);
                    }
                }, index * 500); // 每个文件延迟500ms下载，避免浏览器阻止多个下载
            });
        } catch (error) {
            console.error("生成文件时出错:", error);
            showAlert(`生成HTML文件时出错: ${error.message}`, 'danger');
        }
    }
    
    // Add button for direct HTML generation
    const generateContainer = document.querySelector('.export-import-container .button-group');
    
    // Auto sync button
    async function autoSyncAndConvert() {
        if (games.length === 0) {
            showAlert('没有游戏可以同步', 'danger');
            return;
        }
        
        showAlert('正在同步游戏数据到服务器...', 'success');
        
        // 显示加载指示
        const syncBtn = document.getElementById('auto-sync-btn');
        const originalText = syncBtn.textContent;
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 同步中...';
        
        try {
            // 尝试最多3次请求
            let response = null;
            let retries = 0;
            const maxRetries = 3;
            
            while (retries < maxRetries) {
                try {
                    response = await fetch('/save-games-json', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(games)
                    });
                    
                    if (response.ok) {
                        break; // 成功则退出循环
                    }
                    
                    // 失败则重试
                    retries++;
                    if (retries < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
                    }
                } catch (error) {
                    retries++;
                    if (retries >= maxRetries) throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
                }
            }
            
            if (!response || !response.ok) {
                throw new Error('服务器无响应或返回错误');
            }
            
            const result = await response.json();
            showAlert(`保存成功! ${result.message}`, 'success');
            
            // 开始监控同步进度
            showAlert('开始监控同步进度...', 'info');
            monitorSyncProgress();
            
        } catch (error) {
            console.error('同步失败:', error);
            showAlert(`同步失败: ${error.message}`, 'danger');
        } finally {
            // 还原按钮状态
            syncBtn.disabled = false;
            syncBtn.textContent = originalText;
        }
    }
    
    // Load JSZip library dynamically
    function loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Original text-based generation function (as a fallback)
    function generateStaticPagesInstructions(games) {
        // Create instructions doc
        let instructions = "# Static Game Pages Generation Guide\n\n";
        
        // Add directory structure
        instructions += "## Directory Structure\n\n";
        instructions += "```\n";
        instructions += "games/\n";
        instructions += "├── game-slug-1.html\n";
        instructions += "├── game-slug-2.html\n";
        instructions += "├── ...\n";
        instructions += "└── index.js\n";
        instructions += "```\n\n";
        
        // Add game page templates
        instructions += "## Game Page Templates\n\n";
        
        let fileCount = 0;
        
        // Add HTML template for each game
        games.forEach(game => {
            const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            instructions += `### games/${gameSlug}.html\n`;
            instructions += "```html\n";
            
            // Add game page HTML template
            instructions += createGamePageTemplate(game);
            
            instructions += "\n```\n\n";
            fileCount++;
        });
        
        // Add redirect JS file information
        instructions += "## Additional Files\n\n";
        instructions += "### games/index.js\n";
        instructions += "```javascript\n";
        instructions += createRedirectScript();
        instructions += "\n```\n\n";
        
        // Add Apache rewrite rules
        instructions += "### games/.htaccess (for Apache servers)\n";
        instructions += "```apache\n";
        instructions += createHtaccessRules();
        instructions += "\n```\n\n";
        
        // Add game card update instructions
        instructions += "## Update Game Cards in index.html\n\n";
        instructions += "Change game cards from:\n";
        instructions += "```html\n";
        instructions += createOldGameCardTemplate();
        instructions += "\n```\n\n";
        
        instructions += "To:\n";
        instructions += "```html\n";
        instructions += createNewGameCardTemplate();
        instructions += "\n```\n\n";
        
        // Add game URL reference
        instructions += "## Game URL Reference\n\n";
        games.forEach(game => {
            const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            instructions += `- ${game.title}: games/${gameSlug}.html\n`;
        });
        
        // Create instructions file download
        downloadInstructions(instructions, fileCount);
    }
    
    // Create game page template
    function createGamePageTemplate(game) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${game.title} - AllPopularGames</title>
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <style>
        .game-container {
            max-width: 100%;
            height: calc(100vh - 120px);
            margin: 0 auto;
            background: #1e1e1e;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            position: relative;
        }
        .game-frame {
            width: 100%;
            height: 100%;
            border: none;
        }
        .game-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 10px;
            z-index: 100;
        }
        .control-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s;
            border: none;
        }
        .control-btn:hover {
            background: rgba(0,0,0,0.8);
            transform: scale(1.1);
        }
        .external-warning {
            background: rgba(231, 76, 60, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 100;
            font-size: 0.9rem;
            max-width: 80%;
        }
        @media (max-width: 768px) {
            .game-container {
                height: calc(100vh - 100px);
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <div class="logo">
                <a href="../index.html">
                    <img src="../images/logo.png" alt="AllPopularGames Logo">
                    <h1>AllPopular<span>Games</span></h1>
                </a>
            </div>
            <a href="../index.html" class="btn-back">
                <i class="fas fa-home"></i> 返回首页
            </a>
        </div>
    </header>

    <main>
        <div class="game-info">
            <h1>${game.title}</h1>
            <p>类型: ${game.type}</p>
        </div>
        
        <div class="game-container">
            ${game.openMode === 'external' ? 
              '<div class="external-warning">注意：此游戏托管在我们控制范围之外的外部网站上。</div>' : ''}
            
            <div class="game-controls">
                <button class="control-btn" id="fullscreen-btn" title="全屏">
                    <i class="fas fa-expand"></i>
                </button>
                <button class="control-btn" id="favorite-btn" title="收藏">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            
            <iframe src="${encodeURI(game.url)}" class="game-frame" allowfullscreen></iframe>
        </div>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Fullscreen functionality
            const fullscreenBtn = document.getElementById('fullscreen-btn');
            const gameFrame = document.querySelector('.game-frame');
            
            fullscreenBtn.addEventListener('click', () => {
                if (gameFrame.requestFullscreen) {
                    gameFrame.requestFullscreen();
                } else if (gameFrame.webkitRequestFullscreen) {
                    gameFrame.webkitRequestFullscreen();
                } else if (gameFrame.msRequestFullscreen) {
                    gameFrame.msRequestFullscreen();
                }
            });
            
            // Favorite functionality
            const favoriteBtn = document.getElementById('favorite-btn');
            favoriteBtn.addEventListener('click', () => {
                const icon = favoriteBtn.querySelector('i');
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    alert('游戏已添加到收藏夹！');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    alert('游戏已从收藏夹中移除！');
                }
            });
        });
    </script>
</body>
</html>`;
    }
    
    // Create redirect script
    function createRedirectScript() {
        return `// Redirect script
window.onload = function() {
    // Read game ID parameter
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('id');
    
    if (gameId) {
        // Redirect to corresponding game page
        window.location.href = gameId + '.html';
    } else {
        // If no parameter, redirect to home page
        window.location.href = '../index.html';
    }
};`;
    }
    
    // Create .htaccess rules
    function createHtaccessRules() {
        return `# Rewrite rules
RewriteEngine On
RewriteBase /games/
RewriteRule ^([a-z0-9-]+)$ $1.html [L]`;
    }
    
    // Create original game card template
    function createOldGameCardTemplate() {
        return `<div class="game-card" data-game-url="https://example.com/games/game" data-open-mode="iframe">
    <img src="images/game.jpg" alt="Game Name">
    <div class="game-card-content">
        <h3>Game Name</h3>
        <p>Game Type</p>
    </div>
</div>`;
    }
    
    // Create new game card template
    function createNewGameCardTemplate() {
        return `<div class="game-card" data-game-url="games/game-slug.html" data-open-mode="internal">
    <img src="images/game.jpg" alt="Game Name">
    <div class="game-card-content">
        <h3>Game Name</h3>
        <p>Game Type</p>
    </div>
</div>`;
    }
    
    // Download instructions file
    function downloadInstructions(content, fileCount) {
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'static_pages_instructions.txt';
        a.click();
        
        showAlert(`Generated instructions for ${fileCount} static game pages. Please download and follow the instructions.`, 'success');
    }
    
    // 检查同步状态
    async function checkSyncStatus() {
        try {
            const response = await fetch('/sync-status.json?t=' + new Date().getTime(), {
                cache: 'no-cache' // 避免缓存
            });
            
            if (!response.ok) {
                console.error('无法获取同步状态');
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('检查同步状态失败:', error);
            return null;
        }
    }
    
    // 自动检查同步进度
    async function monitorSyncProgress() {
        const maxChecks = 10; // 最多检查10次
        let checks = 0;
        
        const checkInterval = setInterval(async () => {
            checks++;
            
            const status = await checkSyncStatus();
            
            if (status && status.status === 'completed') {
                clearInterval(checkInterval);
                showAlert(`同步完成！共同步了 ${status.gamesCount} 个游戏`, 'success');
                
                // 验证文件是否已更新
                verifyFilesUpdated();
            } else if (status && status.status === 'error') {
                clearInterval(checkInterval);
                showAlert(`同步出错: ${status.error || '未知错误'}`, 'danger');
            } else if (checks >= maxChecks) {
                clearInterval(checkInterval);
                showAlert('同步状态未知，请手动检查', 'warning');
            }
        }, 3000); // 每3秒检查一次
    }
    
    // 验证文件是否已更新
    async function verifyFilesUpdated() {
        try {
            const response = await fetch('/allpopulargames_games.json?t=' + new Date().getTime(), {
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const serverGames = await response.json();
                if (serverGames && Array.isArray(serverGames) && 
                    JSON.stringify(serverGames) === JSON.stringify(games)) {
                    showAlert('验证成功: 服务器数据已更新为最新版本', 'success');
                } else {
                    showAlert('警告: 服务器数据可能未完全更新', 'warning');
                }
            }
        } catch (error) {
            console.error('验证文件更新失败:', error);
        }
    }
    
    // Initial game list rendering
    renderGameList();
}); 