const fs = require('fs');
const path = require('path');

// 中英文翻译映射
const translations = {
  'zh-CN': 'en',
  '返回首页': 'Back to Home',
  '首页': 'Home',
  '关于我们': 'About Us',
  '隐私政策': 'Privacy Policy',
  '使用条款': 'Terms of Use',
  '联系我们': 'Contact Us',
  '保留所有权利': 'All Rights Reserved',
  '免费游戏': 'free games',
  '在线游戏': 'online games',
  'HTML5游戏': 'HTML5 games',
  '在AllPopularGames上免费玩': 'Play for free on AllPopularGames',
  '我们收集了最好玩的': 'We\'ve collected the best',
  '游戏，全部免费，无需下载': 'games, all free to play with no downloads required',
  '探索我们精选的': 'Explore our curated collection of',
  '游戏集合。这些游戏全部免费，无需下载，即点即玩': 'games. All games are free to play, no downloads required, just click and play',
  '游戏': 'Games',
  '结构化数据': 'Structured Data'
};

// 处理目录
const categoryDir = path.join(__dirname, '..', 'category');

// 读取目录内容
fs.readdir(categoryDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // 过滤HTML文件
  const htmlFiles = files.filter(file => file.endsWith('.html'));
  console.log(`Found ${htmlFiles.length} category HTML files to translate`);

  // 处理每个文件
  htmlFiles.forEach(file => {
    const filePath = path.join(categoryDir, file);
    
    // 读取文件内容
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${file}:`, err);
        return;
      }

      // 提取分类名称（不包括"游戏"后缀）
      const categoryNameMatch = data.match(/<title>(.*?)游戏 - AllPopularGames<\/title>/);
      const categoryName = categoryNameMatch ? categoryNameMatch[1] : path.basename(file, '.html');
      
      // 执行替换
      let updatedContent = data;
      
      // 更新HTML语言
      updatedContent = updatedContent.replace('<html lang="zh-CN">', '<html lang="en">');
      
      // 更新标题和元数据
      updatedContent = updatedContent.replace(
        /<title>(.*?)游戏 - AllPopularGames<\/title>/g, 
        `<title>${categoryName} Games - AllPopularGames</title>`
      );
      
      // 更新描述
      updatedContent = updatedContent.replace(
        /<meta name="description" content="在AllPopularGames上免费玩(.*?)游戏。我们收集了最好玩的(.*?)游戏，全部免费，无需下载。">/g,
        `<meta name="description" content="Play ${categoryName} games for free on AllPopularGames. We've collected the best ${categoryName} games, all free to play with no downloads required.">`
      );
      
      // 更新关键词
      updatedContent = updatedContent.replace(
        /<meta name="keywords" content="(.*?), 免费游戏, 在线游戏, HTML5游戏">/g,
        `<meta name="keywords" content="$1, free games, online games, HTML5 games">`
      );
      
      // 更新结构化数据注释
      updatedContent = updatedContent.replace('<!-- 结构化数据 -->', '<!-- Structured Data -->');
      
      // 更新JSON-LD数据
      updatedContent = updatedContent.replace(
        /"name": "(.*?)游戏",/g,
        `"name": "${categoryName} Games",`
      );
      
      updatedContent = updatedContent.replace(
        /"description": "在AllPopularGames上免费玩(.*?)游戏。我们收集了最好玩的(.*?)游戏，全部免费，无需下载。",/g,
        `"description": "Play ${categoryName} games for free on AllPopularGames. We've collected the best ${categoryName} games, all free to play with no downloads required.",`
      );
      
      // 更新返回首页按钮
      updatedContent = updatedContent.replace(
        /<i class="fas fa-home"><\/i> 返回首页/g,
        `<i class="fas fa-home"></i> Back to Home`
      );
      
      // 更新分类标题
      updatedContent = updatedContent.replace(
        /<h1 class="category-title">(.*?)游戏<\/h1>/g,
        `<h1 class="category-title">${categoryName} Games</h1>`
      );
      
      // 更新面包屑导航
      updatedContent = updatedContent.replace(
        /<li><a href="..\/index.html">首页<\/a><\/li>/g,
        `<li><a href="../index.html">Home</a></li>`
      );
      
      updatedContent = updatedContent.replace(
        /<li>(.*?)游戏<\/li>/g,
        `<li>${categoryName} Games</li>`
      );
      
      // 更新分类描述
      updatedContent = updatedContent.replace(
        /<p class="category-description">\s*探索我们精选的(.*?)游戏集合。这些游戏全部免费，无需下载，即点即玩。\s*<\/p>/g,
        `<p class="category-description">\n                Explore our curated collection of ${categoryName} games. All games are free to play, no downloads required, just click and play.\n            </p>`
      );
      
      // 更新页脚链接
      updatedContent = updatedContent.replace(
        /<a href="..\/about.html">关于我们<\/a>/g,
        `<a href="../about.html">About Us</a>`
      );
      
      updatedContent = updatedContent.replace(
        /<a href="..\/privacy.html">隐私政策<\/a>/g,
        `<a href="../privacy.html">Privacy Policy</a>`
      );
      
      updatedContent = updatedContent.replace(
        /<a href="..\/terms.html">使用条款<\/a>/g,
        `<a href="../terms.html">Terms of Use</a>`
      );
      
      updatedContent = updatedContent.replace(
        /<a href="..\/contact.html">联系我们<\/a>/g,
        `<a href="../contact.html">Contact Us</a>`
      );
      
      // 更新版权信息
      updatedContent = updatedContent.replace(
        /<p class="copyright">&copy; 2024 AllPopularGames. 保留所有权利。<\/p>/g,
        `<p class="copyright">&copy; 2024 AllPopularGames. All Rights Reserved.</p>`
      );
      
      // 将更新后的内容写回文件
      fs.writeFile(filePath, updatedContent, 'utf8', err => {
        if (err) {
          console.error(`Error writing file ${file}:`, err);
          return;
        }
        console.log(`✓ Translated: ${file}`);
      });
    });
  });
});

console.log('Translation process started...'); 