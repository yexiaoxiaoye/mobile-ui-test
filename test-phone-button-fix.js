// 手机按键修复测试脚本
// 在浏览器控制台中运行此脚本来测试手机按键是否正常工作

console.log('🔧 开始测试手机按键修复...');

// 测试函数
function testPhoneButtonFix() {
    const results = {
        phoneShellLoaded: false,
        phoneInterfaceLoaded: false,
        buttonExists: false,
        buttonVisible: false,
        buttonClickable: false,
        initializationOrder: [],
        errors: []
    };

    try {
        // 1. 检查 PhoneShell 系统
        if (typeof window.PhoneShell !== 'undefined') {
            results.phoneShellLoaded = true;
            results.initializationOrder.push('PhoneShell ✅');
            console.log('✅ PhoneShell 系统已加载');
        } else {
            results.errors.push('PhoneShell 系统未加载');
            console.error('❌ PhoneShell 系统未加载');
        }

        // 2. 检查 PhoneInterface
        if (typeof window.PhoneInterface !== 'undefined') {
            results.phoneInterfaceLoaded = true;
            results.initializationOrder.push('PhoneInterface ✅');
            console.log('✅ PhoneInterface 已加载');
        } else {
            results.errors.push('PhoneInterface 未加载');
            console.error('❌ PhoneInterface 未加载');
        }

        // 3. 检查手机按键是否存在
        const $button = $('#chat_history_btn');
        if ($button.length > 0) {
            results.buttonExists = true;
            console.log('✅ 手机按键元素存在');

            // 4. 检查按键是否可见
            if ($button.is(':visible')) {
                results.buttonVisible = true;
                console.log('✅ 手机按键可见');
            } else {
                results.errors.push('手机按键不可见');
                console.error('❌ 手机按键不可见');
                console.log('按键样式:', $button.css(['display', 'visibility', 'opacity']));
            }

            // 5. 测试按键点击功能
            try {
                // 模拟点击事件
                $button.trigger('click');
                results.buttonClickable = true;
                console.log('✅ 手机按键可点击');
            } catch (error) {
                results.errors.push('手机按键点击测试失败: ' + error.message);
                console.error('❌ 手机按键点击测试失败:', error);
            }
        } else {
            results.errors.push('手机按键元素不存在');
            console.error('❌ 手机按键元素不存在');
        }

        // 6. 检查发送表单
        const $sendForm = $('#send_form');
        const $rightSendForm = $('#rightSendForm');
        
        if ($sendForm.length > 0) {
            console.log('✅ 发送表单存在');
            if ($rightSendForm.length > 0) {
                console.log('✅ rightSendForm 存在');
            } else {
                results.errors.push('rightSendForm 不存在');
                console.error('❌ rightSendForm 不存在');
            }
        } else {
            results.errors.push('发送表单不存在');
            console.error('❌ 发送表单不存在');
        }

    } catch (error) {
        results.errors.push('测试过程中发生错误: ' + error.message);
        console.error('❌ 测试过程中发生错误:', error);
    }

    // 输出测试结果
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(50));
    console.log(`PhoneShell 加载: ${results.phoneShellLoaded ? '✅' : '❌'}`);
    console.log(`PhoneInterface 加载: ${results.phoneInterfaceLoaded ? '✅' : '❌'}`);
    console.log(`按键存在: ${results.buttonExists ? '✅' : '❌'}`);
    console.log(`按键可见: ${results.buttonVisible ? '✅' : '❌'}`);
    console.log(`按键可点击: ${results.buttonClickable ? '✅' : '❌'}`);
    console.log(`初始化顺序: ${results.initializationOrder.join(' → ')}`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ 发现的问题:');
        results.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    } else {
        console.log('\n🎉 所有测试通过！手机按键工作正常！');
    }

    return results;
}

// 手动修复函数
function manualFixPhoneButton() {
    console.log('🔧 尝试手动修复手机按键...');
    
    try {
        // 移除可能存在的旧按键
        $('#chat_history_btn').remove();
        
        // 手动初始化 PhoneInterface
        if (window.PhoneInterface) {
            window.PhoneInterface.init();
            console.log('✅ 手动初始化 PhoneInterface 完成');
            
            // 等待一段时间后检查
            setTimeout(() => {
                const $button = $('#chat_history_btn');
                if ($button.length > 0) {
                    console.log('✅ 手动修复成功！手机按键已创建');
                    
                    // 强制显示按键
                    $button.show().css({
                        'display': 'flex !important',
                        'visibility': 'visible !important',
                        'opacity': '1 !important'
                    });
                    
                    console.log('✅ 手机按键已强制显示');
                } else {
                    console.error('❌ 手动修复失败，按键仍未创建');
                }
            }, 1000);
        } else {
            console.error('❌ PhoneInterface 未加载，无法手动修复');
        }
    } catch (error) {
        console.error('❌ 手动修复过程中发生错误:', error);
    }
}

// 强制重新加载所有组件
function forceReloadComponents() {
    console.log('🔄 强制重新加载所有组件...');
    
    try {
        // 清理现有元素
        $('#chat_history_btn').remove();
        $('#phone_interface').remove();
        
        // 重新初始化
        if (window.PhoneInterface) {
            window.PhoneInterface.init();
            console.log('✅ PhoneInterface 重新初始化完成');
        }
        
        if (window.QQApp) {
            // 不重新初始化 QQApp，避免冲突
            console.log('⚠️ 跳过 QQApp 重新初始化，避免冲突');
        }
        
        setTimeout(() => {
            testPhoneButtonFix();
        }, 2000);
        
    } catch (error) {
        console.error('❌ 强制重新加载过程中发生错误:', error);
    }
}

// 导出测试函数到全局
window.testPhoneButtonFix = testPhoneButtonFix;
window.manualFixPhoneButton = manualFixPhoneButton;
window.forceReloadComponents = forceReloadComponents;

// 自动运行测试
console.log('🚀 自动运行测试...');
setTimeout(() => {
    testPhoneButtonFix();
    
    console.log('\n💡 可用的修复命令:');
    console.log('testPhoneButtonFix() - 重新运行测试');
    console.log('manualFixPhoneButton() - 手动修复按键');
    console.log('forceReloadComponents() - 强制重新加载组件');
}, 2000);
