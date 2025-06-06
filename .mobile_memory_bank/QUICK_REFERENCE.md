# 手机应用集成快速参考

## 🚀 快速开始

### 检查系统状态
```javascript
// 检查手机界面
console.log('Phone interface:', $('#phone_interface').length > 0);
console.log('Phone visible:', $('#phone_interface').is(':visible'));

// 检查 SillyTavern 组件
console.log('World popup:', $('#world_popup').length > 0);
console.log('Prompt manager:', $('[id*="completion_prompt_manager"]').length);
```

### 强制修复
```javascript
// 重新显示手机界面
PhoneInterface.show();

// 强制清理状态
PhoneInterface.forceCleanState();

// 重新创建手机界面元素
PhoneInterface.createPhoneInterfaceElement();
```

## 📱 应用类型

### 集成式应用（在手机内显示）
- **QQ应用** - 聊天、联系人管理
- **美化应用** - 壁纸、主题设置

**特点：**
- 使用手机界面内的容器
- 保持手机界面显示
- 与手机UI深度集成

### 弹窗式应用（全屏弹窗）
- **淘宝应用** - 购物界面
- **任务应用** - 任务管理
- **背包应用** - 物品管理
- **抽卡应用** - 抽卡游戏

**特点：**
- 使用独立的全屏界面
- 隐藏手机界面
- 完全独立的UI

## 🛡️ 保护机制

### SillyTavern 原生组件（受保护）
```javascript
const protectedComponents = [
  '#world_popup',                    // 世界书
  '[id*="completion_prompt_manager"]', // 提示管理器
  '[id*="character_popup"]',         // 角色编辑
  '[id*="preset_popup"]',            // 预设设置
  '.drawer-content',                 // 抽屉内容
  '.ui-dialog'                       // UI对话框
];
```

### 手机插件组件（会被清理）
```javascript
const mobileComponents = [
  '#group_create_dialog',            // QQ群创建
  '#avatar_dialog',                  // 头像编辑
  '#accept_task_dialog',             // 任务接受
  '[id^="mobile_"]',                 // mobile_开头
  '[id^="qq_"]'                      // qq_开头
];
```

## 🔧 开发新应用

### 集成式应用模板
```javascript
// 1. 在 phone-interface.js 中添加容器
<div class="your-app-container"></div>

// 2. 修改显示策略
} else if (appName === 'YourApp') {
  console.log(`Opened ${appName}, keeping phone_interface visible.`);
} else {

// 3. 应用实现
const YourApp = {
  show: function() {
    $('#phone_interface').addClass('show');
    $('.your-app-container').html('应用内容');
  }
};
```

### 弹窗式应用模板
```javascript
// 1. 创建界面元素
<div id="your_app_interface" style="display: none;">
  <!-- 应用内容 -->
</div>

// 2. 添加CSS
#your_app_interface {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 510 !important;
  background: rgba(0, 0, 0, 0.9) !important;
}

// 3. 应用实现
const YourApp = {
  show: function() {
    $('#your_app_interface').show();
  },
  hide: function() {
    $('#your_app_interface').hide();
  }
};

// 4. 更新清理逻辑
// 在 closeAllApps() 中添加：
$('#your_app_interface').hide();

// 在 checkOpenApps() 中添加：
if ($('#your_app_interface').is(':visible')) {
  return true;
}
```

## 🐛 常见问题

### 问题：SillyTavern 组件消失
**解决：**
```javascript
// 检查保护状态
PhoneInterface.removeMobilePluginDialogs();

// 手动恢复（如果需要）
$('#world_popup').show();
```

### 问题：手机界面无法显示
**解决：**
```javascript
// 检查元素存在
if ($('#phone_interface').length === 0) {
  PhoneInterface.createPhoneInterfaceElement();
}

// 强制显示
PhoneInterface.show();
```

### 问题：弹窗应用看不到
**解决：**
```javascript
// 检查z-index
console.log('App z-index:', $('#your_app_interface').css('z-index'));

// 强制显示
$('#your_app_interface').css({
  'display': 'block',
  'z-index': '510',
  'position': 'fixed'
});
```

## 📊 Z-Index 层级

```
3010 - SillyTavern 原生组件
 510 - 弹窗应用界面
 500 - 手机界面
 450 - 手机按钮
```

## 🔍 调试命令

```javascript
// 完整状态检查
console.log('=== 系统状态 ===');
console.log('PhoneInterface:', typeof window.PhoneInterface);
console.log('Phone element:', $('#phone_interface').length);
console.log('Phone visible:', $('#phone_interface').is(':visible'));
console.log('Apps visible:', {
  taobao: $('#taobao_interface').is(':visible'),
  task: $('#task_interface').is(':visible'),
  backpack: $('#backpack_interface').is(':visible'),
  chouka: $('#chouka_interface').is(':visible')
});

// 强制修复所有问题
PhoneInterface.forceCleanState();
PhoneInterface.show();
```

## 📝 修改检查清单

开发新应用时的检查清单：

### 集成式应用
- [ ] 在手机界面HTML中添加应用容器
- [ ] 修改 `phone-interface.js` 中的显示策略
- [ ] 实现应用的 `show()` 和 `hide()` 方法
- [ ] 测试与手机界面的集成效果

### 弹窗式应用
- [ ] 创建独立的界面元素
- [ ] 添加CSS样式（position, z-index等）
- [ ] 更新 `closeAllApps()` 函数
- [ ] 更新 `checkOpenApps()` 函数
- [ ] 实现应用的 `show()` 和 `hide()` 方法
- [ ] 测试全屏显示效果

### 通用检查
- [ ] 确保不与 SillyTavern 原生组件冲突
- [ ] 添加适当的错误处理和日志
- [ ] 测试应用的打开和关闭
- [ ] 验证点击外部关闭逻辑
- [ ] 检查移动端兼容性

## 📚 相关文档

- **详细指南**: `MOBILE_APPS_INTEGRATION_GUIDE.md`
- **组件保护**: `SILLYTAVERN_PROTECTION_README.md`
- **测试工具**: `comprehensive-protection-test.html`
- **调试工具**: `debug-phone-display.html`
