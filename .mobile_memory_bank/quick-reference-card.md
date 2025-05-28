# 手机应用集成快速参考卡

## 🚨 关键问题避免清单

### ❌ 绝对不要做的事情
1. **不要在调用 `app.show()` 之后才设置手机界面模式类名**
2. **不要使用 `$('[id*="_dialog"]').remove()` 清理所有对话框**
3. **不要移动DOM元素，使用克隆**
4. **不要忘记在 `closeAllApps()` 中保护你的原始对话框**

### ✅ 必须做的事情
1. **先设置类名，再调用 `app.show()`**
2. **使用精确选择器保护核心元素**
3. **使用 `clone(true)` 保持原始结构**
4. **添加详细的调试日志**

## 🔧 核心代码片段

### 正确的应用启动顺序
```javascript
// ✅ 正确
if (appName === 'YourApp') {
  $('#phone_interface').addClass('show show-yourapp-content');
  $('body').addClass('yourapp-mode');
}
appObject.show(); // 在设置类名之后调用

// ❌ 错误
appObject.show(); // 先调用
$('#phone_interface').addClass('show show-yourapp-content'); // 后设置
```

### 正确的清理逻辑
```javascript
// ✅ 正确 - 保护重要对话框
$('[id*="_dialog"]:not(#chat_history_dialog):not(#your_app_dialog)').remove();

// ❌ 错误 - 会删除所有对话框
$('[id*="_dialog"]').remove();
```

### 正确的容器管理
```javascript
// ✅ 正确 - 使用克隆
const $clonedContent = $originalContent.clone(true);
$container.empty().append($clonedContent);

// ❌ 错误 - 移动元素会破坏原始结构
$originalContent.detach().appendTo($container);
```

## 🎯 集成新应用的5步法

1. **添加图标事件** → `phone-interface.js` switch语句
2. **修改openApp函数** → 先设置类名，再调用show
3. **添加CSS样式** → 容器样式和显示逻辑
4. **添加HTML容器** → 在手机屏幕内添加应用容器
5. **修改清理逻辑** → 保护原始对话框，添加应用检查

## 🐛 常见问题快速诊断

| 问题现象 | 可能原因 | 解决方法 |
|---------|---------|---------|
| 第一次进入白屏 | 时序问题 | 检查类名设置是否在show()之前 |
| 第二次进入白屏 | 原始对话框被删除 | 检查closeAllApps()的清理逻辑 |
| 应用显示在外部 | 手机模式检查失败 | 确认类名正确设置 |
| 交互功能失效 | 事件未正确克隆 | 使用clone(true)包含事件 |

## 📝 调试技巧

### 添加关键检查点
```javascript
console.log('📱 手机界面模式:', $('#phone_interface').hasClass('show-yourapp-content'));
console.log('🏠 原始对话框存在:', $('#your_app_dialog').length > 0);
console.log('📦 容器存在:', $('#phone_interface .yourapp-container').length > 0);
```

### 测试序列
1. 刷新页面 → 第一次进入
2. 返回主页 → 退出应用
3. 再次进入 → 重复进入测试
4. 多次重复 → 稳定性测试

---

**记住：时序是关键，保护是必须！**
