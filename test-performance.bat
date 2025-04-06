@echo off
echo ===================================================
echo     AllPopularGames 游戏网站性能测试工具
echo ===================================================

echo 1. 生成测试数据
echo 2. 启动本地服务器
echo 3. 分析测试结果
echo 4. 应用优化
echo 5. 退出

choice /C 12345 /M "请选择要执行的操作:"

if errorlevel 5 goto end
if errorlevel 4 goto optimize
if errorlevel 3 goto analyze
if errorlevel 2 goto serve
if errorlevel 1 goto generate

:generate
cls
echo ===================================================
echo               生成测试数据
echo ===================================================
echo.
echo 请输入要测试的游戏数量 (推荐: 10、100、500、1000、2000、5000):
set /p gameCount=

if "%gameCount%"=="" set gameCount=100

echo.
echo 正在生成 %gameCount% 个游戏数据...
node scripts/performance-test.js %gameCount%

echo.
echo 数据生成完成！
echo.
pause
goto start

:serve
cls
echo ===================================================
echo               启动本地服务器
echo ===================================================
echo.
echo 正在启动本地服务器...
echo 请在服务器启动后打开浏览器访问: http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo.
start "" http://localhost:3000
npx serve
goto start

:analyze
cls
echo ===================================================
echo               分析测试结果
echo ===================================================
echo.
echo 正在分析测试结果...
node scripts/analyze-performance.js
echo.
pause
goto start

:optimize
cls
echo ===================================================
echo               应用性能优化
echo ===================================================
echo.
echo 正在将优化方案应用到网站...
echo 1. 引入scripts/optimize-for-large-data.js
echo 2. 在index.html中添加引用
echo 3. 启用优化模块
echo.
echo 优化脚本已准备就绪！
echo 步骤 1: 在index.html中添加以下代码:
echo ^<script src="scripts/optimize-for-large-data.js"^>^</script^>
echo.
echo 步骤 2: 在main.js中添加以下代码:
echo // 应用游戏数据优化
echo const optimizations = window.GameOptimizations.applyOptimizations();
echo.
pause
goto start

:end
cls
echo 感谢使用性能测试工具！
timeout /t 3

:start 