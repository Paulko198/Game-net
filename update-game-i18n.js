const fs = require('fs');
const path = require('path');
const util = require('util');

// 将回调函数转换为Promise
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync = util.promisify(fs.readdir);

// 获取GameI18N模板
const getGameI18nTemplate = async () => {
  try {
    const templatePath = path.join(__dirname, 'game-i18n-template.js');
    return await readFileAsync(templatePath, 'utf8');
  } catch (error) {
    console.error('读取模板文件失败:', error);
    throw error;
  }
};

// 处理单个游戏页面
const processGamePage = async (filePath, template) => {
  try {
    // 读取原始文件内容
    const originalContent = await readFileAsync(filePath, 'utf8');
    
    // 检查页面是否已包含GameI18N对象
    if (originalContent.includes('const GameI18N = {')) {
      console.log(`文件 ${filePath} 已包含GameI18N对象，将替换为新版本`);
    }
    
    // 从HTML中提取游戏标题和类型
    const gameTitleMatch = originalContent.match(/<title>(.*?)\s*-\s*免费在线玩/);
    const gameTypeMatch = originalContent.match(/一款精彩的(\w+)游戏/);
    
    const gameTitle = gameTitleMatch ? gameTitleMatch[1].trim() : path.basename(filePath, '.html');
    const gameType = gameTypeMatch ? gameTypeMatch[1].trim() : '';
    
    console.log(`游戏标题: ${gameTitle}, 类型: ${gameType || '未找到'}`);
    
    // 替换模板中的占位符
    let processedTemplate = template
      .replace(/GAME_TITLE/g, gameTitle)
      .replace(/GAME_TYPE/g, gameType);
    
    // 找到要插入/替换代码的位置
    let updatedContent;
    
    // 查找脚本部分并插入/替换GameI18N代码
    const scriptClosingTagIndex = originalContent.lastIndexOf('</script>');
    
    // 如果页面已有GameI18N代码，则替换它
    const gameI18nStartIndex = originalContent.indexOf('const GameI18N = {');
    if (gameI18nStartIndex !== -1) {
      // 找到GameI18N代码块的结束位置
      const gameI18nEndSearchStartPos = gameI18nStartIndex + 'const GameI18N = {'.length;
      let bracketCount = 1; // 已经找到了一个开始的大括号
      let gameI18nEndIndex = gameI18nEndSearchStartPos;
      
      for (let i = gameI18nEndSearchStartPos; i < originalContent.length; i++) {
        if (originalContent[i] === '{') bracketCount++;
        else if (originalContent[i] === '}') bracketCount--;
        
        if (bracketCount === 0) {
          gameI18nEndIndex = i + 1; // +1 来包含最后的 }
          break;
        }
      }
      
      // 检查是否紧跟着有GameI18N.init()调用
      const afterGameI18n = originalContent.substring(gameI18nEndIndex, gameI18nEndIndex + 50);
      const initCallMatch = afterGameI18n.match(/GameI18N\.init\(\);/);
      
      if (initCallMatch) {
        gameI18nEndIndex += initCallMatch.index + initCallMatch[0].length;
      }
      
      // 替换旧的代码
      updatedContent = originalContent.substring(0, gameI18nStartIndex) + 
                       processedTemplate + 
                       originalContent.substring(gameI18nEndIndex);
    } else if (scriptClosingTagIndex !== -1) {
      // 如果没有GameI18N代码但有</script>标签，在最后一个</script>前插入
      updatedContent = originalContent.substring(0, scriptClosingTagIndex) + 
                       '\n// 游戏页面国际化代码\n' + processedTemplate + '\n' + 
                       originalContent.substring(scriptClosingTagIndex);
    } else {
      // 如果没有</script>标签，在</body>前插入
      const bodyClosingTagIndex = originalContent.lastIndexOf('</body>');
      if (bodyClosingTagIndex !== -1) {
        updatedContent = originalContent.substring(0, bodyClosingTagIndex) + 
                         '\n<script>\n// 游戏页面国际化代码\n' + processedTemplate + '\n</script>\n' + 
                         originalContent.substring(bodyClosingTagIndex);
      } else {
        console.error(`文件 ${filePath} 既没有</script>也没有</body>标签，无法插入代码`);
        return false;
      }
    }
    
    // 写入更新后的内容
    await writeFileAsync(filePath, updatedContent, 'utf8');
    console.log(`已成功更新文件: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`处理文件 ${filePath} 时发生错误:`, error);
    return false;
  }
};

// 主函数：处理所有游戏页面
const updateAllGamePages = async () => {
  try {
    const gamesDir = path.join(__dirname, '..', 'games');
    const files = await readdirAsync(gamesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`找到 ${htmlFiles.length} 个游戏页面`);
    
    // 添加处理限制，每次最多处理10个文件，以避免资源过度使用
    const BATCH_SIZE = 10;
    console.log(`处理限制: 每次最多处理 ${BATCH_SIZE} 个文件`);
    
    // 如果要处理所有文件，请移除或注释下面这行，并取消注释下面的代码块
    const filesToProcess = htmlFiles.slice(0, BATCH_SIZE);
    
    // 取消下面注释以处理所有文件
    // const filesToProcess = htmlFiles;
    
    console.log(`本次将处理 ${filesToProcess.length} 个文件`);
    
    const template = await getGameI18nTemplate();
    let successCount = 0;
    
    for (const file of filesToProcess) {
      const filePath = path.join(gamesDir, file);
      const success = await processGamePage(filePath, template);
      if (success) successCount++;
    }
    
    console.log(`=======================================`);
    console.log(`总结: 成功处理 ${successCount} / ${filesToProcess.length} 个文件`);
    console.log(`=======================================`);
  } catch (error) {
    console.error('更新游戏页面时发生错误:', error);
  }
};

// 执行更新
updateAllGamePages(); 