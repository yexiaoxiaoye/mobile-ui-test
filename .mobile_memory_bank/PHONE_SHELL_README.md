# 📱 手机外壳系统

> 可复用的手机外观组件库，支持主题自定义和响应式缩放

## ✨ 特性

- 🎨 **多主题支持** - 5种预设主题，支持自定义颜色
- 📱 **响应式设计** - 自动适配不同屏幕尺寸
- ⏰ **实时时间** - 自动更新的状态栏时间显示
- 🔧 **易于集成** - 简单的API，快速集成到现有项目
- 💾 **状态保存** - 自动保存用户的主题选择
- 🎯 **高性能** - 使用CSS硬件加速，流畅的动画效果

## 🚀 快速开始

### 1. 引入文件

```html
<link rel="stylesheet" href="styles/phone-shell.css">
<script src="apps/phone-shell.js"></script>
```

### 2. 初始化

```javascript
window.PhoneShell.init();
```

### 3. 创建手机外壳

```javascript
const content = '<div>您的应用内容</div>';
const phoneHTML = window.PhoneShell.createShellHTML(content, 'my_phone');
$('body').append(phoneHTML);
window.PhoneShell.show('my_phone');
```

## 🎨 主题系统

### 预设主题

| 主题名称 | 描述 | 适用场景 |
|---------|------|----------|
| `classic` | 经典白色 | 日常使用，简洁明亮 |
| `dark` | 深色主题 | 夜间使用，护眼舒适 |
| `pink` | 粉色主题 | 温馨可爱，充满活力 |
| `blue` | 蓝色主题 | 专业清新，商务风格 |
| `green` | 绿色主题 | 自然舒适，环保理念 |

### 主题切换

```javascript
// 切换主题
window.PhoneShell.setTheme('dark', 'my_phone');

// 获取当前主题
const theme = window.PhoneShell.getCurrentTheme();
console.log(theme.name); // "深色主题"
```

## 📱 响应式缩放

系统自动根据屏幕尺寸调整手机外壳大小：

- **超小屏幕** (< 400px): 85% 缩放
- **小屏幕** (400px-768px): 90% 缩放
- **中等屏幕** (768px-1024px): 100% 缩放
- **大屏幕** (≥ 1024px): 100% 缩放（保持原始尺寸）

## 🔧 API 参考

### 核心方法

```javascript
// 系统管理
PhoneShell.init()                              // 初始化系统
PhoneShell.destroy()                           // 销毁系统

// 外壳管理
PhoneShell.createShellHTML(content, id)        // 创建外壳HTML
PhoneShell.show(shellId)                       // 显示外壳
PhoneShell.hide(shellId)                       // 隐藏外壳

// 主题管理
PhoneShell.setTheme(themeName, shellId)        // 设置主题
PhoneShell.getCurrentTheme()                   // 获取当前主题
PhoneShell.getAllThemes()                      // 获取所有主题

// 时间管理
PhoneShell.updateTime(shellId)                 // 更新时间
PhoneShell.startTimeUpdate(shellId)            // 开始时间更新
PhoneShell.stopTimeUpdate()                    // 停止时间更新

// 缩放管理
PhoneShell.updateResponsiveScale(shellId)      // 更新缩放
PhoneShell.updateAllShellsScale()              // 更新所有缩放
```

## 📁 文件结构

```
src/mobile-ui-test/
├── styles/
│   └── phone-shell.css                 # 外壳样式文件
├── apps/
│   └── phone-shell.js                  # 外壳JavaScript模块
├── phone-shell-demo.html               # 演示页面
├── PHONE_SHELL_INTEGRATION_GUIDE.md    # 集成指南
└── PHONE_SHELL_README.md               # 本文件
```

## 🎯 使用场景

### QQ应用集成

```javascript
const qqContent = `
    <div class="qq-app">
        <!-- QQ应用界面 -->
    </div>
`;

const phoneHTML = window.PhoneShell.createShellHTML(qqContent, 'qq_phone');
$('body').append(phoneHTML);
window.PhoneShell.show('qq_phone');
window.PhoneShell.setTheme('blue', 'qq_phone');
```

### 美化应用集成

```javascript
const wallpaperContent = `
    <div class="wallpaper-app">
        <!-- 美化应用界面 -->
    </div>
`;

const phoneHTML = window.PhoneShell.createShellHTML(wallpaperContent, 'wallpaper_phone');
$('body').append(phoneHTML);
window.PhoneShell.show('wallpaper_phone');
```

## 🎨 自定义主题

### 创建自定义主题

```css
.phone-theme-custom {
    --phone-shell-primary: #your-primary-color;
    --phone-shell-secondary: #your-secondary-color;
    --phone-shell-accent: #your-accent-color;
    --status-bar-text: #your-text-color;
    --dynamic-island-bg: #your-island-color;
}
```

### 应用自定义主题

```javascript
// 添加到主题列表
window.PhoneShell.themes.custom = {
    name: '自定义主题',
    class: 'phone-theme-custom',
    description: '您的专属主题'
};

// 使用自定义主题
window.PhoneShell.setTheme('custom', 'my_phone');
```

## 🧪 演示和测试

### 运行演示

```bash
# 打开演示页面
open src/mobile-ui-test/phone-shell-demo.html
```

### 功能测试

- ✅ 外壳显示和隐藏
- ✅ 主题切换功能
- ✅ 时间显示更新
- ✅ 响应式缩放
- ✅ 多实例支持

## 🔄 迁移指南

### 从旧系统迁移

1. **移除旧代码**：删除手机边框、状态栏等HTML结构
2. **引入新系统**：添加phone-shell.css和phone-shell.js
3. **更新应用**：使用新API重构应用代码
4. **测试验证**：确保所有功能正常工作

### 迁移检查清单

- [ ] 移除旧的外壳HTML结构
- [ ] 移除旧的外壳CSS样式
- [ ] 引入新的外壳文件
- [ ] 更新应用初始化代码
- [ ] 测试主题切换功能
- [ ] 验证响应式缩放
- [ ] 检查时间显示功能

## 🐛 故障排除

### 常见问题

**Q: 外壳不显示？**
A: 检查CSS和JS文件是否正确引入，确认初始化是否成功

**Q: 主题切换无效？**
A: 确认主题名称正确，检查外壳元素ID是否存在

**Q: 缩放异常？**
A: 检查窗口resize事件绑定，验证CSS变量设置

### 调试技巧

```javascript
// 检查系统状态
console.log('当前主题:', window.PhoneShell.getCurrentTheme());
console.log('外壳状态:', $('#my_phone').hasClass('show'));
console.log('缩放比例:', $('#my_phone').css('--phone-scale'));
```

## 📈 性能优化

- 使用CSS硬件加速
- 按需创建外壳实例
- 及时清理事件监听器
- 优化CSS选择器性能

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个系统！

## 📄 许可证

MIT License

---

**手机外壳系统** - 让您的移动应用拥有统一、美观的外观体验！
