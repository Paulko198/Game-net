# Logo上传指南

## 问题：网站Logo未显示

您的网站logo未正确显示，因为图片文件尚未上传到正确位置。请按照以下步骤操作：

## 上传步骤

1. 将您的logo图片（您之前分享的蓝色和金色"AllPopularGames"logo）保存为以下文件：
   - 主要logo：`images/logo.png`
   - 网站图标：`images/favicon.ico`（从logo生成16x16、32x32和48x48尺寸的图标）

2. 图片尺寸建议：
   - 顶部导航栏logo：宽度约150-200像素
   - 欢迎横幅logo：宽度约250-300像素
   - 确保图片具有透明背景（PNG格式）以适应网站的深色主题

3. 文件放置位置：
   - 主页使用相对路径：`images/logo.png`和`images/favicon.ico`
   - 游戏页面使用相对路径：`../images/logo.png`和`../images/favicon.ico`

## 验证

上传完成后，刷新网站，应该可以在以下位置看到您的logo：
1. 网站左上角导航栏
2. 欢迎横幅区域
3. 浏览器标签页的favicon位置

如果logo仍未显示，请检查：
- 文件名是否正确（区分大小写）
- 文件格式是否支持（推荐PNG格式）
- 文件大小是否适中（过大的文件可能加载缓慢） 