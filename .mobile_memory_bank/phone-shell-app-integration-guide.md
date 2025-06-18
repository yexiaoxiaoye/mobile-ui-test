# Phone-Shell 应用集成完整指南

本指南记录了将应用正确集成到phone-shell系统的完整经验，基于淘宝应用的成功集成案例。

## 🎯 集成目标

- ✅ 应用在主手机界面内显示（而非独立外壳）
- ✅ 自动继承phone-shell的主题颜色和边框样式
- ✅ 正确处理状态栏高度，避免重叠
- ✅ 保持原有功能：外部点击关闭、返回主页等

## 📋 集成架构对比

### ❌ 错误方式：独立Phone-Shell
```javascript
// 错误：创建独立的phone-shell实例
const shellHTML = window.PhoneShell.createShellHTML(appContent, 'app_phone_shell');
$('body').append(shellHTML);
window.PhoneShell.show('app_phone_shell');
```

### ✅ 正确方式：主界面内集成
```javascript
// 正确：在主手机界面内创建应用容器
const $phoneInterface = $('#phone_interface');
let $appContainer = $phoneInterface.find('.app-container');
if ($appContainer.length === 0) {
  $appContainer = $(`
    <div class="app-container" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 30;">
    </div>
  `);
  $phoneInterface.append($appContainer);
}
```

## 🔧 核心集成步骤

### 1. JavaScript应用结构修改

#### A. createInterface方法
```javascript
createInterface: function () {
  console.log('🛒 创建应用界面（在主手机界面内）');

  // 检查主手机界面
  const $phoneInterface = $('#phone_interface');
  if ($phoneInterface.length === 0) {
    console.error('❌ 主手机界面不存在，无法创建应用');
    return;
  }

  // 查找或创建应用容器
  let $appContainer = $phoneInterface.find('.your-app-container');
  if ($appContainer.length === 0) {
    $appContainer = $(`
      <div class="your-app-container" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 30;">
        <!-- 应用内容将在这里动态创建 -->
      </div>
    `);
    $phoneInterface.append($appContainer);
  }

  this.bindEvents();
},
```

#### B. showInPhoneInterface方法
```javascript
showInPhoneInterface: function () {
  console.log('📱 在手机界面内显示应用');

  const $phoneInterface = $('#phone_interface');
  const $appContainer = $phoneInterface.find('.your-app-container');

  // 创建应用内容并添加到容器中
  const appContent = this.createAppHTML();
  $appContainer.html(appContent);

  // 显示应用容器，隐藏主屏幕内容
  $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').hide();
  $phoneInterface.find('.qq-app-container').hide(); // 隐藏其他应用
  $appContainer.show();

  // 渲染应用界面
  this.renderAppContent();
},
```

#### C. show和hide方法
```javascript
show: async function () {
  const $phoneInterface = $('#phone_interface');
  if ($phoneInterface.length === 0) {
    console.error('❌ 主手机界面不存在');
    return;
  }

  // 确保界面已创建
  if ($phoneInterface.find('.your-app-container').length === 0) {
    this.createInterface();
  }

  // 在手机界面内显示应用
  this.showInPhoneInterface();
},

hide: function () {
  const $phoneInterface = $('#phone_interface');
  const $appContainer = $phoneInterface.find('.your-app-container');
  
  if ($appContainer.length > 0) {
    $appContainer.hide();
  }

  // 显示主屏幕内容
  $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();
},
```

### 2. phone-interface.js修改

#### A. 应用调用逻辑
```javascript
const openApp = (appName, appObject) => {
  if (appObject && typeof appObject.show === 'function') {
    if (appName === 'QQApp') {
      $('#phone_interface').addClass('show show-qq-app-content');
      $('body').addClass('qq-app-mode');
    } else if (appName === 'YourApp') {
      // 新增你的应用模式
      $('#phone_interface').addClass('show show-your-app-content');
      $('body').addClass('your-app-mode');
    } else if (appName === 'WallpaperApp') {
      $('#phone_interface').addClass('show');
      appObject.openPhoneEditor();
      return;
    }

    appObject.show();

    if (appName !== 'QQApp' && appName !== 'YourApp' && appName !== 'WallpaperApp') {
      setTimeout(() => {
        $('#phone_interface').removeClass('show show-qq-app-content show-your-app-content');
        $('body').removeClass('qq-app-mode your-app-mode');
      }, 0);
    }
  }
};
```

