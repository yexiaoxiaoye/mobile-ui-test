// 群聊红包按钮隐藏功能
// 简单的JavaScript代码，用于在群聊时隐藏红包按钮

(function() {
    'use strict';
    
    // 隐藏群聊红包按钮的主要函数
    function hideRedpackInGroupChat() {
        console.log('🧧 正在设置群聊红包按钮隐藏功能...');
        
        // 方法1：使用CSS直接隐藏（最可靠的方式）
        function addCSSHide() {
            // 移除可能已存在的样式
            const existingStyle = document.getElementById('hide-group-redpack-style');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            const style = document.createElement('style');
            style.id = 'hide-group-redpack-style';
            style.textContent = `
                /* 群聊时隐藏红包按钮 - 多种选择器确保覆盖 */
                .chat-header.group ~ .chat-messages ~ .chat-input-area .menu-item[data-function="redpack"] {
                    display: none !important;
                }
                
                .chat-page .chat-header.group + .chat-messages + .chat-input-area .menu-item[data-function="redpack"] {
                    display: none !important;
                }
                
                .qq-group-wrapper .chat-page .menu-item[data-function="redpack"] {
                    display: none !important;
                }
                
                /* 确保群组聊天中红包按钮被隐藏 */
                .chat-header.group ~ * .menu-item[data-function="redpack"] {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
            console.log('✅ CSS隐藏规则已添加');
        }
        
        // 方法2：监听功能菜单按钮的点击事件（JavaScript方式）
        function addClickListener() {
            $(document).off('click.hideRedpack').on('click.hideRedpack', '.function-menu-btn', function() {
                console.log('🔍 检测到功能菜单按钮点击');
                
                const $menuBtn = $(this);
                const $chatPage = $menuBtn.closest('.chat-page');
                const $chatHeader = $chatPage.find('.chat-header');
                
                console.log('📍 找到的元素:', {
                    menuBtn: $menuBtn.length,
                    chatPage: $chatPage.length,
                    chatHeader: $chatHeader.length,
                    hasGroupClass: $chatHeader.hasClass('group')
                });
                
                // 延迟检查，确保菜单已显示
                setTimeout(() => {
                    const isGroupChat = $chatHeader.hasClass('group');
                    console.log('🏷️ 聊天类型检查:', isGroupChat ? '群聊' : '私聊');
                    
                    // 多种方式查找红包菜单项
                    let $redpackItem = $menuBtn.siblings('.function-menu').find('.menu-item[data-function="redpack"]');
                    
                    if ($redpackItem.length === 0) {
                        $redpackItem = $menuBtn.parent().find('.menu-item[data-function="redpack"]');
                    }
                    
                    if ($redpackItem.length === 0) {
                        $redpackItem = $chatPage.find('.menu-item[data-function="redpack"]');
                    }
                    
                    if ($redpackItem.length === 0) {
                        $redpackItem = $('.function-menu:visible .menu-item[data-function="redpack"]');
                    }
                    
                    console.log('🧧 找到红包菜单项:', $redpackItem.length);
                    
                    if ($redpackItem.length > 0) {
                        if (isGroupChat) {
                            $redpackItem.hide();
                            console.log('✅ 群聊状态：已通过JS隐藏红包按钮');
                        } else {
                            $redpackItem.show();
                            console.log('✅ 私聊状态：已通过JS显示红包按钮');
                        }
                    } else {
                        console.warn('⚠️ 未找到红包菜单项，请检查页面结构');
                        // 输出当前页面的菜单结构用于调试
                        console.log('当前菜单结构:', $('.function-menu').html());
                    }
                }, 150);
            });
            
            console.log('✅ 点击事件监听器已添加');
        }
        
        // 方法3：定期检查并隐藏（备用方案）
        function startPeriodicCheck() {
            setInterval(() => {
                $('.chat-header.group').each(function() {
                    const $groupHeader = $(this);
                    const $chatPage = $groupHeader.closest('.chat-page');
                    const $redpackItems = $chatPage.find('.menu-item[data-function="redpack"]');
                    
                    if ($redpackItems.length > 0 && $redpackItems.is(':visible')) {
                        $redpackItems.hide();
                        console.log('🔄 定期检查：隐藏了群聊中的红包按钮');
                    }
                });
            }, 2000);
            
            console.log('✅ 定期检查已启动');
        }
        
        // 启动所有保护方法
        addCSSHide();
        addClickListener();
        startPeriodicCheck();
        
        console.log('✅ 群聊红包按钮隐藏功能已启动（三重保护）');
    }
    
    // 等待jQuery和页面元素加载完成后启动
    function init() {
        if (typeof $ === 'undefined') {
            setTimeout(init, 500);
            return;
        }
        
        $(document).ready(function() {
            setTimeout(hideRedpackInGroupChat, 1000);
        });
    }
    
    // 开始初始化
    init();
    
})(); 