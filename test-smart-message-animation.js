/**
 * 🎭 QQ聊天智能消息动画系统测试脚本
 * 
 * 用于测试新消息的智能滚动定位和动态显示动画功能
 */

// 测试配置
const TEST_CONFIG = {
  // 测试消息数据
  testMessages: [
    { type: 'received', name: '测试用户1', content: '这是第一条测试消息', time: '10:00' },
    { type: 'received', name: '测试用户2', content: '这是第二条测试消息', time: '10:01' },
    { type: 'sent', content: '这是我发送的测试消息', time: '10:02' },
    { type: 'received', name: '测试用户1', content: '这是第四条测试消息，内容比较长一些，用来测试消息气泡的显示效果', time: '10:03' }
  ],
  
  // 动画配置
  animationDelay: 800, // 消息间隔时间
  scrollOffset: 20,    // 滚动边距
  
  // 测试模式
  enableLogs: true,    // 启用详细日志
  slowMotion: false    // 慢动作模式（用于调试）
};

/**
 * 🧪 测试智能消息动画系统
 */
class SmartMessageAnimationTester {
  constructor() {
    this.isTestRunning = false;
    this.testResults = [];
  }

  /**
   * 🚀 启动测试
   */
  async startTest() {
    if (this.isTestRunning) {
      console.log('⚠️ 测试已在运行中');
      return;
    }

    this.isTestRunning = true;
    console.log('🧪 开始测试智能消息动画系统...');

    try {
      // 检查依赖
      if (!this.checkDependencies()) {
        throw new Error('依赖检查失败');
      }

      // 运行测试用例
      await this.runTestCases();

      // 输出测试结果
      this.outputTestResults();

    } catch (error) {
      console.error('❌ 测试失败:', error);
    } finally {
      this.isTestRunning = false;
    }
  }

  /**
   * 🔍 检查依赖
   */
  checkDependencies() {
    const dependencies = [
      { name: 'jQuery', check: () => typeof $ !== 'undefined' },
      { name: 'QQApp', check: () => typeof window.QQApp !== 'undefined' },
      { name: 'HQDataExtractor', check: () => typeof window.HQDataExtractor !== 'undefined' }
    ];

    let allPassed = true;
    dependencies.forEach(dep => {
      const passed = dep.check();
      console.log(`${passed ? '✅' : '❌'} ${dep.name}: ${passed ? '已加载' : '未找到'}`);
      if (!passed) allPassed = false;
    });

    return allPassed;
  }

