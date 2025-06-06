/* 统一按钮图标管理 */

// 创建CSS样式
const UNIFIED_BUTTONS_CSS = `
/* 统一按钮样式 - 简洁版本 */

/* QQ主页小房子按钮 */
#home_btn_main,
.home-btn {
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
  font-size: 20px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  user-select: none;
  padding: 0;
  position: relative;
  z-index: 10;
}

#home_btn_main svg,
.home-btn svg {
  width: 20px;
  height: 20px;
}

#home_btn_main:hover,
.home-btn:hover {
  transform: scale(1.1);
  background: rgba(0, 122, 255, 0.1);
}

#home_btn_main:active,
.home-btn:active {
  transform: scale(0.9);
  background: rgba(0, 122, 255, 0.2);
}

/* 聊天页面小房子按钮 */
.chat-home-btn {
  background: none;
  color: #007aff;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  user-select: none;
  padding: 0;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.chat-home-btn svg {
  width: 20px;
  height: 20px;
}

.chat-home-btn:hover {
  transform: translateY(-50%) scale(1.1);
  background: rgba(0, 122, 255, 0.1);
}

.chat-home-btn:active {
  transform: translateY(-50%) scale(0.9);
  background: rgba(0, 122, 255, 0.2);
}

/* QQ聊天页面返回按钮 */
.back-to-main-list-btn {
  background: none;
  border: none;
  color: #007aff;
  cursor: pointer;
  padding: 8px;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  user-select: none;
  position: absolute;
  left: 16px;
  top: 52%;
  transform: translateY(-50%);
  border-radius: 8px;
  font-size: 16px;
  font-weight: normal;
}

.back-to-main-list-btn svg {
  width: 24px;
  height: 24px;
}

.back-to-main-list-btn:hover {
  transform: translateY(-50%) scale(1.1);
  background: rgba(0, 122, 255, 0.1);
}

.back-to-main-list-btn:active {
  transform: translateY(-50%) scale(0.9);
  background: rgba(0, 122, 255, 0.2);
}

/* 好友群组管理页面小房子按钮 */
.friend-manager-home-btn,
.friend-manager .home-button {
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
  font-size: 20px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  user-select: none;
  padding: 0;
  position: relative;
  z-index: 10;
}

.friend-manager-home-btn svg,
.friend-manager .home-button svg {
  width: 20px;
  height: 20px;
}

.friend-manager-home-btn:hover,
.friend-manager .home-button:hover {
  transform: scale(1.1);
  background: rgba(0, 122, 255, 0.1);
}

.friend-manager-home-btn:active,
.friend-manager .home-button:active {
  transform: scale(0.9);
  background: rgba(0, 122, 255, 0.2);
}

/* 好友群组管理返回按钮 */
#friend_manager_back_btn,
.friend-manager .back-button {
  background: none;
  border: none;
  color: #007aff;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  user-select: none;
}

#friend_manager_back_btn svg,
.friend-manager .back-button svg {
  width: 24px;
  height: 24px;
}

#friend_manager_back_btn:hover,
.friend-manager .back-button:hover {
  transform: scale(1.1);
  background: rgba(0, 122, 255, 0.1);
}

#friend_manager_back_btn:active,
.friend-manager .back-button:active {
  transform: scale(0.9);
  background: rgba(0, 122, 255, 0.2);
}

/* 美化应用小房子按钮 */
.wallpaper-home-btn {
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
  font-size: 20px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  user-select: none;
  padding: 0;
  margin-left: auto;
  position: relative;
  z-index: 10;
}

.wallpaper-home-btn svg {
  width: 20px;
  height: 20px;
}

.wallpaper-home-btn:hover {
  transform: scale(1.1);
  background: rgba(0, 122, 255, 0.1);
}

.wallpaper-home-btn:active {
  transform: scale(0.9);
  background: rgba(0, 122, 255, 0.2);
}

/* 美化应用返回按钮 */
.wallpaper-back-btn {
  background: none;
  border: none;
  color: #007aff;
  cursor: pointer;
  padding: 8px;
  margin-right: 15px;
  border-radius: 8px;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  user-select: none;
}

.wallpaper-back-btn svg {
  width: 24px;
  height: 24px;
}

.wallpaper-back-btn:hover {
  transform: scale(1.1);
  background: rgba(0, 122, 255, 0.1);
}

.wallpaper-back-btn:active {
  transform: scale(0.9);
  background: rgba(0, 122, 255, 0.2);
}

/* QQ联系人列表返回按钮 */
.back {
  background: none;
  border: none;
  color: #007aff;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  user-select: none;
  font-size: 20px;
}

.back svg {
  width: 24px;
  height: 24px;
}

.back:hover {
  transform: scale(1.1);
  background: rgba(0, 122, 255, 0.1);
}

.back:active {
  transform: scale(0.9);
  background: rgba(0, 122, 255, 0.2);
}
`;

// 注入CSS样式
function injectCSS() {
  const styleId = 'unified-buttons-style';
  let styleElement = document.getElementById(styleId);

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = UNIFIED_BUTTONS_CSS;
    document.head.appendChild(styleElement);
    console.log('✅ 统一按钮CSS样式已注入');
  }
}

// 小房子SVG图标
const HOME_ICON_SVG = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
    <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
  </svg>
`;

// 返回箭头SVG图标
const BACK_ICON_SVG = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/>
  </svg>
`;

