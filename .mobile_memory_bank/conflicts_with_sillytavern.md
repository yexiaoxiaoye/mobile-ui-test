# 手机插件与SillyTavern原有功能冲突问题记录

## 概述
本文档记录手机插件开发过程中遇到的与SillyTavern原有功能的冲突问题，以及相应的解决方案。目的是避免在未来开发中重复犯同样的错误。

## 冲突问题分类

### 1. CSS层级冲突 (Z-Index Conflicts)

#### 问题描述
- **问题**: 手机插件的界面元素z-index设置过高，覆盖了SillyTavern的原有界面
- **表现**: 世界书、预设条目等界面的下半部分被遮挡或消失
- **原因**: QQ应用界面使用了z-index: 10001等过高的层级值

#### 解决方案
- **原则**: 手机插件的z-index应该低于SillyTavern的核心界面元素
- **具体值**: 将手机插件的z-index设置为999，避免使用10000以上的值
- **涉及文件**: `styles/qq-app.css`
- **修复代码**:
```css
#chat_history_dialog {
  z-index: 999 !important; /* 降低z-index */
}
.chat-page {
  z-index: 999 !important; /* 降低z-index */
}
```

### 2. 点击事件冲突 (Click Event Conflicts)

#### 问题描述
- **问题**: 手机插件的"点击外部关闭"逻辑过于激进，误将SillyTavern界面判断为外部点击
- **表现**: 点击世界书、预设条目时，手机应用被强制关闭
- **原因**: 点击检测逻辑没有排除SillyTavern的原有界面元素

#### 解决方案
- **原则**: 在点击外部检测中明确排除SillyTavern的所有原有界面元素
- **方法**: 创建SillyTavern界面元素的排除列表
- **涉及文件**: `apps/phone-interface.js`
- **关键代码**:
```javascript
const sillyTavernUISelectors = [
  '#WorldInfo', '#WIDrawerIcon', '#wi_menu',
  '#character_popup', '#preset_settings', '#preset_popup',
  '#PromptManagerModule', '#promptManagerDrawer',
  '.drawer', '.popup', '.modal', '.menu',
  '[class*="popup"]', '[class*="modal"]', '[class*="dialog"]',
  '.interactable', '.clickable'
];

// 检查是否点击了SillyTavern原有界面
for (const selector of sillyTavernUISelectors) {
  if ($target.closest(selector).length) {
    return; // 直接返回，不执行关闭逻辑
  }
}
```

### 3. DOM元素命名冲突 (DOM Element Naming Conflicts)

#### 问题描述
- **问题**: 手机插件使用的元素ID可能与SillyTavern原有元素冲突
- **风险**: 可能导致JavaScript错误或样式冲突

#### 预防措施
- **原则**: 所有手机插件的元素ID都应该有明确的前缀
- **命名规范**:
  - 手机界面: `phone_*`, `mobile_*`
  - QQ应用: `qq_*`, `chat_history_*`
  - 其他应用: `taobao_*`, `task_*`, `backpack_*`, `chouka_*`
- **避免使用**: 通用名称如`dialog`, `popup`, `menu`等

### 4. 样式覆盖冲突 (CSS Override Conflicts)

#### 问题描述
- **问题**: 手机插件的全局样式可能影响SillyTavern原有元素的显示
- **风险**: 破坏SillyTavern的原有界面美观性和功能性

#### 解决方案
- **原则**: 尽量使用具体的选择器，避免过于宽泛的全局样式
- **方法**:
  - 使用嵌套选择器限制样式作用范围
  - 为重要样式添加`!important`标识
  - 定期检查是否影响了SillyTavern原有样式

### 5. 聊天界面状态管理冲突 (Chat Interface State Management Conflicts)

#### 问题描述
- **问题**: 聊天界面显示错误的联系人/群组信息，多个聊天页面同时显示
- **表现**: 点击新的联系人或群组时，会显示之前打开的聊天内容
- **原因**: 缺少对其他聊天页面的隐藏逻辑，导致多个`.chat-page`同时具有`show`类

