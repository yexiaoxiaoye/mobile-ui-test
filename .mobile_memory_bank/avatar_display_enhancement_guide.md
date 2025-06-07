# 头像显示增强功能指南

## 🎯 概述

本指南记录了QQ手机插件中头像显示增强功能的实现，包括头像变换配置、实时更新机制和常见显示问题的解决方案。

## 📋 核心特性

### 1. 头像变换配置
- **缩放调整** - 支持50%-200%的精确缩放
- **位置调整** - 支持拖拽和精确位移控制  
- **旋转功能** - 支持-180°到180°的任意角度旋转
- **实时预览** - 所见即所得的编辑体验

### 2. 智能头像匹配
- **联系人映射** - 通过名称自动查找对应QQ号
- **群聊支持** - 正确显示群组成员头像
- **跨设备同步** - 头像配置保存在聊天记录中

### 3. 显示质量优化
- **无白边显示** - 移除所有边框干扰
- **高清渲染** - 应用图像质量优化CSS
- **硬件加速** - 使用GPU加速提升性能

## 🔧 技术实现

### 1. 头像样式构建

```javascript
// 构建头像样式字符串
buildAvatarStyle(avatarUrl, avatarConfig) {
  let style = `background-image: url(${avatarUrl}); background-color: transparent;`;

  // 应用变换配置
  if (avatarConfig && avatarConfig.transform) {
    const transform = avatarConfig.transform;
    const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
    const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
    const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
    const safeRotation = (transform.rotate || 0) % 360;

    const backgroundSize = `${safeScale * 100}%`;
    const backgroundPositionX = `${50 - safeX * 0.5}%`;
    const backgroundPositionY = `${50 - safeY * 0.5}%`;

    style += ` background-size: ${backgroundSize}; background-position: ${backgroundPositionX} ${backgroundPositionY}; background-repeat: no-repeat;`;

    if (safeRotation !== 0) {
      style += ` transform: rotate(${safeRotation}deg) translateZ(0); transform-origin: center center;`;
    } else {
      style += ` transform: translateZ(0);`;
    }
  } else {
    style += ' background-size: cover; background-position: center; background-repeat: no-repeat; transform: translateZ(0);';
  }

  // 添加图像质量优化
  style += ' image-rendering: -webkit-optimize-contrast; -webkit-backface-visibility: hidden; backface-visibility: hidden; -webkit-transform-style: preserve-3d; transform-style: preserve-3d;';

  return style;
}
```

### 2. 联系人名称映射

```javascript
// 通过联系人名称查找QQ号
findQQNumberByName(contactName) {
  if (!contactName) return null;

  // 使用缓存的映射表
  if (this.contactNameMap && this.contactNameMap[contactName]) {
    return this.contactNameMap[contactName];
  }

  // 创建映射表（如果不存在）
  this.createContactNameMapping();
  
  return this.contactNameMap ? this.contactNameMap[contactName] : null;
}

// 创建联系人名称到QQ号的映射
async createContactNameMapping() {
  this.contactNameMap = {};

  // 方法1: 从已提取的联系人数据中获取
  const contacts = await window.HQDataExtractor.extractQQContacts();
  contacts.forEach(contact => {
    if (contact.name && contact.number) {
      this.contactNameMap[contact.name] = contact.number;
    }
  });

  // 方法2: 从头像增强数据中提取
  const context = this.getSillyTavernContext();
  if (context) {
    const chatData = context.getContext();
    if (chatData && chatData.chat) {
      chatData.chat.forEach(message => {
        const messageText = message.mes || '';
        const avatarMatches = messageText.matchAll(/\[头像增强\|(\d+)\|[^|]*"qqNumber":"(\d+)"[^|]*"contactName":"([^"]+)"/g);
        for (const match of avatarMatches) {
          const [, , qqNumber, contactName] = match;
          if (qqNumber && contactName) {
            this.contactNameMap[contactName] = qqNumber;
          }
        }
      });
    }
  }
}
```

### 3. 消息头像创建