// 统一按钮图标管理器
window.UnifiedButtons = {
  // 初始化所有按钮
  init: function () {
    console.log('🔧 初始化统一按钮样式...');

    // 首先注入CSS样式
    injectCSS();

    this.updateHomeButtons();
    this.updateBackButtons();
    console.log('✅ 统一按钮样式初始化完成');
  },

  // 更新所有小房子按钮
  updateHomeButtons: function () {
    const homeButtonSelectors = [
      '#home_btn_main',
      '.home-btn',
      '.chat-home-btn',
      '.friend-manager-home-btn',
      '.friend-manager .home-button',
      '.wallpaper-home-btn',
    ];

    homeButtonSelectors.forEach(selector => {
      $(selector).each(function () {
        // 保存原有的title属性
        const title = $(this).attr('title') || '返回手机首页';

        // 根据按钮类型使用不同尺寸的SVG图标
        let svgIcon = HOME_ICON_SVG;
        if ($(this).hasClass('chat-home-btn')) {
          // 聊天页面小房子按钮使用20px图标
          svgIcon = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
              <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
            </svg>
          `;
        } else if ($(this).is('#home_btn_main, .home-btn')) {
          // QQ主页小房子按钮使用20px图标
          svgIcon = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
              <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
            </svg>
          `;
        }

        // 替换内容为SVG图标
        $(this).html(svgIcon);

        // 恢复title属性
        $(this).attr('title', title);

        // 添加统一样式类
        $(this).addClass('unified-home-btn');
      });
    });

    console.log('🏠 小房子按钮图标已统一更新');
  },

  // 更新所有返回按钮
  updateBackButtons: function () {
    const backButtonSelectors = [
      '.back-to-main-list-btn',
      '#friend_manager_back_btn',
      '.friend-manager .back-button',
      '.wallpaper-back-btn',
      '.back',
    ];

    backButtonSelectors.forEach(selector => {
      $(selector).each(function () {
        // 保存原有的title属性
        const title = $(this).attr('title') || '返回';

        // 替换内容为SVG图标
        $(this).html(BACK_ICON_SVG);

        // 恢复title属性
        $(this).attr('title', title);

        // 添加统一样式类
        $(this).addClass('unified-back-btn');
      });
    });

    console.log('🔙 返回按钮图标已统一更新');
  },

  // 监听DOM变化，自动更新新添加的按钮
  observeChanges: function () {
    const self = this;
    const observer = new MutationObserver(mutations => {
      let shouldUpdate = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              // Element node
              // 检查是否添加了新的按钮
              const homeButtons = node.querySelectorAll
                ? node.querySelectorAll(
                    '#home_btn_main, .home-btn, .chat-home-btn, .friend-manager-home-btn, .friend-manager .home-button, .wallpaper-home-btn',
                  )
                : [];
              const backButtons = node.querySelectorAll
                ? node.querySelectorAll(
                    '.back-to-main-list-btn, #friend_manager_back_btn, .friend-manager .back-button, .wallpaper-back-btn, .back',
                  )
                : [];

              if (homeButtons.length > 0 || backButtons.length > 0) {
                shouldUpdate = true;
              }

              // 检查节点本身是否是按钮
              if (
                node.matches &&
                (node.matches(
                  '#home_btn_main, .home-btn, .chat-home-btn, .friend-manager-home-btn, .friend-manager .home-button, .wallpaper-home-btn',
                ) ||
                  node.matches(
                    '.back-to-main-list-btn, #friend_manager_back_btn, .friend-manager .back-button, .wallpaper-back-btn, .back',
                  ))
              ) {
                shouldUpdate = true;
              }
            }
          });
        }
      });

      if (shouldUpdate) {
        setTimeout(() => {
          self.updateHomeButtons();
          self.updateBackButtons();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('👀 开始监听DOM变化，自动更新按钮样式');
  },

  // 手动刷新所有按钮
  refresh: function () {
    console.log('🔄 手动刷新所有按钮样式...');

    // 重新注入CSS样式
    injectCSS();

    this.updateHomeButtons();
    this.updateBackButtons();
    console.log('✅ 按钮样式刷新完成');
  },
};

// 当DOM准备就绪时初始化
$(document).ready(function () {
  // 延迟初始化，确保其他组件已加载
  setTimeout(() => {
    window.UnifiedButtons.init();
    window.UnifiedButtons.observeChanges();
  }, 500);

  // 监听QQ应用加载完成事件
  $(document).on('qq-app-loaded', function () {
    console.log('🎯 检测到QQ应用加载完成，刷新按钮样式');
    setTimeout(() => {
      window.UnifiedButtons.refresh();
    }, 200);
  });

  // 监听好友管理页面显示事件
  $(document).on('friend-manager-shown', function () {
    console.log('🎯 检测到好友管理页面显示，刷新按钮样式');
    setTimeout(() => {
      window.UnifiedButtons.refresh();
    }, 200);
  });

  // 监听美化应用显示事件
  $(document).on('wallpaper-app-shown', function () {
    console.log('🎯 检测到美化应用显示，刷新按钮样式');
    setTimeout(() => {
      window.UnifiedButtons.refresh();
    }, 200);
  });
});

// 为其他组件提供手动刷新接口
window.refreshUnifiedButtons = function () {
  if (window.UnifiedButtons) {
    window.UnifiedButtons.refresh();
  }
};

// 导出图标常量供其他文件使用
window.UNIFIED_BUTTON_ICONS = {
  HOME: HOME_ICON_SVG,
  BACK: BACK_ICON_SVG,
};
