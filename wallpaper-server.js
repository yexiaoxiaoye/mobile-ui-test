// 简单的Node.js服务器，用于保存壁纸配置
// 运行方法: node wallpaper-server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'image', 'wallpaper-config.json');
const IMAGE_DIR = path.join(__dirname, 'image');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // 提供静态文件服务

// 确保image文件夹存在
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// 获取壁纸配置
app.get('/api/wallpaper-config', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      // 返回默认配置
      res.json({
        currentWallpaper: '',
        history: []
      });
    }
  } catch (error) {
    console.error('读取配置文件失败:', error);
    res.status(500).json({ error: '读取配置失败' });
  }
});

// 保存壁纸配置
app.post('/api/wallpaper-config', (req, res) => {
  try {
    const config = req.body;
    
    // 验证数据格式
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: '无效的配置数据' });
    }
    
    // 保存到文件
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    
    console.log('壁纸配置已保存:', config);
    res.json({ success: true, message: '配置保存成功' });
  } catch (error) {
    console.error('保存配置文件失败:', error);
    res.status(500).json({ error: '保存配置失败' });
  }
});

// 下载并保存壁纸图片（可选功能）
app.post('/api/download-wallpaper', async (req, res) => {
  try {
    const { url, filename } = req.body;
    
    if (!url || !filename) {
      return res.status(400).json({ error: '缺少URL或文件名' });
    }
    
    // 这里可以添加下载图片的逻辑
    // 由于需要额外的依赖，这里只是示例
    res.json({ 
      success: true, 
      message: '图片下载功能需要额外配置',
      localPath: path.join('image', filename)
    });
  } catch (error) {
    console.error('下载图片失败:', error);
    res.status(500).json({ error: '下载图片失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 壁纸服务器已启动: http://localhost:${PORT}`);
  console.log(`📁 配置文件位置: ${CONFIG_FILE}`);
  console.log(`🖼️ 图片文件夹: ${IMAGE_DIR}`);
});

module.exports = app;
