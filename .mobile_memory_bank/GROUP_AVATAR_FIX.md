# 群聊头像混乱问题修复

## 问题描述

在QQ群聊详情页界面中，刷新界面后所有角色的头像会变成同一个角色的头像，导致无法区分不同角色。

## 问题原因

1. **缺少发送者标识**：群聊消息的HTML结构中缺少发送者QQ号标识
2. **头像更新逻辑错误**：`updateMessageAvatarsEnhanced` 函数无法正确识别群聊中不同角色的消息

## 修复内容

### 1. 修改群聊消息HTML结构

**文件**: `src/mobile-ui-test/apps/qq-app.js` (第2547-2558行)

**修改前**:
```html
<div class="custom-message custom-received group-message">
    <div class="message-avatar group-avatar" style="...">...</div>
    ...
</div>
```

**修改后**:
```html
<div class="custom-message custom-received group-message" data-sender-qq="${senderQQ || ''}">
    <div class="message-avatar group-avatar" data-sender-qq="${senderQQ || ''}" style="...">...</div>
    ...
</div>
```

### 2. 修改头像更新逻辑

**文件**: `src/mobile-ui-test/apps/qq-app.js` (第3917-3927行)

**修改前**:
```javascript
} else if ($groupWrapper.length > 0) {
    // 对于群聊，检查消息是否来自目标联系人
    const $messageContainer = $this.closest('.custom-message.custom-received');
    if ($messageContainer.length > 0) {
        isTargetContact = true;
    }
}
```

**修改后**:
```javascript
} else if ($groupWrapper.length > 0) {
    // 对于群聊，检查消息头像的发送者QQ号
    const avatarSenderQQ = $this.data('sender-qq') || $this.attr('data-sender-qq');
    const $messageContainer = $this.closest('.custom-message.custom-received');
    const messageSenderQQ = $messageContainer.data('sender-qq') || $messageContainer.attr('data-sender-qq');
    
    // 检查头像元素或消息容器的发送者QQ号是否匹配
    if ((avatarSenderQQ && avatarSenderQQ == qqNumber) || 
        (messageSenderQQ && messageSenderQQ == qqNumber)) {
        isTargetContact = true;
    }
}
```

## 修复效果

1. **正确识别发送者**：每个群聊消息头像都有明确的发送者QQ号标识
2. **精确头像更新**：头像更新时只影响对应角色的消息，不会影响其他角色
3. **保持头像独立性**：刷新界面后每个角色的头像保持独立，不会混乱

## 测试方法

1. **加载测试脚本**:
   ```javascript
   // 在浏览器控制台中加载测试脚本
   const script = document.createElement('script');
   script.src = './test-group-avatar-fix.js';
   document.head.appendChild(script);
   ```

2. **运行测试**:
   ```javascript
   // 运行所有测试
   testGroupAvatarFix();
   
   // 或单独运行测试
   testGroupMessageAvatars();  // 检查消息标识
   testAvatarUpdateLogic();    // 验证更新逻辑
   testAvatarUpdateSimulation(); // 模拟头像更新
   ```

## 验证步骤

1. 打开QQ群聊详情页
2. 确认群聊中有多个不同角色的消息
3. 刷新界面
4. 检查每个角色的头像是否保持正确显示
5. 修改某个角色的头像，确认只影响该角色的消息

## 注意事项

- 此修复仅影响群聊消息头像，不影响好友聊天和QQ主页头像
- 修复后的代码向后兼容，不会影响现有功能
- 建议在修复后清除浏览器缓存以确保更新生效

## 相关文件

- `src/mobile-ui-test/apps/qq-app.js` - 主要修复文件
- `src/mobile-ui-test/test-group-avatar-fix.js` - 测试脚本
- `src/mobile-ui-test/GROUP_AVATAR_FIX.md` - 本说明文档
