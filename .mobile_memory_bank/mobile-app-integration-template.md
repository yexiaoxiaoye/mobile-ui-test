# 手机应用集成模板

## 📋 概述

这个模板提供了将新应用集成到手机界面的标准流程，基于QQ应用集成过程中的经验教训。

## 🔧 集成步骤

### 步骤1：在 phone-interface.js 中添加应用图标事件

在 `bindAppIconEvents()` 方法的 `switch` 语句中添加你的应用：

```javascript
switch (appType) {
  case 'qq':
    openApp('QQApp', window.QQApp);
    break;
  case 'your_app': // 替换为你的应用类型
    openApp('YourApp', window.YourApp); // 替换为你的应用对象
    break;
  // ... 其他应用
}
```

### 步骤2：修改 openApp 函数

在 `openApp` 函数中添加你的应用逻辑：

```javascript
const openApp = (appName, appObject) => {
  if (appObject && typeof appObject.show === 'function') {
    // 🚨 关键：先设置手机界面模式（如果应用需要在手机界面内显示）
    if (appName === 'YourApp') {
      $('#phone_interface').addClass('show show-yourapp-content');
      $('body').addClass('yourapp-mode');
      console.log(`Set YourApp content mode BEFORE calling show().`);
    }

    // 调用应用的show方法
    appObject.show();

    // 处理其他应用的清理
    if (appName !== 'YourApp' && appName !== 'QQApp') {
      setTimeout(() => {
        $('#phone_interface').removeClass('show show-yourapp-content show-qq-app-content');
        $('body').removeClass('yourapp-mode qq-app-mode');
        console.log(`Opened ${appName}, hid phone_interface.`);
      }, 0);
    }
  } else {
    console.error(`${appName} not loaded or has no show method.`);
    alert(`${appName} 应用未正确加载，请检查控制台。`);
  }
};
```

### 步骤3：添加CSS样式

在 `phone-interface.js` 的 `addStyles()` 方法中添加你的应用样式：

```javascript
/* YourApp container - 默认隐藏 */
.yourapp-container {
  display: none !important;
}

/* YourApp container inside phone screen - 只在应用激活时显示 */
#phone_interface.show-yourapp-content .phone-screen .yourapp-container {
  display: block !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  border-radius: 50px !important;
  overflow: hidden !important;
  background: #ffffff !important;
  z-index: 10 !important;
}

/* Hide the original YourApp dialog when in phone mode */
body.yourapp-mode #your_app_dialog {
  display: none !important;
}
```

### 步骤4：在手机界面HTML中添加应用容器

在 `phone-interface.js` 的 `createInterface()` 方法中，在手机屏幕内添加你的应用容器：

```html
<!-- 在 .phone-screen 内添加 -->
<div class="yourapp-container"></div>
```

### 步骤5：修改 closeAllApps 方法

确保你的应用在 `closeAllApps()` 方法中被正确处理：

```javascript
// 关闭YourApp应用界面
if (window.YourApp && typeof window.YourApp.hide === 'function') {
  window.YourApp.hide();
} else {
  $('#your_app_dialog').hide();
  $('#phone_interface .yourapp-container').empty();
}

// 在清理临时弹窗时保护你的原始对话框
$('[id*="_dialog"]:not(#chat_history_dialog):not(#your_app_dialog)').remove();

// 重置手机界面模式
$('#phone_interface').removeClass('show-yourapp-content');
$('body').removeClass('yourapp-mode');
```

### 步骤6：修改 checkOpenApps 方法

在 `checkOpenApps()` 方法中添加你的应用检查：

```javascript
// 检查YourApp应用界面
if ($('#your_app_dialog').is(':visible') || $('.yourapp-page.show').length > 0) {
  return true;
}
```

## 🎯 应用内部实现要求

### 必需的方法

你的应用对象必须实现以下方法：

```javascript
window.YourApp = {
  // 显示应用
  show: function() {
    // 检查是否在手机界面模式下
    const isInPhoneMode = $('#phone_interface').hasClass('show-yourapp-content');
    
    if (isInPhoneMode) {
      // 在手机界面内显示
      this.showInPhoneInterface();
    } else {
      // 独立显示
      $('#your_app_dialog').css('display', 'flex');
    }
  },

  // 隐藏应用
  hide: function() {
    // 清空手机界面容器
    $('#phone_interface .yourapp-container').empty();
    // 隐藏原始对话框
    $('#your_app_dialog').hide();
  },

  // 在手机界面内显示
  showInPhoneInterface: function() {
    const $container = $('#phone_interface .yourapp-container');
    const $originalDialog = $('#your_app_dialog');
    
    if ($container.length === 0 || $originalDialog.length === 0) {
      console.error('容器或原始对话框不存在');
      return;
    }

    // 克隆内容到手机界面容器
    const $originalContent = $originalDialog.children().first();
    const $clonedContent = $originalContent.clone(true);
    $container.empty().append($clonedContent);

    // 设置样式
    $container.find('> div').css({
      width: '100%',
      height: '100%',
      background: '#ffffff',
      'border-radius': '50px',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      'flex-direction': 'column',
    });
  }
};
```

## ⚠️ 重要注意事项

### 1. 时序问题
- **必须**在调用应用的 `show()` 方法之前设置手机界面模式类名
- 应用内部的模式检查会在 `show()` 方法开始时立即执行

### 2. 清理逻辑
- 在 `closeAllApps()` 中保护你的原始对话框不被误删
- 使用精确的选择器，避免通配符误删

### 3. 容器管理
- 确保应用有稳定的原始容器结构
- 使用克隆而不是移动，保护原始结构

### 4. CSS类名规范
- 手机界面模式类名：`show-{appname}-content`
- 应用模式类名：`{appname}-mode`
- 应用容器类名：`{appname}-container`

## 🧪 测试清单

在集成新应用后，请测试以下场景：

- [ ] 第一次点击应用图标能正常显示
- [ ] 从应用返回手机主页正常
- [ ] 第二次进入应用能正常显示
- [ ] 多次进入和退出都正常
- [ ] 应用内的所有交互功能正常
- [ ] 点击外部区域能正确关闭应用
- [ ] 与其他应用的切换正常

## 📚 参考示例

完整的实现示例请参考：
- `src/mobile-ui-test/apps/qq-app.js` - QQ应用实现
- `src/mobile-ui-test/.mobile_memory_bank/qq-app-integration-fix-guide.md` - 详细修复过程

---

**使用此模板可以避免QQ应用集成过程中遇到的所有问题！**
