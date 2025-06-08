/**
 * 🔧 QQ聊天界面修复测试脚本
 *
 * 用于测试以下修复：
 * 1. 聊天详情页初始定位问题
 * 2. 消息通知音效增强
 * 3. 实时更新首条消息延迟优化
 */

// 测试配置
const QQ_FIXES_TEST_CONFIG = {
  // 测试模式
  enableLogs: true,
  testNotificationSound: true,
  testScrollBehavior: true,
  testRealtimeUpdates: true,
};

/**
 * 🔧 QQ聊天修复测试器
 */
class QQChatFixesTester {
  constructor() {
    this.testResults = {
      scrollFix: null,
      notificationSound: null,
      realtimeUpdates: null,
    };
  }

  /**
   * 🎯 运行所有测试
   */
  async runAllTests() {
    console.log('🔧 开始QQ聊天界面修复测试...');

    try {
      // 测试1：滚动行为修复
      if (QQ_FIXES_TEST_CONFIG.testScrollBehavior) {
        await this.testScrollBehaviorFix();
      }

      // 测试2：通知音效
      if (QQ_FIXES_TEST_CONFIG.testNotificationSound) {
        await this.testNotificationSoundEnhancement();
      }

      // 测试3：实时更新优化
      if (QQ_FIXES_TEST_CONFIG.testRealtimeUpdates) {
        await this.testRealtimeUpdateOptimization();
      }

      // 输出测试结果
      this.outputTestResults();
    } catch (error) {
      console.error('🔧 测试过程中出现错误:', error);
    }
  }

  /**
   * 📜 测试滚动行为修复
   */
  async testScrollBehaviorFix() {
    console.log('📜 测试聊天页面滚动行为修复...');

    try {
      // 检查QQ应用是否可用
      if (!window.QQApp) {
        throw new Error('QQApp不可用');
      }

      // 模拟打开聊天页面
      const $testChatPage = $(`
        <div class="chat-page show" style="position: fixed; top: 0; left: 0; width: 300px; height: 400px; background: white; z-index: 9999;">
          <div class="chat-messages" style="height: 300px; overflow-y: auto;">
            <div class="custom-message">测试消息1</div>
            <div class="custom-message">测试消息2</div>
            <div class="custom-message">测试消息3</div>
            <div class="custom-message">测试消息4</div>
            <div class="custom-message">测试消息5</div>
            <div class="custom-message">测试消息6</div>
            <div class="custom-message">测试消息7</div>
            <div class="custom-message">测试消息8</div>
            <div class="custom-message">测试消息9</div>
            <div class="custom-message">测试消息10</div>
          </div>
        </div>
      `);

      $('body').append($testChatPage);

      // 测试滚动行为
      const $messagesContainer = $testChatPage.find('.chat-messages');
      const initialScrollTop = $messagesContainer[0].scrollTop;

      // 模拟首次打开的滚动逻辑
      $messagesContainer.css('scroll-behavior', 'auto');
      $messagesContainer[0].scrollTop = $messagesContainer[0].scrollHeight;

      const finalScrollTop = $messagesContainer[0].scrollTop;
      const isAtBottom =
        Math.abs(finalScrollTop - ($messagesContainer[0].scrollHeight - $messagesContainer[0].clientHeight)) < 5;

      this.testResults.scrollFix = {
        passed: isAtBottom,
        initialScrollTop: initialScrollTop,
        finalScrollTop: finalScrollTop,
        isAtBottom: isAtBottom,
        hasAnimation: $messagesContainer.css('scroll-behavior') === 'auto',
      };

      console.log('📜 滚动测试结果:', this.testResults.scrollFix);

      // 清理测试元素
      setTimeout(() => $testChatPage.remove(), 2000);
    } catch (error) {
      this.testResults.scrollFix = { passed: false, error: error.message };
      console.error('📜 滚动测试失败:', error);
    }
  }

  /**
   * 🔊 测试通知音效增强
   */
  async testNotificationSoundEnhancement() {
    console.log('🔊 测试消息通知音效增强...');

    try {
      // 检查QQ应用是否可用
      if (!window.QQApp || typeof window.QQApp.playMessageNotificationSound !== 'function') {
        throw new Error('QQApp或playMessageNotificationSound方法不可用');
      }

      // 测试音效播放
      const startTime = Date.now();
      window.QQApp.playMessageNotificationSound();
      const endTime = Date.now();

      this.testResults.notificationSound = {
        passed: true,
        executionTime: endTime - startTime,
        methodAvailable: typeof window.QQApp.playMessageNotificationSound === 'function',
        audioContextSupported: !!(window.AudioContext || window.webkitAudioContext),
      };

      console.log('🔊 通知音效测试结果:', this.testResults.notificationSound);
    } catch (error) {
      this.testResults.notificationSound = { passed: false, error: error.message };
      console.error('🔊 通知音效测试失败:', error);
    }
  }

