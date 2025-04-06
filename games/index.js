// 游戏页面重定向脚本
document.addEventListener('DOMContentLoaded', function() {
  // 获取当前路径
  const path = window.location.pathname;
  const gameSlug = path.split('/').pop().replace('.html', '');
  
  // 如果是在games目录下但没有具体游戏名，重定向到首页
  if (path === '/games/' || path === '/games') {
    window.location.href = '/index.html';
  }
  
  // 加载游戏数据
  fetch('/allpopulargames_games.json')
    .then(response => response.json())
    .then(games => {
      // 查找匹配的游戏
      const game = games.find(g => {
        const slug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return slug === gameSlug;
      });
      
      // 如果找到游戏，显示游戏页面
      if (game) {
        document.title = game.title + ' - AllPopularGames';
    } else {
        // 未找到游戏，重定向到首页
        window.location.href = '/index.html';
      }
    })
    .catch(error => {
      console.error('加载游戏数据失败:', error);
      // 出错时重定向到首页
      window.location.href = '/index.html';
    });
});