#### 解决方案
- **原则**: 在显示新聊天页面前，必须先隐藏所有其他聊天页面
- **方法**: 在联系人/群组点击事件中添加全局隐藏逻辑
- **涉及文件**: `apps/qq-app.js`
- **关键代码**:
```javascript
// 在显示新聊天页面前，先隐藏所有其他聊天页面
$('.chat-page').removeClass('show');

// 然后显示当前聊天页面
$chatPage.addClass('show');
```

### 6. 群聊界面元素布局冲突 (Group Chat UI Layout Conflicts)

#### 问题描述
- **问题**: 群聊界面的"添加群员"按钮与小房子按钮重叠
- **表现**: 两个按钮位置冲突，用户无法正确点击
- **原因**: CSS定位没有考虑到多个绝对定位元素的空间占用

#### 解决方案
- **原则**: 合理规划界面元素的位置，避免重叠
- **方法**: 调整添加群员按钮的位置和样式
- **涉及文件**: `styles/qq-app.css`, `apps/qq-app.js`
- **具体修复**:
  - 将添加群员按钮位置调整为`right: 55px`
  - 移除蓝色背景，改为透明背景
  - 将按钮文字从"添加群员"改为"+"符号
  - 调整按钮尺寸为32x32px的圆形按钮

### 7. 群聊头像显示问题 (Group Chat Avatar Display Issues)

#### 问题描述
- **问题**: 群聊中无法正确显示用户和其他成员的头像
- **表现**: 群聊消息中头像显示不正确或缺失
- **原因**: 群聊消息处理逻辑没有正确区分用户消息和其他成员消息的头像显示

#### 解决方案
- **原则**: 正确区分群聊中的用户消息和其他成员消息
- **方法**: 改进群聊消息处理逻辑，为不同类型的消息显示正确的头像
- **涉及文件**: `apps/qq-app.js`
- **关键改进**:
  - 判断消息是否为用户发送：`msg.isUser || (senderName === this.userData.name)`
  - 用户消息显示在右侧，使用用户头像
  - 其他成员消息显示在左侧，根据发送者QQ号获取对应头像
  - **新增策略**: 如果消息对象 `msg` 中未直接提供 `senderQQ`，则尝试使用 `msg.sender` (发送者名称) 从 `HQDataExtractor.extractQQContacts()` 返回的联系人列表中查找对应的QQ号，然后使用此QQ号从 `avatarData` 中获取头像。这需要在 `qq-app.js` 的 `loadMessages` 函数渲染群消息时实现此查找和匹配逻辑。

## 测试检查清单

### 开发阶段必须检查的项目
1. **Z-Index检查**: 确认所有手机插件界面的z-index < 600 (新标准)
2. **点击事件检查**: 测试点击SillyTavern各个界面是否会误关闭手机应用
3. **样式冲突检查**: 确认手机插件样式不会影响SillyTavern原有界面
4. **元素命名检查**: 确认所有新增元素ID都有合适的前缀
5. **重复打开测试**: 必须测试多次打开/关闭手机插件的场景
6. **状态清理检查**: 确认每次关闭后状态完全清理

### 常见SillyTavern界面元素清单
需要特别注意兼容性的SillyTavern界面：
- 世界书: `#WorldInfo`, `#WIDrawerIcon`
- 角色管理: `#character_popup`, `#character_advanced`
- 预设管理: `#preset_settings`, `#preset_popup`
- 提示管理: `#PromptManagerModule`, `#promptManagerDrawer`
- 设置界面: `#textgen_settings`, `#openai_settings`等
- 右键菜单: `#context_menu`, `.context-menu`

## 调试方法

### 1. 检查z-index冲突
```javascript
// 在浏览器控制台运行
function checkZIndex() {
  const elements = document.querySelectorAll('[style*="z-index"], [class*="dialog"], [class*="popup"]');
  elements.forEach(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    if (zIndex !== 'auto' && parseInt(zIndex) > 1000) {
      console.log('High z-index found:', el, 'z-index:', zIndex);
    }
  });
}
checkZIndex();
```