#### B. show方法更新
```javascript
show: function () {
  // ...existing code...
  
  $phoneInterface.addClass('show').removeClass('show-qq-app-content show-your-app-content');
  $('body').removeClass('qq-app-mode your-app-mode');

  // 隐藏所有应用容器
  $('#phone_interface .qq-app-container').hide();
  $('#phone_interface .your-app-container').hide();
  
  // ...rest of code...
},
```

### 3. CSS样式配置

#### A. 应用容器基础样式
```css
/* 应用容器基础样式 - 集成到主手机界面内 */
.your-app-container {
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 50px;
  overflow: hidden;
  opacity: 1;
  position: relative;
  z-index: 30;
}

.your-app-container > div,
.your-app-container .your-app {
  width: 100%;
  height: 100%;
  border-radius: 50px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  opacity: 1;
}
```

#### B. 应用模式显示控制
```css
/* 确保应用在主手机界面内正确显示 */
#phone_interface.show-your-app-content .your-app-container {
  display: block !important;
  visibility: visible !important;
}

#phone_interface.show-your-app-content .phone-background,
#phone_interface.show-your-app-content .phone-home-screen,
#phone_interface.show-your-app-content .phone-dock {
  display: none !important;
}

/* 应用模式下的body样式 */
body.your-app-mode {
  /* 可以添加全局样式调整 */
}
```

#### C. 状态栏兼容
```css
/* 应用主容器 - 为phone-shell状态栏预留空间 */
.your-app {
  /* 状态栏总高度 = 37px(状态栏) + 10px(顶部边距) = 47px */
  padding-top: 47px;
}
```

### 4. 事件绑定更新

#### A. 外部点击关闭
```javascript
// 点击手机外部关闭应用（使用主手机界面）
$(document).on('click', function (e) {
  const $phoneInterface = $('#phone_interface');
  if ($phoneInterface.length && $phoneInterface.hasClass('show-your-app-content')) {
    if (!$(e.target).closest('.phone-screen').length) {
      self.hide();
      // 返回手机主页
      if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
        window.PhoneInterface.show();
      }
    }
  }
});
```

## 🎨 主题继承原理

### 自动继承机制
当应用在主手机界面内时，会自动继承：
- `var(--phone-border-color)` - 边框颜色
- `var(--status-bar-time-color)` - 状态栏文字颜色
- `var(--phone-shell-primary)` - 主色调
- `var(--phone-shell-secondary)` - 次色调

### CSS变量使用示例
```css
.your-app-element {
  border: 1px solid var(--phone-border-color, rgba(0, 0, 0, 0.05));
  color: var(--status-bar-time-color, #000000);
  background: var(--phone-shell-primary, #ffffff);
}

/* 主题适配 */
.phone-theme-dark .your-app-element {
  background: var(--phone-shell-secondary, #2d2d2d);
  color: var(--status-bar-time-color, #ffffff);
}
```

## ⚠️ 常见问题与解决方案

### 1. 背景色被主题覆盖
**问题**：应用背景色变成主题色
**解决**：确保应用主容器有明确的背景色设置
```css
.your-app {
  background: #your-desired-color !important;
}
```

### 2. 点击应用内部也会关闭
**问题**：点击事件委托过于宽泛
**解决**：精确设置点击区域判断
```javascript
if (!$(e.target).closest('.phone-screen').length) {
  // 只有点击手机屏幕外部才关闭
}
```

### 3. 状态栏重叠
**问题**：应用内容被状态栏遮挡
**解决**：为状态栏预留空间
```css
.your-app {
  padding-top: 47px; /* 状态栏高度 */
}
```