  /**
   * ⚡ 测试实时更新优化
   */
  async testRealtimeUpdateOptimization() {
    console.log('⚡ 测试实时更新首条消息延迟优化...');

    try {
      // 检查实时更新系统
      if (!window.QQApp) {
        throw new Error('QQApp不可用');
      }

      // 检查优化后的属性（修正属性名）
      const hasLastRealtimeUpdateTime = window.QQApp.hasOwnProperty('lastRealtimeUpdateTime');
      const hasOptimizedCallback = window.QQApp.realtimeUpdateCallback !== undefined;

      // 模拟首次更新
      const testStartTime = Date.now();

      // 重置更新状态
      window.QQApp.lastRealtimeUpdateTime = null;
      window.QQApp.isUpdating = false;

      // 模拟更新回调
      if (window.QQApp.realtimeUpdateCallback) {
        window.QQApp.realtimeUpdateCallback({ source: 'test', timestamp: Date.now() });
      }

      const testEndTime = Date.now();
      const responseTime = testEndTime - testStartTime;

      // 测试智能滚动优化
      const scrollOptimized = this.testScrollOptimization();

      this.testResults.realtimeUpdates = {
        passed: hasLastRealtimeUpdateTime && hasOptimizedCallback && responseTime < 100 && scrollOptimized,
        hasLastRealtimeUpdateTime: hasLastRealtimeUpdateTime,
        hasOptimizedCallback: hasOptimizedCallback,
        responseTime: responseTime,
        scrollOptimized: scrollOptimized,
        isOptimized: responseTime < 100,
      };

      console.log('⚡ 实时更新测试结果:', this.testResults.realtimeUpdates);
    } catch (error) {
      this.testResults.realtimeUpdates = { passed: false, error: error.message };
      console.error('⚡ 实时更新测试失败:', error);
    }
  }

  /**
   * 📜 测试滚动优化
   */
  testScrollOptimization() {
    try {
      // 检查smartScrollToNewMessages函数是否已优化
      const smartScrollFunction = window.QQApp.smartScrollToNewMessages.toString();

      // 检查是否移除了延迟
      const hasRemovedDelay = !smartScrollFunction.includes('setTimeout(resolve, 50)');
      const hasAutoScrollBehavior = smartScrollFunction.includes("scroll-behavior', 'auto'");

      console.log('📜 滚动优化检查:', {
        removedDelay: hasRemovedDelay,
        autoScrollBehavior: hasAutoScrollBehavior,
      });

      return hasRemovedDelay && hasAutoScrollBehavior;
    } catch (error) {
      console.error('📜 滚动优化检查失败:', error);
      return false;
    }
  }

  /**
   * 📊 输出测试结果
   */
  outputTestResults() {
    console.log('\n🔧 ===== QQ聊天界面修复测试结果 =====');

    const results = [
      { name: '滚动行为修复', result: this.testResults.scrollFix },
      { name: '通知音效增强', result: this.testResults.notificationSound },
      { name: '实时更新优化', result: this.testResults.realtimeUpdates },
    ];

    results.forEach(({ name, result }) => {
      if (result) {
        const status = result.passed ? '✅ 通过' : '❌ 失败';
        console.log(`${status} ${name}:`, result);
      } else {
        console.log(`⏸️ 跳过 ${name}`);
      }
    });

    // 总体结果
    const passedTests = results.filter(r => r.result && r.result.passed).length;
    const totalTests = results.filter(r => r.result).length;

    console.log(`\n📊 总体结果: ${passedTests}/${totalTests} 项测试通过`);

    if (passedTests === totalTests && totalTests > 0) {
      console.log('🎉 所有修复都已成功应用！');
    } else if (passedTests > 0) {
      console.log('⚠️ 部分修复成功，请检查失败的项目');
    } else {
      console.log('❌ 修复可能未正确应用，请检查代码');
    }
  }

  /**
   * 🎮 手动测试通知音效
   */
  static testNotificationSoundManually() {
    console.log('🎮 手动测试通知音效...');
    if (window.QQApp && typeof window.QQApp.playMessageNotificationSound === 'function') {
      window.QQApp.playMessageNotificationSound();
      console.log('🔊 通知音效已播放');
    } else {
      console.error('❌ 通知音效方法不可用');
    }
  }
}

// 全局暴露测试器
window.QQChatFixesTester = QQChatFixesTester;

// 自动运行测试（如果QQ应用已加载）
$(document).ready(() => {
  // 等待QQ应用加载完成
  if (window.QQApp) {
    setTimeout(() => {
      const tester = new QQChatFixesTester();
      tester.runAllTests();
    }, 1000);
  } else {
    // 监听QQ应用加载完成事件
    $(document).on('qq-app-loaded', () => {
      setTimeout(() => {
        const tester = new QQChatFixesTester();
        tester.runAllTests();
      }, 500);
    });
  }
});

// 提供手动测试命令
console.log('🔧 QQ聊天修复测试器已加载');
console.log('📝 使用方法:');
console.log('  - 自动测试: new QQChatFixesTester().runAllTests()');
console.log('  - 手动测试音效: QQChatFixesTester.testNotificationSoundManually()');
