// 快速修复测试脚本
// 在浏览器控制台中运行此脚本

console.log('🔧 开始快速修复测试...');

// 检查依赖
function checkDependencies() {
    console.log('📋 检查依赖项...');
    
    const checks = {
        jQuery: typeof $ !== 'undefined',
        PhoneShell: typeof window.PhoneShell !== 'undefined',
        PhoneInterface: typeof window.PhoneInterface !== 'undefined',
        QQApp: typeof window.QQApp !== 'undefined'
    };
    
    console.log('依赖检查结果:', checks);
    
    if (!checks.jQuery) {
        console.error('❌ jQuery 未加载');
        return false;
    }
    
    if (!checks.PhoneShell) {
        console.error('❌ PhoneShell 未加载');
        return false;
    }
    
    if (!checks.PhoneInterface) {
        console.error('❌ PhoneInterface 未加载');
        return false;
    }
    
    console.log('✅ 所有依赖项检查通过');
    return true;
}

// 手动创建手机按键
function createPhoneButton() {
    console.log('🔧 手动创建手机按键...');
    
    // 移除可能存在的旧按键
    $('#chat_history_btn').remove();
    
    // 创建手机按键
    const $phoneButton = $(`
        <div id="chat_history_btn" class="mobile-btn">
            <span style="color: white; font-size: 20px;">📱</span>
        </div>
    `);
    
    // 添加点击事件
    $phoneButton.on('click', function(e) {
        e.stopPropagation();
        console.log('📱 手机按键被点击！');
        
        if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
            window.PhoneInterface.show();
            console.log('✅ 手机界面已打开');
        } else {
            console.error('❌ PhoneInterface.show 方法不可用');
        }
    });
    
    // 查找发送表单
    const $sendForm = $('#send_form');
    const $rightSendForm = $sendForm.find('#rightSendForm');
    
    if ($sendForm.length > 0 && $rightSendForm.length > 0) {
        $rightSendForm.before($phoneButton);
        console.log('✅ 手机按键已添加到发送表单');
    } else {
        // 如果找不到发送表单，添加到body的右下角
        $phoneButton.css({
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            'z-index': '9999'
        });
        $('body').append($phoneButton);
        console.log('⚠️ 发送表单未找到，按键已添加到右下角');
    }
    
    // 验证按键
    setTimeout(() => {
        const $addedButton = $('#chat_history_btn');
        if ($addedButton.length > 0 && $addedButton.is(':visible')) {
            console.log('✅ 手机按键创建成功并可见');
            return true;
        } else {
            console.error('❌ 手机按键创建失败或不可见');
            return false;
        }
    }, 100);
}

// 初始化 PhoneShell 系统
function initPhoneShell() {
    console.log('🏗️ 初始化 PhoneShell 系统...');
    
    if (window.PhoneShell && typeof window.PhoneShell.init === 'function') {
        try {
            window.PhoneShell.init();
            console.log('✅ PhoneShell 系统初始化成功');
            return true;
        } catch (error) {
            console.error('❌ PhoneShell 系统初始化失败:', error);
            return false;
        }
    } else {
        console.error('❌ PhoneShell.init 方法不可用');
        return false;
    }
}

// 初始化 PhoneInterface
function initPhoneInterface() {
    console.log('📱 初始化 PhoneInterface...');
    
    if (window.PhoneInterface && typeof window.PhoneInterface.init === 'function') {
        try {
            window.PhoneInterface.init();
            console.log('✅ PhoneInterface 初始化成功');
            return true;
        } catch (error) {
            console.error('❌ PhoneInterface 初始化失败:', error);
            return false;
        }
    } else {
        console.error('❌ PhoneInterface.init 方法不可用');
        return false;
    }
}

// 完整修复流程
function fullFix() {
    console.log('🚀 开始完整修复流程...');
    
    // 1. 检查依赖
    if (!checkDependencies()) {
        console.error('❌ 依赖检查失败，无法继续修复');
        return false;
    }
    
    // 2. 初始化 PhoneShell
    if (!initPhoneShell()) {
        console.error('❌ PhoneShell 初始化失败，无法继续修复');
        return false;
    }
    
    // 3. 初始化 PhoneInterface
    if (!initPhoneInterface()) {
        console.error('❌ PhoneInterface 初始化失败，尝试手动创建按键');
        createPhoneButton();
        return false;
    }
    
    // 4. 验证按键是否存在
    setTimeout(() => {
        const $button = $('#chat_history_btn');
        if ($button.length > 0 && $button.is(':visible')) {
            console.log('🎉 修复成功！手机按键已正常工作');
        } else {
            console.log('⚠️ 自动修复未完成，尝试手动创建按键');
            createPhoneButton();
        }
    }, 1000);
    
    return true;
}

// 导出函数到全局
window.quickFixTest = {
    checkDependencies,
    createPhoneButton,
    initPhoneShell,
    initPhoneInterface,
    fullFix
};

// 自动运行修复
console.log('🚀 自动运行修复流程...');
fullFix();

console.log('\n💡 可用的修复命令:');
console.log('quickFixTest.checkDependencies() - 检查依赖');
console.log('quickFixTest.createPhoneButton() - 手动创建按键');
console.log('quickFixTest.initPhoneShell() - 初始化 PhoneShell');
console.log('quickFixTest.initPhoneInterface() - 初始化 PhoneInterface');
console.log('quickFixTest.fullFix() - 完整修复流程');
