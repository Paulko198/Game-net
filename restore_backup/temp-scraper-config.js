
    /**
     * 临时爬虫配置文件 - 自动生成
     * 生成时间: 2025-04-03T13:12:39.918Z
     */
    
    const path = require('path');
    
    module.exports = {
  "baseUrl": "https://html5games.com",
  "outputFile": "E:\\Cursor_Code\\Gamenet\\test_scraped_games.json",
  "tempDir": "E:\\Cursor_Code\\Gamenet\\temp",
  "logFile": "E:\\Cursor_Code\\Gamenet\\scripts\\scraper-log.txt",
  "gamesPerCategory": 3,
  "requestDelay": [
    1000,
    3000
  ],
  "trackScrapedUrls": true,
  "scrapedUrlsFile": "E:\\Cursor_Code\\Gamenet\\scraped_urls.json",
  "importToSystem": true,
  "systemApiUrl": "http://localhost:8000/save-games-json",
  "categoryMapping": {
    "Sport": "Sports",
    "Sports": "Sports",
    "Match 3": "Puzzle",
    "Bubble Shooter": "Puzzle",
    "Puzzle": "Puzzle",
    "Quiz": "Educational",
    "Cards": "Card",
    "Girls": "Casual",
    "Jump & Run": "Action",
    "Arcade": "Arcade",
    "Racing": "Racing",
    "Multiplayer": "Multiplayer",
    "Skill": "Casual"
  },
  "priorityCategories": [
    "Popular Games",
    "Best",
    "Casual",
    "Sport",
    "Arcade",
    "Puzzle"
  ],
  "userAgents": [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0"
  ]
};
  