## 📝 检查清单

### 集成完成后检查项目：
- [ ] 应用在主手机界面内显示（不是独立外壳）
- [ ] 更改主题颜色时应用界面同步变化
- [ ] 状态栏图标颜色正确变化
- [ ] 应用内容不被状态栏遮挡
- [ ] 点击手机外部可以关闭应用
- [ ] 关闭应用后正确返回主页
- [ ] 应用背景色不受主题影响（如需要）
- [ ] 点击应用内部不会意外关闭

## 🚀 后续应用集成

使用本指南可以快速集成新应用：
1. 复制JavaScript结构模板
2. 修改phone-interface.js添加应用模式
3. 添加CSS样式配置
4. 更新事件绑定
5. 按检查清单验证功能

## 📋 滚动容器配置经验

### 商品列表滚动问题解决方案
在集成应用时，经常遇到列表无法滚动的问题，以下是经过验证的解决方案：

#### CSS配置
```css
/* 应用主页面容器 */
.your-app-products-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
}

/* 商品列表滚动容器 */
.your-app-product-grid {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  background: #f9fafb;
  padding: 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(249, 115, 22, 0.3) transparent;
  height: 0; /* 关键：使flex子元素可滚动的技巧 */
  min-height: 0;
  -webkit-overflow-scrolling: touch; /* 移动端平滑滚动 */
}

/* 自定义滚动条样式 */
.your-app-product-grid::-webkit-scrollbar {
  width: 4px;
}

.your-app-product-grid::-webkit-scrollbar-track {
  background: transparent;
}

.your-app-product-grid::-webkit-scrollbar-thumb {
  background: rgba(249, 115, 22, 0.3);
  border-radius: 2px;
}
```

#### 关键技巧说明
- **flex: 1 + height: 0**：这是让flex子元素可滚动的经典CSS技巧
- **overflow-y: scroll**：强制显示滚动条，确保滚动功能
- **overflow-x: hidden**：防止水平滚动干扰
- **min-height: 0**：允许flex项目收缩到内容大小以下

## 📋 商品布局设计经验

### 参考文件布局复制
当需要复制参考文件的布局时，应该：

#### 1. 分析参考文件结构
```tsx
// 参考文件：taobao-homepage.tsx
<div className="space-y-3">
  {products.map((product) => (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex space-x-4">
        {/* 左侧描述区域 */}
        <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100">
          <p className="text-xs text-gray-600 text-center">
            {product.description}
          </p>
        </div>
        
        {/* 右侧商品信息 */}
        <div className="flex-1 min-w-0">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <div>{product.categoryName}</div>
          <div className="flex items-center space-x-2">
            <span>¥{product.price}</span>
            {product.originalPrice && (
              <span className="line-through">¥{product.originalPrice}</span>
            )}
          </div>
          <Button>加入购物车</Button>
        </div>
      </div>
    </div>
  ))}
</div>
```