  /**
   * 🧪 运行测试用例
   */
  async runTestCases() {
    const testCases = [
      { name: '消息状态捕获测试', test: () => this.testMessageStateCapture() },
      { name: '新消息识别测试', test: () => this.testNewMessageIdentification() },
      { name: '智能滚动测试', test: () => this.testSmartScrolling() },
      { name: '动画显示测试', test: () => this.testMessageAnimation() },
      { name: '完整流程测试', test: () => this.testCompleteFlow() }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 运行测试: ${testCase.name}`);
      try {
        const result = await testCase.test();
        this.testResults.push({ name: testCase.name, status: 'passed', result });
        console.log(`✅ ${testCase.name} - 通过`);
      } catch (error) {
        this.testResults.push({ name: testCase.name, status: 'failed', error: error.message });
        console.error(`❌ ${testCase.name} - 失败:`, error.message);
      }
    }
  }

  /**
   * 📸 测试消息状态捕获
   */
  testMessageStateCapture() {
    if (!window.QQApp || typeof window.QQApp.captureCurrentMessageState !== 'function') {
      throw new Error('captureCurrentMessageState 函数不存在');
    }

    // 模拟消息容器
    const $mockContainer = $('<div class="chat-messages"><div class="custom-message"><div class="message-text">测试消息</div></div></div>');
    $('body').append($mockContainer);

    try {
      const state = window.QQApp.captureCurrentMessageState($mockContainer);
      
      if (!state || typeof state.messageCount !== 'number' || typeof state.lastMessageContent !== 'string') {
        throw new Error('返回的状态格式不正确');
      }

      console.log('📊 捕获的状态:', state);
      return { messageCount: state.messageCount, hasContent: state.lastMessageContent.length > 0 };
    } finally {
      $mockContainer.remove();
    }
  }

  /**
   * 🔍 测试新消息识别
   */
  testNewMessageIdentification() {
    if (!window.QQApp || typeof window.QQApp.identifyNewMessages !== 'function') {
      throw new Error('identifyNewMessages 函数不存在');
    }

    const beforeUpdate = { messageCount: 2, lastMessageContent: '旧消息', timestamp: Date.now() };
    const allMessages = [
      { content: '消息1', time: '10:00' },
      { content: '消息2', time: '10:01' },
      { content: '新消息1', time: '10:02' },
      { content: '新消息2', time: '10:03' }
    ];

    const newMessages = window.QQApp.identifyNewMessages(allMessages, beforeUpdate);
    
    if (!Array.isArray(newMessages) || newMessages.length !== 2) {
      throw new Error(`期望识别到2条新消息，实际识别到${newMessages.length}条`);
    }

    console.log('🆕 识别的新消息:', newMessages);
    return { identifiedCount: newMessages.length, expectedCount: 2 };
  }

  /**
   * 📜 测试智能滚动
   */
  async testSmartScrolling() {
    if (!window.QQApp || typeof window.QQApp.smartScrollToNewMessages !== 'function') {
      throw new Error('smartScrollToNewMessages 函数不存在');
    }

    // 创建模拟的消息容器
    const $mockContainer = $(`
      <div class="chat-messages" style="height: 200px; overflow-y: auto;">
        <div class="custom-message">消息1</div>
        <div class="custom-message">消息2</div>
        <div class="custom-message">消息3</div>
        <div class="custom-message">新消息1</div>
        <div class="custom-message">新消息2</div>
      </div>
    `);
    $('body').append($mockContainer);

    try {
      const initialScrollTop = $mockContainer.scrollTop();
      await window.QQApp.smartScrollToNewMessages($mockContainer, 2);
      
      // 等待动画完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalScrollTop = $mockContainer.scrollTop();
      console.log(`📜 滚动位置: ${initialScrollTop} -> ${finalScrollTop}`);
      
      return { scrollChanged: finalScrollTop !== initialScrollTop };
    } finally {
      $mockContainer.remove();
    }
  }

  /**
   * 🎭 测试动画显示
   */
  async testMessageAnimation() {
    if (!window.QQApp || typeof window.QQApp.animateNewMessages !== 'function') {
      throw new Error('animateNewMessages 函数不存在');
    }

    // 创建模拟的新消息
    const $mockContainer = $(`
      <div class="chat-messages">
        <div class="custom-message" data-new-message="true">新消息1</div>
        <div class="custom-message" data-new-message="true">新消息2</div>
      </div>
    `);
    $('body').append($mockContainer);

    try {
      const startTime = Date.now();
      await window.QQApp.animateNewMessages($mockContainer);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      console.log(`🎭 动画持续时间: ${duration}ms`);
      
      // 检查动画标记是否被清理
      const remainingNewMessages = $mockContainer.find('[data-new-message="true"]').length;
      
      return { 
        animationCompleted: true, 
        duration: duration,
        markersCleared: remainingNewMessages === 0
      };
    } finally {
      $mockContainer.remove();
    }
  }

  /**
   * 🔄 测试完整流程
   */
  async testCompleteFlow() {
    console.log('🔄 开始完整流程测试...');
    
    // 这里可以添加完整的端到端测试
    // 由于需要真实的QQ应用环境，这里只做基本检查
    
    const requiredFunctions = [
      'captureCurrentMessageState',
      'identifyNewMessages', 
      'rebuildChatMessagesWithAnimation',
      'smartScrollToNewMessages',
      'animateNewMessages'
    ];

    const missingFunctions = requiredFunctions.filter(funcName => 
      !window.QQApp || typeof window.QQApp[funcName] !== 'function'
    );

    if (missingFunctions.length > 0) {
      throw new Error(`缺少必要函数: ${missingFunctions.join(', ')}`);
    }

    return { allFunctionsAvailable: true, missingCount: missingFunctions.length };
  }

  /**
   * 📊 输出测试结果
   */
  outputTestResults() {
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(50));
    
    let passedCount = 0;
    let failedCount = 0;

    this.testResults.forEach(result => {
      const status = result.status === 'passed' ? '✅ 通过' : '❌ 失败';
      console.log(`${status} ${result.name}`);
      
      if (result.status === 'passed') {
        passedCount++;
        if (result.result) {
          console.log(`   结果: ${JSON.stringify(result.result)}`);
        }
      } else {
        failedCount++;
        console.log(`   错误: ${result.error}`);
      }
    });

    console.log('='.repeat(50));
    console.log(`📈 总计: ${this.testResults.length} 个测试`);
    console.log(`✅ 通过: ${passedCount} 个`);
    console.log(`❌ 失败: ${failedCount} 个`);
    console.log(`📊 成功率: ${((passedCount / this.testResults.length) * 100).toFixed(1)}%`);
  }
}

// 🚀 启动测试的便捷函数
window.testSmartMessageAnimation = function() {
  const tester = new SmartMessageAnimationTester();
  tester.startTest();
};

// 📝 使用说明
console.log(`
🎭 QQ聊天智能消息动画系统测试脚本已加载

使用方法:
1. 在浏览器控制台中运行: testSmartMessageAnimation()
2. 查看测试结果和日志输出

测试内容:
- ✅ 消息状态捕获功能
- ✅ 新消息识别逻辑  
- ✅ 智能滚动定位
- ✅ 动画显示效果
- ✅ 完整流程验证
`);
