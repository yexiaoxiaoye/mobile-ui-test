# 统一按钮系统

## 概述

统一按钮系统为QQ应用中的所有小房子按钮和返回按钮提供一致的视觉样式和交互效果。

## 文件结构

```
src/mobile-ui-test/image/
├── unified-buttons.css     # 统一按钮样式
├── unified-buttons.js      # 统一按钮管理器
└── UNIFIED_BUTTONS_README.md  # 说明文档
```

## 功能特性

### 🏠 小房子按钮统一样式
- QQ主页小房子按钮 (`#home_btn_main`)
- 聊天详情页小房子按钮 (`.chat-home-btn`)
- 好友群组管理页面小房子按钮 (`.friend-manager-home-btn`)
- 美化应用小房子按钮 (`.wallpaper-home-btn`)

### 🔙 返回按钮统一样式
- QQ聊天页面返回按钮 (`.back-to-main-list-btn`)
- 好友群组管理返回按钮 (`#friend_manager_back_btn`)
- 美化应用返回按钮 (`.wallpaper-back-btn`)
- QQ联系人列表返回按钮 (`.back`)

### ✨ 统一特性
- **SVG图标**: 所有按钮使用高质量SVG图标
- **动态效果**: 统一的hover和active状态动画
- **响应式设计**: 适配不同屏幕尺寸
- **自动更新**: 监听DOM变化，自动应用样式到新按钮

## SVG图标

### 小房子图标
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
  <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
</svg>
```

### 返回箭头图标
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/>
</svg>
```

## 样式特性

### 基础样式
- **尺寸**: 32x32px
- **背景**: 透明
- **边框**: 无
- **颜色**: 黑色 (`currentColor`)
- **光标**: 指针

### 动画效果
- **Hover**: `scale(1.1)` + 淡色背景
- **Active**: `scale(0.9)` + 深色背景
- **过渡**: `transform 0.2s ease`

## 使用方法

### 自动初始化
系统会在DOM加载完成后自动初始化：
```javascript
$(document).ready(function() {
  setTimeout(() => {
    window.UnifiedButtons.init();
    window.UnifiedButtons.observeChanges();
  }, 500);
});
```

### 手动刷新
如果需要手动刷新按钮样式：
```javascript
// 全局刷新函数
window.refreshUnifiedButtons();

// 或直接调用管理器
window.UnifiedButtons.refresh();
```

### 事件监听
系统监听以下事件来自动刷新按钮样式：
- `qq-app-loaded`: QQ应用加载完成
- `friend-manager-shown`: 好友管理页面显示
- `wallpaper-app-shown`: 美化应用显示

## 集成方式

### HTML引入
```html
<!-- CSS样式 -->
<link rel="stylesheet" href="image/unified-buttons.css">

<!-- JavaScript管理器 -->
<script src="image/unified-buttons.js"></script>
```

### SillyTavern插件集成
系统已自动集成到`index.js`中：
```javascript
// 加载统一按钮CSS
await loadCSS(`${basePath}/image/unified-buttons.css`);

// 加载统一按钮JS
await loadScript(`${basePath}/image/unified-buttons.js`);
```

## 开发指南

### 添加新按钮
1. 在HTML中创建按钮，使用相应的CSS类
2. 按钮会自动被系统检测并应用统一样式
3. 如需手动触发，调用`window.UnifiedButtons.refresh()`

### 自定义样式
如需自定义特定按钮的样式，可以：
1. 添加更具体的CSS选择器
2. 使用`!important`覆盖统一样式
3. 或在统一样式基础上添加额外样式

### 调试工具
- 测试页面: `test-unified-buttons.html`
- 控制台日志: 系统会输出详细的初始化和更新日志
- 全局函数: `window.refreshUnifiedButtons()`

## 兼容性

- ✅ 支持所有现代浏览器
- ✅ 响应式设计
- ✅ 触摸设备友好
- ✅ 高DPI屏幕优化

## 故障排除

### 按钮样式未生效
1. 检查CSS文件是否正确加载
2. 确认JavaScript管理器已初始化
3. 手动调用`window.refreshUnifiedButtons()`

### 新按钮未自动更新
1. 确认DOM监听器正在运行
2. 检查按钮是否使用了正确的CSS类
3. 手动触发刷新

### 样式冲突
1. 检查是否有其他CSS规则覆盖
2. 使用浏览器开发者工具检查样式优先级
3. 调整CSS选择器的特异性

## 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- 🏠 统一小房子按钮样式
- 🔙 统一返回按钮样式
- 🎨 SVG图标支持
- 🔄 自动DOM监听
- 📱 响应式设计
- 🧪 测试页面
