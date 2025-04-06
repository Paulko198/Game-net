const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const process = require('process');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);

// 获取游戏页面的模板内容
const getGameI18nTemplate = async () => {
  return await readFileAsync(path.join(__dirname, 'game-i18n-template.js'), 'utf8');
};

// 处理单个游戏页面
const processGamePage = async (filePath, template) => {
  try {
    console.log(`开始处理文件: ${path.basename(filePath)}`);
    
    // 读取原始文件内容
    let originalContent;
    try {
      originalContent = await readFileAsync(filePath, 'utf8');
      console.log(`成功读取文件，大小: ${originalContent.length} 字节`);
    } catch (readError) {
      console.error(`读取文件 ${path.basename(filePath)} 失败:`, readError);
      return false;
    }
    
    // 检查页面是否已包含GameI18N对象
    if (originalContent.includes('const GameI18N = {')) {
      console.log(`文件 ${path.basename(filePath)} 已包含GameI18N对象，将替换为新版本`);
    }
    
    // 从HTML中提取游戏标题和类型
    const gameTitleMatch = originalContent.match(/<title>(.*?)\s*-\s*免费在线玩/);
    const metaDescriptionMatch = originalContent.match(/<meta name="description" content="立即在线玩.*?，一款精彩的(\w+)游戏/);
    const gameTypeFromClass = originalContent.match(/<span class="game-type-badge">([^<]+)/);
    
    const gameTitle = gameTitleMatch ? gameTitleMatch[1].trim() : path.basename(filePath, '.html');
    const gameType = metaDescriptionMatch ? metaDescriptionMatch[1].trim() : 
                    (gameTypeFromClass ? gameTypeFromClass[1].trim() : '');
    
    console.log(`游戏标题: ${gameTitle}, 类型: ${gameType || '未找到'}`);
    
    // 修复游戏标题中可能存在的问题（如果从文件名提取）
    const formattedTitle = gameTitle
      .replace(/-/g, ' ')  // 将连字符替换为空格
      .replace(/\b\w/g, c => c.toUpperCase());  // 首字母大写
    
    // 替换模板中的占位符
    let processedTemplate = template
      .replace(/GAME_TITLE/g, formattedTitle)
      .replace(/GAME_TYPE/g, gameType);
    
    // 找到要插入/替换代码的位置
    let updatedContent;
    
    try {
      // 查找脚本部分并插入/替换GameI18N代码
      const scriptClosingTagIndex = originalContent.lastIndexOf('</script>');
      
      // 如果页面已有GameI18N代码，则替换它
      const gameI18nStartIndex = originalContent.indexOf('const GameI18N = {');
      if (gameI18nStartIndex !== -1) {
        console.log(`找到GameI18N代码起始位置: ${gameI18nStartIndex}`);
        
        // 找到GameI18N代码块的结束位置
        const gameI18nEndSearchStartPos = gameI18nStartIndex + 'const GameI18N = {'.length;
        let bracketCount = 1; // 已经找到了一个开始的大括号
        let gameI18nEndIndex = gameI18nEndSearchStartPos;
        let foundEndBracket = false;
        
        // 设置最大搜索长度，避免无限循环
        const maxSearchLength = 50000; // 最多搜索5万个字符
        const searchEndPos = Math.min(originalContent.length, gameI18nEndSearchStartPos + maxSearchLength);
        
        for (let i = gameI18nEndSearchStartPos; i < searchEndPos; i++) {
          if (originalContent[i] === '{') bracketCount++;
          else if (originalContent[i] === '}') bracketCount--;
          
          if (bracketCount === 0) {
            gameI18nEndIndex = i + 1; // +1 来包含最后的 }
            foundEndBracket = true;
            break;
          }
        }
        
        if (!foundEndBracket) {
          console.log(`警告: 未找到GameI18N代码的结束括号，将使用基于关键字的替代方法`);
          // 使用基于关键字的替代方法查找结束位置
          const endKeyword = 'GameI18N.init();';
          const keywordPos = originalContent.indexOf(endKeyword, gameI18nStartIndex);
          
          if (keywordPos !== -1) {
            gameI18nEndIndex = keywordPos + endKeyword.length;
            console.log(`使用关键字方法找到GameI18N代码结束位置: ${gameI18nEndIndex}`);
          } else {
            // 如果找不到关键字，使用固定的结束位置
            const fixedEndPos = originalContent.indexOf('</script>', gameI18nStartIndex);
            if (fixedEndPos !== -1) {
              gameI18nEndIndex = fixedEndPos;
              console.log(`使用固定位置方法找到GameI18N代码结束位置: ${gameI18nEndIndex}`);
            } else {
              console.error(`无法确定GameI18N代码的结束位置，跳过该文件`);
              return false;
            }
          }
        } else {
          console.log(`找到GameI18N代码结束位置: ${gameI18nEndIndex}`);
        }
        
        // 检查是否紧跟着有GameI18N.init()调用
        try {
          const afterGameI18n = originalContent.substring(gameI18nEndIndex, Math.min(gameI18nEndIndex + 50, originalContent.length));
          const initCallMatch = afterGameI18n.match(/GameI18N\.init\(\);/);
          
          if (initCallMatch) {
            gameI18nEndIndex += initCallMatch.index + initCallMatch[0].length;
            console.log(`找到GameI18N.init()调用，新的结束位置: ${gameI18nEndIndex}`);
          }
        } catch (analyzeError) {
          console.error(`分析GameI18N.init()调用时出错:`, analyzeError);
        }
        
        // 替换旧的代码
        updatedContent = safeReplace(originalContent, gameI18nStartIndex, gameI18nEndIndex, processedTemplate);
        if (!updatedContent) {
          console.error(`替换GameI18N代码失败，跳过该文件`);
          return false;
        }
        console.log(`已替换旧的GameI18N代码`);
      } else if (scriptClosingTagIndex !== -1) {
        // 如果没有GameI18N代码但有</script>标签，在最后一个</script>前插入
        console.log(`未找到GameI18N代码，但找到</script>标签，位置: ${scriptClosingTagIndex}`);
        updatedContent = safeReplace(originalContent, scriptClosingTagIndex, scriptClosingTagIndex, '\n// 游戏页面国际化代码\n' + processedTemplate + '\n');
        if (!updatedContent) {
          console.error(`在</script>标签前插入GameI18N代码失败，跳过该文件`);
          return false;
        }
        console.log(`已在</script>标签前插入GameI18N代码`);
      } else {
        // 如果没有</script>标签，在</body>前插入
        const bodyClosingTagIndex = originalContent.lastIndexOf('</body>');
        if (bodyClosingTagIndex !== -1) {
          console.log(`未找到</script>标签，但找到</body>标签，位置: ${bodyClosingTagIndex}`);
          updatedContent = safeReplace(originalContent, bodyClosingTagIndex, bodyClosingTagIndex, '\n<script>\n// 游戏页面国际化代码\n' + processedTemplate + '\n</script>\n');
          if (!updatedContent) {
            console.error(`在</body>标签前插入GameI18N代码失败，跳过该文件`);
            return false;
          }
          console.log(`已在</body>标签前插入GameI18N代码`);
        } else {
          console.error(`文件 ${path.basename(filePath)} 既没有</script>也没有</body>标签，无法插入代码`);
          return false;
        }
      }
    } catch (processingError) {
      console.error(`处理文件内容时出错:`, processingError);
      return false;
    }
    
    // 写入更新后的内容
    try {
      await writeFileAsync(filePath, updatedContent, 'utf8');
      console.log(`文件 ${path.basename(filePath)} 已成功更新`);
      return true;
    } catch (writeError) {
      console.error(`写入文件 ${path.basename(filePath)} 失败:`, writeError);
      return false;
    }
  } catch (error) {
    console.error(`处理文件 ${path.basename(filePath)} 时发生未预期错误:`, error);
    return false;
  }
};

// 安全替换函数
const safeReplace = (content, startIndex, endIndex, replacement) => {
  // 检查索引是否有效
  if (startIndex < 0 || endIndex > content.length) {
    console.error(`无效的替换范围: startIndex=${startIndex}, endIndex=${endIndex}, contentLength=${content.length}`);
    return null;
  }
  
  try {
    // 处理相同的起始和结束索引（插入操作）
    if (startIndex === endIndex) {
      return content.substring(0, startIndex) + replacement + content.substring(startIndex);
    }
    
    // 处理普通替换操作
    return content.substring(0, startIndex) + replacement + content.substring(endIndex);
  } catch (error) {
    console.error(`替换内容时出错:`, error);
    return null;
  }
};

// 设置处理单个文件的超时时间
const processGamePageWithTimeout = async (filePath, template, timeoutMs = 10000) => {
  return new Promise((resolve) => {
    // 设置超时
    const timeoutId = setTimeout(() => {
      console.error(`处理文件 ${path.basename(filePath)} 超时，跳过`);
      resolve(false);
    }, timeoutMs);
    
    // 执行处理
    processGamePage(filePath, template)
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`处理文件 ${path.basename(filePath)} 发生异常:`, error);
        resolve(false);
      });
  });
};

