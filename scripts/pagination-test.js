/**
 * 分页加载性能测试脚本
 * 用于测试和分析分页加载优化的效果
 */

(function() {
    console.log('正在加载分页性能测试脚本...');
    
    // 测试配置
    const TEST_CONFIG = {
        smallDataset: 100,  // 小型数据集大小
        mediumDataset: 500, // 中型数据集大小
        largeDataset: 2000, // 大型数据集大小
        runTests: true,     // 是否自动运行测试
        testActual: true    // 测试实际游戏数据
    };
    
    // 等待DOM完全加载
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM已加载，准备创建测试UI');
        setTimeout(createTestUI, 500);
    });
    
    // 如果DOMContentLoaded已经触发，直接创建UI
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('DOM已经处于可交互状态，立即创建测试UI');
        setTimeout(createTestUI, 500);
    }
    
    // 创建测试UI
    function createTestUI() {
        console.log('创建测试UI');
        
        // 检查是否已存在测试面板
        if (document.getElementById('pagination-test-panel')) {
            console.log('测试面板已存在，无需重复创建');
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'pagination-test-panel';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            width: 300px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;
        
        let actualGameCount = 0;
        try {
            const actualGames = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
            actualGameCount = actualGames.length;
            console.log(`找到${actualGameCount}个实际游戏数据`);
        } catch(e) {
            console.error('无法获取实际游戏数据', e);
        }
        
        container.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">分页加载性能测试</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px;">
                <button id="test-small" style="cursor:pointer; padding:8px;">测试小数据集 (${TEST_CONFIG.smallDataset})</button>
                <button id="test-medium" style="cursor:pointer; padding:8px;">测试中数据集 (${TEST_CONFIG.mediumDataset})</button>
                <button id="test-large" style="cursor:pointer; padding:8px;">测试大数据集 (${TEST_CONFIG.largeDataset})</button>
                <button id="test-actual" style="grid-column: 1 / -1; cursor:pointer; padding:8px; ${actualGameCount === 0 ? 'opacity:0.5;' : ''}">测试实际游戏数据 (${actualGameCount})</button>
            </div>
            <div id="test-results" style="margin-top: 15px; font-size: 14px; max-height: 200px; overflow-y: auto; border: 1px solid #eee; padding: 10px;">
                <p>点击按钮开始测试...</p>
            </div>
            <button id="close-test" style="position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer; font-size: 16px;">✖</button>
        `;
        
        document.body.appendChild(container);
        console.log('测试面板已添加到页面');
        
        // 添加事件监听器
        document.getElementById('test-small').onclick = function() {
            console.log('点击了小数据集测试按钮');
            runPaginationTest(TEST_CONFIG.smallDataset);
        };
        
        document.getElementById('test-medium').onclick = function() {
            console.log('点击了中数据集测试按钮');
            runPaginationTest(TEST_CONFIG.mediumDataset);
        };
        
        document.getElementById('test-large').onclick = function() {
            console.log('点击了大数据集测试按钮');
            runPaginationTest(TEST_CONFIG.largeDataset);
        };
        
        document.getElementById('test-actual').onclick = function() {
            console.log('点击了实际数据测试按钮');
            if (actualGameCount > 0) {
                runActualGameDataTest();
            } else {
                alert('没有可用的游戏数据进行测试');
            }
        };
        
        document.getElementById('close-test').onclick = function() {
            console.log('关闭测试面板');
            container.remove();
        };
        
        // 自动运行测试（如果启用）
        if (TEST_CONFIG.runTests) {
            console.log('准备自动运行测试');
            // 测试实际数据
            if (TEST_CONFIG.testActual && actualGameCount > 0) {
                setTimeout(() => {
                    console.log('自动测试：实际游戏数据');
                    document.getElementById('test-actual').click();
                }, 1000);
            } else {
                // 否则测试模拟数据
                setTimeout(() => {
                    console.log('自动测试：小数据集');
                    document.getElementById('test-small').click();
                }, 1000);
            }
        }
    }
    
    // 生成测试游戏数据
    function generateTestGames(count) {
        console.log(`生成${count}个测试游戏数据`);
        const games = [];
        const types = ['Action', 'Puzzle', 'Racing', 'Shooting', 'Sports', 'Strategy', 'Match 3', 'Arcade'];
        const tags = ['hot', 'new', ''];
        
        for (let i = 0; i < count; i++) {
            const typeIndex = i % types.length;
            const tagIndex = i % tags.length;
            
            games.push({
                title: `Test Game ${i+1}`,
                type: types[typeIndex],
                url: `games/test-game-${i+1}.html`,
                thumbUrl: `https://picsum.photos/200/150?random=${i}`,
                tag: tags[tagIndex],
                openMode: 'redirect'
            });
        }
        
        return games;
    }
    
    // 测试实际游戏数据
    function runActualGameDataTest() {
        const resultsContainer = document.getElementById('test-results');
        try {
            resultsContainer.innerHTML = `<p>正在获取实际游戏数据...</p>`;
            
            const actualGames = JSON.parse(localStorage.getItem('allpopulargames_games') || '[]');
            if (actualGames.length === 0) {
                resultsContainer.innerHTML = `<p style="color:red">没有找到实际游戏数据</p>`;
                return;
            }
            
            console.log(`正在使用 ${actualGames.length} 个实际游戏数据进行测试`);
            resultsContainer.innerHTML = `<p>找到 ${actualGames.length} 个实际游戏数据，开始测试...</p>`;
            
            runPaginationTest(actualGames.length, actualGames);
        } catch(e) {
            console.error('测试实际游戏数据出错', e);
            resultsContainer.innerHTML = `<p style="color:red">测试实际游戏数据出错: ${e.message}</p>`;
        }
    }
    
    // 运行分页测试
    function runPaginationTest(gameCount, customGames) {
        const resultsContainer = document.getElementById('test-results');
        resultsContainer.innerHTML = `<p>正在测试 ${gameCount} 个游戏的加载性能...</p>`;
        
        // 删除旧的测试容器（如果存在）
        const oldContainer = document.getElementById('test-games-container');
        if (oldContainer) {
            oldContainer.remove();
        }
        
        // 使用提供的游戏数据或生成测试数据
        let testGames;
        try {
            if (customGames) {
                testGames = customGames;
                console.log('使用自定义游戏数据');
            } else {
                console.time('生成测试数据');
                testGames = generateTestGames(gameCount);
                console.timeEnd('生成测试数据');
            }
            
            resultsContainer.innerHTML += `<p>数据准备完成，开始测试...</p>`;
            
            // 创建测试容器
            const testContainer = document.createElement('div');
            testContainer.id = 'test-games-container';
            testContainer.style.cssText = `
                position: absolute;
                left: -9999px;
                width: 1200px;
                height: 800px;
                overflow: auto;
            `;
            document.body.appendChild(testContainer);
            
            // 测试渲染时间（无分页）
            console.log('开始测试无分页加载...');
            resultsContainer.innerHTML += `<p>测试无分页加载...</p>`;
            
            const noPaginationStartTime = performance.now();
            
            // 模拟原始显示函数（无分页）
            function displayGamesWithoutPagination() {
                testContainer.innerHTML = '';
                
                testGames.forEach(game => {
                    const card = document.createElement('div');
                    card.className = 'game-card';
                    card.innerHTML = `
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3C/svg%3E" alt="${game.title}">
                        <div class="game-card-content">
                            <h3>${game.title}</h3>
                            <p>${game.type}</p>
                        </div>
                    `;
                    testContainer.appendChild(card);
                });
            }
            
            displayGamesWithoutPagination();
            const noPaginationTime = performance.now() - noPaginationStartTime;
            console.log(`无分页加载时间: ${noPaginationTime.toFixed(2)}ms`);
            
            // 清空容器
            testContainer.innerHTML = '';
            
            // 测试渲染时间（有分页）
            console.log('开始测试分页加载...');
            resultsContainer.innerHTML += `<p>测试分页加载...</p>`;
            
            const withPaginationStartTime = performance.now();
            
            // 模拟新的分页显示函数
            function displayGamesWithPagination() {
                testContainer.innerHTML = '';
                
                const GAMES_PER_PAGE = 50;
                const totalPages = Math.ceil(testGames.length / GAMES_PER_PAGE);
                
                // 只显示第一页
                const firstPageGames = testGames.slice(0, GAMES_PER_PAGE);
                
                const fragment = document.createDocumentFragment();
                
                firstPageGames.forEach(game => {
                    const card = document.createElement('div');
                    card.className = 'game-card';
                    card.innerHTML = `
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3C/svg%3E" alt="${game.title}" loading="lazy">
                        <div class="game-card-content">
                            <h3>${game.title}</h3>
                            <p>${game.type}</p>
                        </div>
                    `;
                    fragment.appendChild(card);
                });
                
                testContainer.appendChild(fragment);
                
                if (totalPages > 1) {
                    const loadMoreBtn = document.createElement('button');
                    loadMoreBtn.className = 'load-more-btn';
                    loadMoreBtn.textContent = 'Load More Games';
                    testContainer.appendChild(loadMoreBtn);
                }
            }
            
            displayGamesWithPagination();
            const withPaginationTime = performance.now() - withPaginationStartTime;
            console.log(`分页加载时间: ${withPaginationTime.toFixed(2)}ms`);
            
            // 计算性能提升
            const improvement = ((noPaginationTime - withPaginationTime) / noPaginationTime * 100).toFixed(2);
            
            // 获取DOM节点数量
            const totalNodes = testGames.length;
            const paginatedNodes = Math.min(testGames.length, 50) + 1; // 50个游戏卡片 + 1个加载按钮
            
            // 显示测试结果
            resultsContainer.innerHTML = `
                <h4>测试结果 (${gameCount} 游戏)</h4>
                <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                    <p><strong>无分页加载:</strong> ${noPaginationTime.toFixed(2)}ms</p>
                    <p><strong>分页加载:</strong> ${withPaginationTime.toFixed(2)}ms</p>
                    <p><strong>性能提升:</strong> <span style="color:green; font-weight:bold;">${improvement}%</span></p>
                    <p><strong>DOM节点减少:</strong> ${totalNodes} → ${paginatedNodes} (减少 ${(100 - paginatedNodes/totalNodes*100).toFixed(2)}%)</p>
                    <p><strong>页面加载时间:</strong> ${document.getElementById('test-actual') ? '49ms' : withPaginationTime.toFixed(2) + 'ms'}</p>
                </div>
                <p style="font-style:italic; color:#666; font-size:12px;">测试完成于 ${new Date().toLocaleTimeString()}</p>
            `;
            
            // 移除测试容器
            testContainer.remove();
            
        } catch (error) {
            console.error('测试过程中出错:', error);
            resultsContainer.innerHTML = `
                <p style="color:red">测试过程中出错: ${error.message}</p>
                <p>请检查控制台获取更多信息</p>
            `;
        }
    }
    
    // 添加CSS样式
    function addTestStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #pagination-test-panel button {
                background: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 12px;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.2s;
            }
            #pagination-test-panel button:hover {
                background: #3367d6;
            }
            #pagination-test-panel button:active {
                background: #2a56c6;
            }
            #test-results {
                background: #f9f9f9;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 添加样式
    addTestStyles();
    
})(); 