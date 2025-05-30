// SillyTavern界面覆盖问题调试工具
// 在浏览器控制台中运行此脚本来诊断问题

window.MobileDebugger = {
  // 检查所有元素的z-index
  checkZIndex: function () {
    console.log('=== Z-INDEX 检查 ===');
    const elements = document.querySelectorAll('*');
    const highZIndexElements = [];

    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex);

      if (!isNaN(zIndex) && zIndex > 100) {
        highZIndexElements.push({
          element: el,
          zIndex: zIndex,
          id: el.id || 'no-id',
          classes: el.className || 'no-class',
          tagName: el.tagName,
        });
      }
    });

    // 按z-index排序
    highZIndexElements.sort((a, b) => b.zIndex - a.zIndex);

    console.log('高z-index元素 (>100):');
    highZIndexElements.forEach(item => {
      console.log(`z-index: ${item.zIndex}, ID: ${item.id}, Classes: ${item.classes}, Tag: ${item.tagName}`);
    });

    return highZIndexElements;
  },

  // 检查手机插件状态
  checkMobileState: function () {
    console.log('=== 手机插件状态检查 ===');

    const phoneInterface = document.getElementById('phone_interface');
    const chatDialog = document.getElementById('chat_history_dialog');
    const body = document.body;

    console.log('Phone Interface:');
    console.log('- 存在:', !!phoneInterface);
    console.log('- 显示:', phoneInterface ? phoneInterface.style.display : 'N/A');
    console.log('- Classes:', phoneInterface ? phoneInterface.className : 'N/A');
    console.log('- Z-index (computed):', phoneInterface ? window.getComputedStyle(phoneInterface).zIndex : 'N/A');
    console.log('- Z-index (inline):', phoneInterface ? phoneInterface.style.zIndex : 'N/A');

    console.log('\nChat Dialog:');
    console.log('- 存在:', !!chatDialog);
    console.log('- 显示:', chatDialog ? chatDialog.style.display : 'N/A');
    console.log('- Classes:', chatDialog ? chatDialog.className : 'N/A');
    console.log('- Z-index (computed):', chatDialog ? window.getComputedStyle(chatDialog).zIndex : 'N/A');
    console.log('- Z-index (inline):', chatDialog ? chatDialog.style.zIndex : 'N/A');

    console.log('\nBody Classes:', body.className);

    console.log('\nQQ App Container:');
    const qqContainer = document.querySelector('.qq-app-container');
    console.log('- 存在:', !!qqContainer);
    console.log('- 显示:', qqContainer ? qqContainer.style.display : 'N/A');
    console.log('- Classes:', qqContainer ? qqContainer.className : 'N/A');

    console.log('\nChat Pages:');
    const chatPages = document.querySelectorAll('.chat-page');
    chatPages.forEach((page, index) => {
      console.log(`- Chat Page ${index}: Classes: ${page.className}, Display: ${page.style.display}`);
    });
  },

  // 检查SillyTavern关键界面元素
  checkSillyTavernElements: function () {
    console.log('=== SillyTavern界面元素检查 ===');

    const criticalElements = [
      '#WorldInfo',
      '#WIDrawerIcon',
      '#wi_menu',
      '#character_popup',
      '#preset_settings',
      '#preset_popup',
      '#PromptManagerModule',
      '#promptManagerDrawer',
    ];

    criticalElements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const style = window.getComputedStyle(element);
        console.log(`${selector}:`);
        console.log(`- 存在: true`);
        console.log(`- 可见: ${element.offsetParent !== null}`);
        console.log(`- Z-index: ${style.zIndex}`);
        console.log(`- Position: ${style.position}`);
        console.log(`- Display: ${style.display}`);
        console.log(`- Visibility: ${style.visibility}`);
        console.log(`- Opacity: ${style.opacity}`);
        console.log('---');
      } else {
        console.log(`${selector}: 不存在`);
      }
    });
  },

  // 模拟用户操作并记录状态变化
  simulateUserActions: function () {
    console.log('=== 模拟用户操作测试 ===');

    const phoneBtn = document.getElementById('chat_history_btn');
    if (!phoneBtn) {
      console.log('错误: 找不到手机按钮');
      return;
    }

    console.log('步骤1: 初始状态');
    this.checkMobileState();

    console.log('\n步骤2: 第一次点击手机按钮');
    phoneBtn.click();

    setTimeout(() => {
      console.log('第一次打开后的状态:');
      this.checkMobileState();
      this.checkZIndex();

      console.log('\n步骤3: 关闭手机界面');
      phoneBtn.click();

      setTimeout(() => {
        console.log('关闭后的状态:');
        this.checkMobileState();

        console.log('\n步骤4: 第二次打开手机界面 (关键测试)');
        phoneBtn.click();

        setTimeout(() => {
          console.log('第二次打开后的状态:');
          this.checkMobileState();
          this.checkZIndex();
          this.checkSillyTavernElements();

          console.log('\n=== 测试完成 ===');
          console.log('请检查SillyTavern界面是否可以正常访问');
        }, 1000);
      }, 1000);
    }, 1000);
  },

  // 检查CSS规则冲突
  checkCSSConflicts: function () {
    console.log('=== CSS规则冲突检查 ===');

    // 检查可能影响SillyTavern的CSS规则
    const stylesheets = Array.from(document.styleSheets);

    stylesheets.forEach((sheet, index) => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach(rule => {
          if (rule.style && rule.style.zIndex && parseInt(rule.style.zIndex) > 500) {
            console.log(`高z-index CSS规则: ${rule.selectorText} { z-index: ${rule.style.zIndex} }`);
          }
        });
      } catch (e) {
        console.log(`无法访问样式表 ${index}: ${e.message}`);
      }
    });
  },

  // 完整诊断
  fullDiagnosis: function () {
    console.log('开始完整诊断...\n');

    this.checkZIndex();
    console.log('\n');

    this.checkMobileState();
    console.log('\n');

    this.checkSillyTavernElements();
    console.log('\n');

    this.checkCSSConflicts();
    console.log('\n');

    console.log('现在开始模拟用户操作...');
    this.simulateUserActions();
  },

  // 快速修复尝试
  quickFix: function () {
    console.log('=== 尝试快速修复 ===');

    // 强制降低所有手机插件相关元素的z-index
    const elementsToFix = [
      '#phone_interface',
      '#chat_history_dialog',
      '.qq-app-container',
      '.chat-page',
      '#chat_history_btn',
      '#taobao_interface',
      '#task_interface',
      '#backpack_interface',
      '#chouka_interface',
    ];

    elementsToFix.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.zIndex = '400';
        console.log(`设置 ${selector} z-index 为 400`);
      });
    });

    // 清理所有状态
    if (window.PhoneInterface && window.PhoneInterface.forceCleanState) {
      window.PhoneInterface.forceCleanState();
      console.log('执行强制状态清理');
    }

    console.log('快速修复完成，请测试');
  },

  // 验证修复效果
  verifyFix: function () {
    console.log('=== 验证修复效果 ===');

    const criticalElements = [
      '#chat_history_btn',
      '#phone_interface',
      '#chat_history_dialog',
      '#taobao_interface',
      '#task_interface',
      '#backpack_interface',
      '#chouka_interface',
      '.chat-page',
    ];

    console.log('检查关键元素的z-index:');
    criticalElements.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        const computedStyle = window.getComputedStyle(el);
        const zIndex = computedStyle.zIndex;
        console.log(`${selector}: z-index = ${zIndex}`);

        if (parseInt(zIndex) > 600) {
          console.warn(`⚠️ ${selector} 的z-index (${zIndex}) 仍然过高!`);
        } else {
          console.log(`✅ ${selector} 的z-index (${zIndex}) 正常`);
        }
      } else {
        console.log(`${selector}: 元素不存在`);
      }
    });

    console.log('\n检查SillyTavern关键界面是否可访问:');
    const sillyTavernElements = ['#WorldInfo', '#WIDrawerIcon', '#preset_settings'];

    sillyTavernElements.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        const style = window.getComputedStyle(el);
        const isVisible = el.offsetParent !== null;
        console.log(`${selector}: 可见=${isVisible}, z-index=${style.zIndex}`);
      } else {
        console.log(`${selector}: 元素不存在`);
      }
    });
  },
};

// 使用说明
console.log('=== 手机插件调试工具已加载 ===');
console.log('可用命令:');
console.log('MobileDebugger.fullDiagnosis() - 完整诊断');
console.log('MobileDebugger.checkZIndex() - 检查z-index');
console.log('MobileDebugger.checkMobileState() - 检查手机插件状态');
console.log('MobileDebugger.checkSillyTavernElements() - 检查SillyTavern元素');
console.log('MobileDebugger.simulateUserActions() - 模拟用户操作');
console.log('MobileDebugger.quickFix() - 尝试快速修复');
console.log('MobileDebugger.verifyFix() - 验证修复效果');
console.log('\n建议先运行: MobileDebugger.verifyFix() 检查修复效果');