```javascript
// 创建单条消息的HTML（增强版）
createMessageHTML(message, chatId) {
  const isMyMessage = message.type === 'sent' || message.isMyMessage === true;
  
  // 获取头像 - 应用变换配置
  let avatarHtml = '';
  if (!isMyMessage) {
    let qqNumber = message.qqNumber;
    let avatarUrl = null;
    let avatarConfig = null;

    if (qqNumber) {
      // 如果有明确的QQ号，直接使用
      avatarUrl = this.getAvatarUrl(qqNumber);
      avatarConfig = this.avatarData[`${qqNumber}_config`];
    } else if (chatId.startsWith('group_')) {
      // 在群组中，通过发送者名称查找对应的QQ号和头像
      qqNumber = this.findQQNumberByName(message.sender);
      if (qqNumber) {
        avatarUrl = this.getAvatarUrl(qqNumber);
        avatarConfig = this.avatarData[`${qqNumber}_config`];
      }
    }

    if (avatarUrl) {
      const avatarStyle = this.buildAvatarStyle(avatarUrl, avatarConfig);
      avatarHtml = `<div class="message-avatar received-avatar" style="${avatarStyle}"></div>`;
    } else {
      avatarHtml = `<div class="message-avatar-placeholder">${senderName.charAt(0)}</div>`;
    }
  } else {
    // 我的消息显示用户头像
    const userAvatarUrl = this.userData.avatar;
    if (userAvatarUrl) {
      const userConfig = this.getUserAvatarConfig();
      const avatarStyle = this.buildAvatarStyle(userAvatarUrl, userConfig);
      avatarHtml = `<div class="message-avatar sent-avatar" style="${avatarStyle}"></div>`;
    } else {
      avatarHtml = `<div class="message-avatar-placeholder">${this.userData.name.charAt(0)}</div>`;
    }
  }

  // 返回完整的消息HTML
  return messageHtml;
}
```

## 🎨 CSS样式优化

### 1. 消息头像样式

```css
.message-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  overflow: hidden;
  color: black;
  border: none; /* 移除白边 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  
  /* 图像质量优化 */
  image-rendering: -webkit-optimize-contrast;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
}
```

### 2. 用户头像样式

```css
.user-avatar {
  width: 48px !important;
  height: 48px !important;
  background-color: #f0f0f0 !important;
  color: #666 !important;
  border-radius: 50% !important;
  border: none !important; /* 移除白边 */
  /* ... 其他样式 */
}
```

### 3. 联系人头像样式

```css
.custom-avatar {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  border: none !important; /* 移除白边 */
  transition: transform 0.2s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  cursor: pointer !important;
  
  /* 图像质量优化 */
  image-rendering: -webkit-optimize-contrast !important;
  -webkit-backface-visibility: hidden !important;
  backface-visibility: hidden !important;
  -webkit-transform-style: preserve-3d !important;
  transform-style: preserve-3d !important;
}
```

## 🚨 常见问题与解决方案

### 1. 头像白边问题

**问题**: 头像显示时有白色边框

**解决方案**:
```css
/* 移除所有头像的边框 */
.message-avatar,
.user-avatar,
.custom-avatar {
  border: none !important;
}
```

### 2. 群聊头像丢失问题

**问题**: 群聊中角色没有头像显示

**解决方案**:
- 实现联系人名称到QQ号的映射
- 在消息创建时通过名称查找QQ号
- 确保群聊消息正确应用头像配置

### 3. 头像变换不生效问题

**问题**: 保存的头像缩放、旋转等设置没有应用

**解决方案**:
- 确保消息创建时调用`buildAvatarStyle`方法
- 使用内联样式而不是CSS类来应用变换
- 检查头像配置数据是否正确保存和读取

### 4. 实时更新后头像重置问题

**问题**: AI回复后头像设置被重置为默认状态

**解决方案**:
- 在实时更新时使用`loadMessagesWithoutAvatarReload`
- 避免重复加载头像数据
- 确保头像配置持久化保存

## 📈 性能优化

### 1. 图像质量优化
- 使用`-webkit-optimize-contrast`提升渲染质量
- 启用硬件加速（`translateZ(0)`）
- 使用`backface-visibility: hidden`避免背面渲染

### 2. 内存管理
- 联系人映射表使用懒加载
- 头像配置数据缓存
- 及时清理不需要的事件监听器

### 3. 渲染性能
- 使用内联样式避免CSS重计算
- 限制变换参数范围防止异常值
- 应用防抖机制避免频繁更新

## 🔄 与实时更新系统的集成

### 1. 更新策略
- **智能更新**: 只在聊天详情页时更新消息
- **轻量更新**: 避免重新加载头像数据
- **防抖处理**: 群聊环境使用更长的防抖延迟

### 2. 头像保持机制
```javascript
// 实时更新时不重新加载头像数据
loadMessagesWithoutAvatarReload() {
  // 跳过头像数据重新提取
  return this.loadMessagesCore();
}
```

### 3. 配置持久化
- 头像配置保存在聊天记录中
- 支持跨设备和跨浏览器使用
- 自动从聊天记录恢复配置

## 🎯 最佳实践

### 1. 头像编辑
- 提供实时预览功能
- 支持多种调整方式（拖拽、滑块、按钮）
- 应用安全范围限制防止异常值

### 2. 显示质量
- 移除所有不必要的边框
- 应用图像质量优化CSS
- 使用合适的阴影和圆角

### 3. 兼容性
- 保持向后兼容的CSS类名
- 支持多种头像格式
- 优雅降级处理

---

**作者**: AI Assistant  
**创建时间**: 2024年12月  
**适用版本**: QQ手机插件 v2.0+  
**维护状态**: 活跃维护 