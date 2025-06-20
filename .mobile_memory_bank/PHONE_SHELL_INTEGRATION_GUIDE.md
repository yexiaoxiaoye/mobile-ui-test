# 手机外壳系统集成指南

## 🎯 概述

手机外壳系统是一个可复用的手机外观组件库，提供统一的手机边框、状态栏、动态岛等UI元素，支持主题颜色自定义和响应式缩放。

## 📁 文件结构

```
src/mobile-ui-test/
├── styles/
│   └── phone-shell.css          # 手机外壳样式文件
├── apps/
│   └── phone-shell.js           # 手机外壳JavaScript模块
└── phone-shell-demo.html        # 演示页面
```

## 🚀 快速开始

### 1. 引入文件

在您的HTML页面中引入必要的文件：

```html
<!-- 引入jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- 引入手机外壳样式 -->
<link rel="stylesheet" href="styles/phone-shell.css">

<!-- 引入手机外壳脚本 -->
<script src="apps/phone-shell.js"></script>
```

### 2. 初始化系统

```javascript
$(document).ready(function() {
    // 初始化手机外壳系统
    if (window.PhoneShell) {
        window.PhoneShell.init();
        console.log('手机外壳系统初始化完成');
    }
});
```

### 3. 创建手机外壳

```javascript
// 创建应用内容
const appContent = `
    <div class="your-app-content">
        <h1>您的应用内容</h1>
        <p>这里放置您的应用界面</p>
    </div>
`;

// 创建手机外壳HTML
const phoneHTML = window.PhoneShell.createShellHTML(appContent, 'your_phone_id');

// 添加到页面
$('body').append(phoneHTML);
```

### 4. 显示和隐藏

```javascript
// 显示手机外壳
window.PhoneShell.show('your_phone_id');

// 隐藏手机外壳
window.PhoneShell.hide('your_phone_id');
```

## 🎨 主题系统

### 可用主题

- **classic**: 经典白色主题
- **dark**: 深色主题
- **pink**: 粉色主题
- **blue**: 蓝色主题
- **green**: 绿色主题

### 切换主题

```javascript
// 切换到深色主题
window.PhoneShell.setTheme('dark', 'your_phone_id');

// 获取当前主题
const currentTheme = window.PhoneShell.getCurrentTheme();
console.log('当前主题:', currentTheme.name);

// 获取所有可用主题
const allThemes = window.PhoneShell.getAllThemes();
```

### 创建主题选择器

```javascript
// 创建主题选择器HTML
const themeSelectorHTML = window.PhoneShell.createThemeSelector('theme_selector');
$('#theme_container').html(themeSelectorHTML);

// 绑定事件
window.PhoneShell.bindThemeSelector('theme_selector', 'your_phone_id');
```

## ⏰ 时间管理

```javascript
// 更新时间显示
window.PhoneShell.updateTime('your_phone_id');

// 开始自动时间更新
window.PhoneShell.startTimeUpdate('your_phone_id');

// 停止时间更新
window.PhoneShell.stopTimeUpdate();
```

## 📱 响应式缩放

系统自动处理响应式缩放，但您也可以手动控制：

```javascript
// 更新单个外壳的缩放
window.PhoneShell.updateResponsiveScale('your_phone_id');

// 更新所有外壳的缩放
window.PhoneShell.updateAllShellsScale();
```

## 🔧 高级用法

### 自定义CSS变量

您可以通过CSS变量自定义外观：

```css
.your-custom-theme {
    --phone-shell-primary: #your-color;
    --phone-shell-secondary: #your-color;
    --status-bar-text: #your-color;
    --dynamic-island-bg: #your-color;
}
```

### 监听事件

```javascript
// 监听窗口变化
$(window).on('resize', function() {
    window.PhoneShell.updateAllShellsScale();
});
```

## 📋 API 参考

### PhoneShell.init()
初始化手机外壳系统

### PhoneShell.createShellHTML(contentHTML, shellId)
- `contentHTML`: 应用内容HTML
- `shellId`: 外壳元素ID
- 返回: 完整的手机外壳HTML字符串

### PhoneShell.show(shellId)
显示指定的手机外壳

### PhoneShell.hide(shellId)
隐藏指定的手机外壳

### PhoneShell.setTheme(themeName, shellId)
设置主题
- `themeName`: 主题名称
- `shellId`: 外壳元素ID

### PhoneShell.getCurrentTheme()
获取当前主题信息

### PhoneShell.getAllThemes()
获取所有可用主题

### PhoneShell.updateTime(shellId)
更新时间显示

### PhoneShell.startTimeUpdate(shellId)
开始自动时间更新

### PhoneShell.stopTimeUpdate()
停止时间更新

### PhoneShell.updateResponsiveScale(shellId)
更新响应式缩放

### PhoneShell.destroy()
销毁外壳系统

## 🔄 迁移现有应用

### 从旧系统迁移

1. **移除旧的外壳代码**：删除手机边框、状态栏等HTML结构
2. **引入新系统**：添加phone-shell.css和phone-shell.js
3. **更新应用代码**：使用新的API创建外壳
4. **测试功能**：确保所有功能正常工作

### QQ应用迁移示例

```javascript
// 旧代码（需要删除）
// <div class="phone-status-bar">...</div>
// <div class="dynamic-island">...</div>

// 新代码
const qqContent = `
    <div class="qq-app-content">
        <!-- QQ应用的实际内容 -->
    </div>
`;

const phoneHTML = window.PhoneShell.createShellHTML(qqContent, 'qq_phone');
$('body').append(phoneHTML);
window.PhoneShell.show('qq_phone');
```

## 🧪 测试

### 运行演示

```bash
# 打开演示页面
open src/mobile-ui-test/phone-shell-demo.html
```

### 测试清单

- [ ] 手机外壳正常显示和隐藏
- [ ] 主题切换功能正常
- [ ] 时间显示和更新正常
- [ ] 响应式缩放在不同屏幕尺寸下正常
- [ ] 应用内容正确显示在外壳内
- [ ] 多个外壳实例可以同时存在

## 🐛 故障排除

### 常见问题

1. **外壳不显示**
   - 检查CSS文件是否正确引入
   - 确认JavaScript初始化是否成功
   - 查看控制台错误信息

2. **主题切换无效**
   - 确认主题名称拼写正确
   - 检查外壳元素ID是否存在
   - 验证CSS变量是否正确应用

3. **响应式缩放异常**
   - 检查窗口resize事件是否正确绑定
   - 确认CSS变量--phone-scale是否正确设置
   - 验证媒体查询是否生效

### 调试技巧

```javascript
// 启用详细日志
console.log('当前主题:', window.PhoneShell.getCurrentTheme());
console.log('外壳状态:', $('#your_phone_id').hasClass('show'));
console.log('缩放比例:', $('#your_phone_id').css('--phone-scale'));
```

## 📈 性能优化

1. **按需加载**: 只在需要时创建外壳实例
2. **事件管理**: 及时清理不需要的事件监听器
3. **内存管理**: 使用destroy()方法清理资源
4. **CSS优化**: 使用硬件加速的transform属性

## 🔮 未来计划

- [ ] 添加更多主题选项
- [ ] 支持自定义动画效果
- [ ] 提供更多状态栏图标
- [ ] 增加手势操作支持
- [ ] 优化性能和内存使用