#### 2. 转换为自定义CSS结构
```css
/* 垂直单列布局 */
.taobao-product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 水平商品卡片 */
.taobao-product-card {
  background: var(--taobao-card);
  border-radius: var(--taobao-radius);
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

/* 左侧描述区域 */
.product-description-area {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  flex-shrink: 0;
}

/* 右侧信息区域 */
.product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

#### 3. JavaScript HTML生成
```javascript
renderProductGrid: function(products) {
  const productsHtml = products.map((product, index) => {
    const hasOriginalPrice = product.originalPrice && 
      parseFloat(product.originalPrice) > parseFloat(product.price);
    
    return `
      <div class="taobao-product-card">
        <!-- 左侧描述区域 -->
        <div class="product-description-area">
          <div class="product-description-text">${product.describe}</div>
        </div>
        
        <!-- 右侧信息区域 -->
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-full-description">${product.describe}</p>
          <div class="product-type">${product.type}</div>
          <div class="product-price-section">
            <span class="product-price">${product.price}</span>
            ${hasOriginalPrice ? `<span class="product-original-price">${product.originalPrice}</span>` : ''}
          </div>
          <button class="add-to-cart-btn" onclick="TaobaoApp.addToCart(${index})">
            加入购物车
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  $('#product_grid').html(`<div class="taobao-product-list">${productsHtml}</div>`);
}
```

## 📋 统一按钮系统集成

### 小房子按钮统一样式
参考`unified-buttons.js`系统，为应用添加统一的小房子按钮：

#### CSS类名约定
```css
/* 应用头部小房子按钮 */
.your-app-home-btn {
  background: none;
  color: #007aff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}
```

#### JavaScript按钮生成
```javascript
// 在HTML生成中使用统一的小房子按钮
createAppHTML: function() {
  return `
    <div class="your-app-header">
      <button class="header-btn your-app-home-btn" onclick="YourApp.goHome()">
        ${window.UNIFIED_BUTTON_ICONS ? window.UNIFIED_BUTTON_ICONS.HOME : '🏠'}
      </button>
    </div>
  `;
}
```

#### 自动应用统一样式
```javascript
// 在应用初始化后调用统一按钮刷新
init: function() {
  // ...应用初始化代码...
  
  // 刷新统一按钮样式
  if (window.UnifiedButtons) {
    setTimeout(() => {
      window.UnifiedButtons.refresh();
    }, 200);
  }
}
```

---

*本指南基于淘宝应用集成的成功经验编写，适用于所有需要集成到phone-shell系统的移动应用。* 

## 📋 关闭手机和返回主页逻辑详解

### 🎯 核心原理
手机应用的关闭和返回主页涉及多个组件的状态同步：
- **应用容器状态**：显示/隐藏应用内容
- **手机界面模式**：CSS类的添加/移除  
- **主屏幕元素**：背景、图标、dock的显示控制
- **动画处理**：避免不必要的缩放或过渡效果

### 🔧 完整集成方案

#### 1. phone-interface.js 中的应用模式配置

**❌ 错误方式：**
```javascript
// 错误：只处理了QQ应用
case 'taobao':
  openApp('TaobaoApp', window.TaobaoApp);
  break;
// 这会导致淘宝被当作"其他应用"处理，隐藏整个手机界面
```

**✅ 正确方式：**
```javascript
const openApp = (appName, appObject) => {
  if (appObject && typeof appObject.show === 'function') {
    if (appName === 'QQApp') {
      // QQ应用模式
      $('#phone_interface').addClass('show show-qq-app-content');
      $('body').addClass('qq-app-mode');
    } else if (appName === 'TaobaoApp') {
      // 淘宝应用模式 - 关键：像QQ一样在手机界面内显示
      $('#phone_interface').addClass('show show-taobao-app-content');
      $('body').addClass('taobao-app-mode');
    } else if (appName === 'YourApp') {
      // 你的应用模式
      $('#phone_interface').addClass('show show-your-app-content');
      $('body').addClass('your-app-mode');
    } else if (appName === 'WallpaperApp') {
      // 美化应用特殊处理
      $('#phone_interface').addClass('show');
      appObject.openPhoneEditor();
      return;
    }

    // 调用应用的show方法
    appObject.show();

    if (appName !== 'QQApp' && appName !== 'TaobaoApp' && appName !== 'YourApp' && appName !== 'WallpaperApp') {
      // 只有未特殊处理的应用才隐藏手机界面
      setTimeout(() => {
        $('#phone_interface').removeClass('show show-qq-app-content show-taobao-app-content show-your-app-content');
        $('body').removeClass('qq-app-mode taobao-app-mode your-app-mode');
      }, 0);
    }
  }
};
```

#### 2. show方法中的状态重置

**在 `PhoneInterface.show()` 方法中：**
```javascript
show: function () {
  // ...existing code...
  
  // 移除所有应用模式的CSS类
  $phoneInterface.addClass('show').removeClass('show-qq-app-content show-taobao-app-content show-your-app-content');
  $('body').removeClass('qq-app-mode taobao-app-mode your-app-mode');

  // 强制隐藏所有应用容器
  $('#phone_interface .qq-app-container').hide();
  $('#phone_interface .taobao-app-container').hide();
  $('#phone_interface .your-app-container').hide();
  $('#phone_interface .wallpaper-app-container').hide();

  // 强制显示手机主屏幕的核心元素
  $('#phone_interface .phone-background').show();
  $('#phone_interface .phone-home-screen').show();
  $('#phone_interface .phone-dock').show();
  
  // ...rest of code...
},
```

#### 3. closeAllApps方法的完整实现

```javascript
closeAllApps: function () {
  console.log('正在关闭所有应用界面...');

  // 关闭QQ应用
  if (window.QQApp && typeof window.QQApp.hide === 'function') {
    window.QQApp.hide();
  } else {
    $('#chat_history_dialog').hide();
    $('.chat-page').removeClass('show');
    $('#phone_interface .qq-app-container').empty();
  }

  // 关闭淘宝应用
  if (window.TaobaoApp && typeof window.TaobaoApp.hide === 'function') {
    window.TaobaoApp.hide();
  } else {
    $('#phone_interface .taobao-app-container').hide();
  }

  // 关闭你的应用
  if (window.YourApp && typeof window.YourApp.hide === 'function') {
    window.YourApp.hide();
  } else {
    $('#phone_interface .your-app-container').hide();
  }

  // 关闭其他弹窗
  $('#group_create_dialog').hide();
  $('#add_member_dialog').hide();
  $('#avatar_dialog').remove();
  $('#user_avatar_dialog').remove();

  // ...其他应用的关闭逻辑...

  // 移除所有应用模式
  $('#phone_interface').removeClass('show-qq-app-content show-taobao-app-content show-your-app-content');
  $('body').removeClass('qq-app-mode taobao-app-mode your-app-mode');
  
  console.log('所有应用界面已关闭, 所有应用模式已移除.');
},
```

#### 4. 应用中的goHome方法实现

**❌ 错误方式：**
```javascript
// 错误：直接调用PhoneInterface.show()可能触发动画
goHome: function() {
  if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
    window.PhoneInterface.show();
  }
}
```

**✅ 正确方式：**
```javascript
goHome: function () {
  console.log('🏠 返回手机主页');
  
  // 1. 立即隐藏应用容器，不使用动画
  const $phoneInterface = $('#phone_interface');
  const $appContainer = $phoneInterface.find('.your-app-container');
  
  if ($appContainer.length > 0) {
    $appContainer.hide();
  }
  
  // 2. 移除应用模式
  $phoneInterface.removeClass('show-your-app-content');
  $('body').removeClass('your-app-mode');
  
  // 3. 显示主屏幕内容
  $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();
  
  // 4. 确保手机界面处于正确状态，但禁用动画
  if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
    // 临时禁用动画
    const originalTransition = $phoneInterface.css('transition');
    $phoneInterface.css('transition', 'none');
    
    // 调用显示方法
    window.PhoneInterface.show();
    
    // 在下一帧恢复动画
    setTimeout(() => {
      $phoneInterface.css('transition', originalTransition);
    }, 0);
  }
},
```

### 🚫 常见错误和解决方案

#### 错误1：点击应用图标先关闭手机
**原因：** 应用没有在openApp函数中被正确识别，被当作"其他应用"处理
**解决：** 确保在openApp函数中添加了应用的特殊处理逻辑

#### 错误2：关闭手机再打开停留在应用界面
**原因：** show方法中没有正确隐藏应用容器或移除应用模式CSS类
**解决：** 在show方法中添加完整的状态重置逻辑

#### 错误3：返回主页时有缩放动画
**原因：** PhoneShell的动画系统被触发
**解决：** 在goHome方法中临时禁用transition属性

#### 错误4：应用容器显示但内容为空
**原因：** 应用的hide()方法清空了容器内容但没有隐藏容器
**解决：** 确保hide()方法既清空内容又隐藏容器

### 📋 完整集成检查清单

#### JavaScript集成：
- [ ] 在openApp函数中添加应用的特殊处理分支
- [ ] 应用模式CSS类命名一致：`show-your-app-content`、`your-app-mode`
- [ ] 实现正确的goHome方法，包含动画禁用逻辑
- [ ] 实现完整的hide方法，既隐藏容器又清空内容

#### phone-interface.js更新：
- [ ] 在openApp函数中添加应用分支
- [ ] 在show方法中添加应用容器隐藏逻辑
- [ ] 在show方法中添加应用模式CSS类移除逻辑
- [ ] 在closeAllApps方法中添加应用关闭逻辑

#### CSS样式：
- [ ] 应用容器正确的z-index和定位
- [ ] 应用模式下的显示控制样式
- [ ] 防止主题色彩干扰的样式保护

#### 测试验证：
- [ ] 点击应用图标正确在手机界面内打开
- [ ] 点击手机外部能关闭应用返回主页
- [ ] 关闭手机再打开回到主页而非应用
- [ ] 点击应用内的返回按钮无缩放动画
- [ ] 切换主题时应用样式不受影响

### 🔧 分类滚动条丝滑优化经验

基于淘宝应用的拖拽条优化经验：

#### 核心问题：
- **惯性滑动**：拖拽停止后继续滑动
- **响应延迟**：拖拽速度跟不上鼠标移动
- **不够精确**：拖拽位置与实际滚动位置不匹配

#### 解决方案：
```javascript
// 1. 直接位置映射（消除惯性）
const relativePosition = Math.max(0, Math.min(1, (clientX - scrollbarLeft) / scrollbarWidth));
const targetScrollLeft = relativePosition * maxScrollLeft;
tabsElement.scrollLeft = targetScrollLeft; // 直接设置，无增量计算

// 2. 禁用拖拽时的所有动画
$thumb.css({
  'transition': 'none',
  'animation': 'none'
});
$categoryTabs.css({
  'scroll-behavior': 'auto', // 关键：禁用平滑滚动
  'transition': 'none'
});

// 3. 拖拽结束后恢复动画
setTimeout(() => {
  $thumb.css('transition', 'left 0.2s ease');
  $categoryTabs.css('scroll-behavior', 'smooth');
}, 50);
```

### 🎯 应用集成模板

使用以下模板可以快速集成新应用：

```javascript
// 1. 在phone-interface.js的openApp函数中添加
else if (appName === 'NewApp') {
  $('#phone_interface').addClass('show show-newapp-content');
  $('body').addClass('newapp-mode');
}

// 2. 在phone-interface.js的show方法中添加
$phoneInterface.removeClass('show-qq-app-content show-taobao-app-content show-newapp-content');
$('body').removeClass('qq-app-mode taobao-app-mode newapp-mode');
$('#phone_interface .newapp-container').hide();

// 3. 在phone-interface.js的closeAllApps方法中添加
if (window.NewApp && typeof window.NewApp.hide === 'function') {
  window.NewApp.hide();
} else {
  $('#phone_interface .newapp-container').hide();
}

// 4. 在应用的goHome方法中实现
goHome: function () {
  const $phoneInterface = $('#phone_interface');
  const $appContainer = $phoneInterface.find('.newapp-container');
  
  if ($appContainer.length > 0) {
    $appContainer.hide();
  }
  
  $phoneInterface.removeClass('show-newapp-content');
  $('body').removeClass('newapp-mode');
  
  $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();
  
  if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
    const originalTransition = $phoneInterface.css('transition');
    $phoneInterface.css('transition', 'none');
    window.PhoneInterface.show();
    setTimeout(() => {
      $phoneInterface.css('transition', originalTransition);
    }, 0);
  }
}
```

---

*本指南包含了所有关键的集成经验，特别是关闭手机和返回主页的完整逻辑。按照这个指南操作，可以确保应用完美集成到phone-shell系统中。* 