### 2. 检查点击事件冲突
```javascript
// 临时添加点击监听来调试
document.addEventListener('click', function(e) {
  console.log('Clicked element:', e.target);
  console.log('Closest SillyTavern elements:',
    e.target.closest('.interactable'),
    e.target.closest('[class*="dialog"]')
  );
});
```

### 3. 重复打开测试场景
```javascript
// 测试重复打开手机插件的脚本
function testRepeatedOpen() {
  console.log('开始重复打开测试...');

  // 第一次打开
  $('#chat_history_btn').click();
  setTimeout(() => {
    console.log('第一次打开完成，检查状态...');
    console.log('Phone interface visible:', $('#phone_interface').hasClass('show'));
    console.log('Body classes:', document.body.className);

    // 关闭
    $('#chat_history_btn').click();
    setTimeout(() => {
      console.log('关闭完成，检查清理状态...');
      console.log('Phone interface visible:', $('#phone_interface').hasClass('show'));
      console.log('Body classes:', document.body.className);

      // 第二次打开
      $('#chat_history_btn').click();
      setTimeout(() => {
        console.log('第二次打开完成，检查是否有冲突...');
        console.log('Phone interface visible:', $('#phone_interface').hasClass('show'));
        console.log('Body classes:', document.body.className);

        // 测试SillyTavern界面是否可访问
        console.log('测试世界书是否可点击...');
        if ($('#WIDrawerIcon').length) {
          $('#WIDrawerIcon').click();
          setTimeout(() => {
            console.log('世界书界面是否正常显示:', $('#WorldInfo').is(':visible'));
          }, 500);
        }
      }, 500);
    }, 500);
  }, 500);
}

// 运行测试
testRepeatedOpen();
```

## 版本记录

### v1.0 (2024-12-19)
- 初始文档创建
- 记录z-index冲突和点击事件冲突的解决方案
- 建立基本的预防措施和测试清单

### v1.1 (2024-12-19)
- **重大修复**: 解决手机插件重复打开时覆盖SillyTavern界面的问题
- **z-index优化**: 将手机界面z-index从1000降低到500，QQ应用从999降低到510
- **状态管理改进**: 新增`forceCleanState()`方法，确保每次显示/隐藏时完全清理状态
- **问题根因**: 发现问题出现在第二次打开手机插件时，之前的状态残留导致界面覆盖
- **修复文件**:
  - `styles/phone-interface.css`: 降低主界面z-index
  - `styles/qq-app.css`: 降低QQ应用相关z-index
  - `apps/phone-interface.js`: 新增强制状态清理方法

### v1.2 (2024-12-19)
- **全面z-index修复**: 基于控制台调试信息，发现并修复了所有高z-index问题
- **关键修复**:
  - `main.css`: 应用界面从10001降到510，对话框从1000降到530
  - `phone-interface.css`: 手机按钮从1000降到450
  - `qq-app.css`: 聊天页面从999降到515
- **调试工具增强**: 新增`verifyFix()`方法验证修复效果
- **状态清理完善**: 扩展`forceCleanState()`清理更多元素的z-index
- **新z-index标准**: 所有手机插件元素z-index < 600

## 注意事项

1. **向后兼容性**: 任何修复都应该保证不影响现有功能
2. **性能考虑**: 点击事件检测逻辑不应该过于复杂，影响性能
3. **维护性**: 选择器列表需要随着SillyTavern更新而更新
4. **测试覆盖**: 每次修改后都应该进行完整的兼容性测试

## 未来改进方向

1. **自动检测**: 开发自动检测冲突的工具
2. **隔离机制**: 考虑使用iframe或shadow DOM来隔离手机插件
3. **配置化**: 让用户可以配置手机插件的行为以避免冲突