// 主函数：处理所有游戏页面
const updateAllGamePages = async () => {
  console.log(`====== 游戏页面国际化更新脚本 ======`);
  console.log(`开始时间: ${new Date().toLocaleString()}`);
  
  // 设置全局脚本超时（30分钟）
  const scriptTimeout = setTimeout(() => {
    console.error(`\n脚本执行超时，强制退出`);
    process.exit(1);
  }, 30 * 60 * 1000);
  
  try {
    // 解析命令行参数
    const args = process.argv.slice(2);
    let startIndex = 0;
    let batchSize = 10;
    
    // 如果提供了命令行参数，则使用它们
    if (args.length >= 1) {
      startIndex = parseInt(args[0], 10) || 0;
    }
    if (args.length >= 2) {
      batchSize = parseInt(args[1], 10) || 10;
    }
    
    // 确保索引非负
    startIndex = Math.max(0, startIndex);
    batchSize = Math.max(1, batchSize);
    
    console.log(`命令行参数: ${JSON.stringify(args)}`);
    console.log(`解析后的参数: startIndex=${startIndex}, batchSize=${batchSize}`);
    
    // 获取游戏页面文件
    console.log(`尝试读取游戏页面目录...`);
    const gamesDir = path.join(__dirname, '..', 'games');
    let files;
    try {
      files = await readdirAsync(gamesDir);
      console.log(`成功读取游戏页面目录，找到 ${files.length} 个文件`);
    } catch (dirError) {
      console.error(`读取目录失败:`, dirError);
      return;
    }
    
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`找到 ${htmlFiles.length} 个游戏页面`);
    console.log(`批处理参数: 起始索引=${startIndex}, 批处理大小=${batchSize}`);
    
    // 计算实际处理文件的范围
    const endIndex = Math.min(startIndex + batchSize, htmlFiles.length);
    const filesToProcess = htmlFiles.slice(startIndex, endIndex);
    
    console.log(`将处理 ${filesToProcess.length} 个文件 (索引 ${startIndex} 到 ${endIndex-1})`);
    
    // 获取模板
    console.log(`尝试读取GameI18N模板...`);
    let template;
    try {
      template = await getGameI18nTemplate();
      console.log(`成功读取模板，大小: ${template.length} 字节`);
    } catch (templateError) {
      console.error(`获取模板失败:`, templateError);
      return;
    }
    
    let successCount = 0;
    
    for (let i = 0; i < filesToProcess.length; i++) {
      try {
        const file = filesToProcess[i];
        console.log(`\n[${i+1}/${filesToProcess.length}] 处理文件: ${file}`);
        const filePath = path.join(gamesDir, file);
        
        // 使用带超时的处理函数
        const success = await processGamePageWithTimeout(filePath, template, 30000);
        if (success) successCount++;
      } catch (fileError) {
        console.error(`处理文件时发生意外错误:`, fileError);
        continue;
      }
    }
    
    console.log(`\n=======================================`);
    console.log(`总结: 成功处理 ${successCount} / ${filesToProcess.length} 个文件`);
    console.log(`下一批次起始索引: ${endIndex}`);
    console.log(`要处理下一批文件，请运行: node update-game-i18n.js ${endIndex} ${batchSize}`);
    console.log(`结束时间: ${new Date().toLocaleString()}`);
    console.log(`=======================================`);
  } catch (error) {
    console.error('更新游戏页面时发生错误:', error);
  } finally {
    // 清除全局超时
    clearTimeout(scriptTimeout);
  }
};

// 执行更新
updateAllGamePages(); 