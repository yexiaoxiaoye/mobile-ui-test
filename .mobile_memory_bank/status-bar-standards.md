# 移动界面状态栏统一标准

## 概述
为了确保所有移动应用界面的状态栏（时间、电量、信号图标）保持一致的外观和位置，制定以下统一标准。

## 统一标准规格

### 1. 状态栏容器
```css
.status-bar {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  height: 37px; /* 统一状态栏高度 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px; /* 统一左右内边距 */
  z-index: 50; /* 确保在最上层 */
  pointer-events: none; /* 不阻挡下层元素点击 */
}
```

### 2. 时间显示
```css
.status-time {
  font-size: 18px; /* 统一时间字体大小 */
  font-weight: 700; /* 统一时间字体粗细 */
  /* 颜色根据背景调整：白色背景用黑色文字，深色背景用白色文字 */
}
```

### 3. 图标容器
```css
.status-icons {
  display: flex;
  align-items: center;
  gap: 4px; /* 统一图标间距 */
  font-size: 12px;
  font-weight: 600;
}
```

### 4. SVG图标标准
```css
.signal-icon,
.battery-icon {
  display: inline-block;
  width: 20px; /* 统一图标宽度 */
  height: 14px; /* 统一图标高度 */
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  font-size: 0; /* 隐藏emoji文字 */
}
```

## 应用场景

### 1. 主手机界面 (phone-interface.css)
- 背景：深色渐变
- 文字颜色：白色
- 图标颜色：白色（使用filter: brightness(0) invert(1)）

### 2. QQ主页 (qq-app.css)
- 背景：白色
- 文字颜色：黑色
- 图标颜色：黑色

### 3. QQ聊天详情页 (qq-app.css)
- 背景：白色
- 文字颜色：黑色
- 图标颜色：黑色

## 实现要点

1. **高度统一**：所有状态栏高度固定为37px
2. **内边距统一**：左右内边距固定为20px
3. **字体统一**：时间字体大小18px，粗细700
4. **图标统一**：SVG图标尺寸20x14px，间距4px
5. **层级统一**：z-index设置为50或更高
6. **交互统一**：pointer-events: none防止阻挡点击

## 颜色适配

### 深色背景（主手机界面）
```css
.status-time { color: white; }
.status-icons { color: white; }
.signal-icon, .battery-icon {
  filter: brightness(0) invert(1); /* 白色图标 */
}
```

### 浅色背景（应用界面）
```css
.status-time { color: black; }
.status-icons { color: black; }
.signal-icon, .battery-icon {
  /* 黑色图标，无需filter */
}
```

## 使用的SVG图标

### 信号图标
- 尺寸：20x14px
- 样式：4格信号强度指示器
- 颜色：根据背景自适应

### 电池图标
- 尺寸：20x14px（实际显示区域）
- 样式：电池轮廓+电量百分比
- 颜色：根据背景自适应

## 注意事项

1. 新增应用界面时，必须遵循此标准
2. 状态栏必须在界面最顶层，避免被其他元素遮挡
3. 确保在不同屏幕尺寸下的一致性
4. 定期检查各界面状态栏的一致性

## 更新记录

- 2024-12-19: 建立统一标准，修复phone-interface、QQ主页、QQ聊天详情页的状态栏不一致问题
- 2024-12-19: 完成状态栏统一标准实施，放大聊天头像至46x46px，替换QQ标志为用户信息区域，添加用户头像修改功能，在聊天界面显示用户头像
- 2024-12-19: 修复用户头像弹窗被手机界面点击外部逻辑关闭的问题，修复QQ聊天详情页状态栏位置不统一问题，调整聊天头部高度与QQ主页一致
- 2024-12-19: 完全修复所有问题：1) 修复JavaScript错误(hideMainPageDecorations方法不存在)；2) 确保聊天详情页状态栏位置与QQ主页完全一致(top: 10px)；3) 修复用户头像数据持久保存问题，确保从聊天记录正确加载用户信息；4) 优化聊天界面用户头像显示逻辑，支持背景图片和文字显示
