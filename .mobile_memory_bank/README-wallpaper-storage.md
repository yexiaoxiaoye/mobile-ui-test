# 美化应用 - 文件存储配置指南

## 📋 概述

美化应用现在支持两种存储模式：
1. **localStorage存储**（默认）- 数据保存在浏览器中
2. **文件存储**（可选）- 数据保存到本地文件系统，支持跨浏览器、跨设备共享

## 🚀 快速开始

### 方法1：使用localStorage（默认，无需配置）
```javascript
// 默认模式，无需额外配置
window.WallpaperApp.init();
```

### 方法2：启用文件存储

#### 步骤1：安装依赖
```bash
cd src/mobile-ui-test
npm install
```

#### 步骤2：启动后端服务器
```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

#### 步骤3：在前端启用文件存储
```javascript
// 启用文件存储模式
window.WallpaperApp.enableFileStorage();

// 或者指定自定义API地址
window.WallpaperApp.enableFileStorage('http://localhost:3001/api');
```

## 📁 文件存储位置

启用文件存储后，壁纸配置将保存到：
```
src/mobile-ui-test/image/wallpaper-config.json
```

## 🔧 API接口

后端服务器提供以下接口：

### GET /api/wallpaper-config
获取当前壁纸配置
```json
{
  "currentWallpaper": "https://example.com/wallpaper.jpg",
  "history": [
    {
      "url": "https://example.com/wallpaper.jpg",
      "name": "示例壁纸",
      "timestamp": 1703123456789
    }
  ]
}
```

### POST /api/wallpaper-config
保存壁纸配置
```json
{
  "currentWallpaper": "https://example.com/new-wallpaper.jpg",
  "history": [...]
}
```

## 💡 使用示例

### 检查后端服务状态
```javascript
const isAvailable = await window.WallpaperApp.checkBackendAvailable();
console.log('后端服务可用:', isAvailable);
```

### 切换存储模式
```javascript
// 启用文件存储
window.WallpaperApp.enableFileStorage();

// 切换回localStorage
window.WallpaperApp.disableFileStorage();
```

### 自动回退机制
如果后端服务不可用，系统会自动回退到localStorage存储，确保功能正常运行。

## 🔒 安全说明

- 后端服务器只在本地运行（localhost）
- 不会上传任何数据到外部服务器
- 配置文件保存在本地文件系统中
- 支持CORS，允许前端页面访问

## 🛠️ 故障排除

### 问题1：后端服务启动失败
```bash
# 检查Node.js版本（需要14+）
node --version

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 问题2：前端无法连接后端
1. 确认后端服务正在运行（http://localhost:3001）
2. 检查防火墙设置
3. 确认API地址配置正确

### 问题3：配置文件权限问题
```bash
# 确保image文件夹有写入权限
chmod 755 src/mobile-ui-test/image
```

## 📊 演示页面

访问以下页面查看完整演示：
- `wallpaper-file-storage-demo.html` - 文件存储演示
- `wallpaper-no-preview-test.html` - 基础功能测试

## 🔄 迁移指南

### 从localStorage迁移到文件存储
1. 启动后端服务器
2. 在前端启用文件存储模式
3. 现有的localStorage数据会自动作为回退方案

### 从文件存储迁移到localStorage
1. 禁用文件存储模式
2. 数据会自动保存到localStorage
3. 可以安全关闭后端服务器

## 📝 注意事项

1. **跨设备共享**：需要将整个 `mobile-ui-test` 文件夹同步到其他设备
2. **备份建议**：定期备份 `image/wallpaper-config.json` 文件
3. **性能影响**：文件存储模式会有轻微的网络延迟
4. **浏览器兼容性**：支持所有现代浏览器的fetch API
