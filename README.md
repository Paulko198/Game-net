# AllPopularGames.online

这是一个多页面游戏网站，可以部署在Cloudflare Pages上。

## 项目结构

```
.
├── index.html          # 网站主页
├── about.html          # 关于我们页面
├── styles.css          # 全局样式
├── scripts/
│   └── main.js         # 全局JavaScript
├── games/              # 游戏目录
│   ├── game1.html      # 记忆翻牌游戏页面
│   ├── game1.css       # 记忆翻牌游戏样式
│   └── game1.js        # 记忆翻牌游戏逻辑
├── images/             # 图片资源目录
├── _redirects          # Cloudflare Pages重定向配置
└── README.md           # 项目说明
```

## 部署到Cloudflare Pages

1. 在GitHub上创建一个新仓库
2. 将这个项目上传到该仓库
3. 登录Cloudflare Dashboard
4. 进入Pages页面，点击"创建项目"
5. 选择连接到GitHub并选择你的仓库
6. 按照向导完成部署设置，无需特殊配置
7. 部署完成后，你可以在Cloudflare提供的域名上访问你的游戏站
8. 在Cloudflare的DNS设置中，将域名allpopulargames.online指向Cloudflare Pages提供的域名

## 添加新游戏

要添加新游戏，你需要：

1. 在games目录下创建新的HTML、CSS和JS文件
2. 在index.html中添加新游戏的链接
3. 重新部署网站

## 本地开发

你可以使用任何静态文件服务器在本地开发这个项目，例如：

```
npx serve
```

或者，如果你安装了Python：

```
python -m http.server
```

然后在浏览器中访问 http://localhost:8000 