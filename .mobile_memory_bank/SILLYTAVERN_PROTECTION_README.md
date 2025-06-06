# SillyTavern 原生组件保护机制

## 问题描述

手机界面插件在清理临时弹窗时，会误删 SillyTavern 的原生组件，导致：
- `world_popup` (世界书弹窗) 消失
- `completion_prompt_manager_popup_edit` (提示管理器) 无法弹出
- 其他原生弹窗组件受到影响

## 根本原因

问题出现在 `closeAllApps()` 函数中的这行代码：
```javascript
$('[id*="_popup"]').remove();  // 会误删所有包含 "_popup" 的元素
```

这会删除所有ID包含 `_popup` 的元素，包括：
- `world_popup` (SillyTavern 世界书)
- `completion_prompt_manager_popup_edit` (SillyTavern 提示管理器)
- 其他 SillyTavern 原生弹窗

## 修复方案

### 1. 核心修复：安全清理函数

**替换危险的通用删除**：
```javascript
// 原始代码（危险）
$('[id*="_popup"]').remove();

// 修复后代码（安全）
this.removeMobilePluginDialogs();
```

**新增 `removeMobilePluginDialogs()` 函数**：
- 使用白名单方式，只删除手机插件创建的特定弹窗
- 明确保护所有 SillyTavern 原生组件
- 提供详细的清理日志和验证

### 2. 保护的组件列表

**SillyTavern 原生组件（受保护）**：
```javascript
const sillyTavernProtectedComponents = [
  '#world_popup',                    // 世界书弹窗
  '#WorldInfo',                      // 世界信息界面
  '#WIDrawerIcon',                   // 世界书图标
  '[id*="completion_prompt_manager"]', // 提示管理器
  '[id*="character_popup"]',         // 角色弹窗
  '[id*="preset_popup"]',            // 预设弹窗
  '#textgen_settings',               // 文本生成设置
  '#openai_settings',                // OpenAI设置
  '.drawer-content',                 // 抽屉内容
  '.ui-dialog',                      // jQuery UI对话框
  // ... 更多组件
];
```

**手机插件组件（会被清理）**：
```javascript
const mobilePluginDialogs = [
  '#group_create_dialog',            // QQ群创建弹窗
  '#add_member_dialog',              // 添加成员弹窗
  '#avatar_dialog',                  // 头像编辑弹窗
  '#accept_task_dialog',             // 任务接受弹窗
  '#use_item_dialog',                // 使用物品弹窗
  '[id^="mobile_"]',                 // 以mobile_开头的ID
  '[id^="qq_"]',                     // 以qq_开头的ID
  // ... 更多手机插件组件
];
```

### 3. 点击外部关闭保护

在 `sillyTavernUISelectors` 数组中添加了保护：
```javascript
const sillyTavernUISelectors = [
  '#world_popup',
  '.drawer-content', 
  '[id*="completion_prompt_manager"]',
  '[id*="character_popup"]',
  '[id*="preset_popup"]',
  // ... 更多保护组件
];
```

### 4. CSS 样式保护

```css
/* 保护SillyTavern原生组件的z-index */
#world_popup,
.drawer-content,
#WorldInfo,
[id*="completion_prompt_manager"],
[id*="character_popup"],
[id*="preset_popup"] {
  z-index: 3010 !important;
}
```

## 修改的文件

1. **src/mobile-ui-test/apps/phone-interface.js**
   - 替换危险的通用删除为安全的白名单清理
   - 新增 `removeMobilePluginDialogs()` 函数
   - 更新点击外部关闭的保护列表

2. **src/mobile-ui-test/styles/phone-interface.css**
   - 添加 SillyTavern 原生组件的 z-index 保护

## 测试验证

### 1. 使用测试页面
- `comprehensive-protection-test.html` - 全面的组件保护测试
- `world-popup-simple-test.html` - 简单的删除逻辑测试

### 2. 手动测试步骤
1. 打开 SillyTavern 的世界书或提示管理器
2. 打开手机界面
3. 关闭手机界面
4. 验证原生组件是否仍然可用

### 3. 控制台验证
```javascript
// 检查保护状态
console.log('World Popup 存在:', $('#world_popup').length > 0);
console.log('Prompt Manager 存在:', $('[id*="completion_prompt_manager"]').length > 0);
```

## 工作原理

1. **白名单清理**：只删除明确属于手机插件的弹窗
2. **黑名单保护**：明确保护所有 SillyTavern 原生组件
3. **双重验证**：清理后验证保护组件是否仍然存在
4. **详细日志**：提供清理过程的详细日志

## 兼容性

- ✅ 完全兼容现有手机界面功能
- ✅ 保护所有已知的 SillyTavern 原生组件
- ✅ 支持未来新增的原生组件（通过模式匹配）
- ✅ 不影响手机插件的正常清理功能

## 故障排除

如果原生组件仍然被误删：

1. 检查控制台日志中的清理信息
2. 确认组件ID是否在保护列表中
3. 验证 `removeMobilePluginDialogs()` 函数是否被调用
4. 使用测试页面进行调试

## 更新日志

- **v2.0** - 全面保护机制
  - 使用白名单清理替代危险的通用删除
  - 保护所有已知的 SillyTavern 原生组件
  - 添加详细的清理日志和验证
  - 创建全面的测试页面
