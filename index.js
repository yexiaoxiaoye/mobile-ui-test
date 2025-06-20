// SillyTavern Extension: mobile-ui-test
// 外置手机扩展 - 提供QQ消息应用等功能

// 扩展模块名称 - SillyTavern要求的标准格式
const MODULE_NAME = 'mobile-ui-test';

// 扩展配置
const extensionFolderPath = `scripts/extensions/third-party/${MODULE_NAME}`;

// 动态加载脚本的函数
function loadScript(src) {
  return new Promise((resolve, reject) => {
    console.log('正在加载脚本:', src);
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      console.log('脚本加载成功:', src);
      resolve();
    };
    script.onerror = error => {
      console.error('脚本加载失败:', src, error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

// 动态加载CSS的函数
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    console.log('正在加载CSS:', href);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    link.onload = () => {
      console.log('CSS加载成功:', href);
      resolve();
    };
    link.onerror = error => {
      console.error('CSS加载失败:', href, error);
      // 不要因为CSS加载失败而中断整个流程
      resolve();
    };
    document.head.appendChild(link);
  });
}

// 初始化扩展
async function init() {
  console.log('正在初始化mobile-ui-test插件...');

  try {
    const basePath = `/${extensionFolderPath}`;
    console.log('使用基础路径:', basePath);

    // CSS文件列表
    const cssFiles = [
      'main.css',
      'phone-shell.css', // 🔥 添加 phone-shell CSS（优先级最高）
      'qq-app.css',
      'qq-avatar-editor.css',
      'taobao-app.css',
      'task-app.css',
      'backpack-app.css',
      'chouka-app.css',
      'wallpaper-app.css',
      'phone-interface.css',
      'qq-friends-statusbar.css',
      'qq-emoji.css',
      'qq-photo.css',
      'qq-voice.css',
      'qq-sticker.css',
      'qq-redpack.css', // 🌟 新增：红包消息样式
      'game-app.css', // 🎮 新增：游戏应用样式
    ];

    // 加载统一按钮CSS
    const unifiedButtonsCSS = `${basePath}/image/unified-buttons.css`;
    await loadCSS(unifiedButtonsCSS);

    // 加载所有CSS文件（并行加载，失败不中断）
    console.log('开始加载CSS文件...');
    const cssPromises = cssFiles.map(file => loadCSS(`${basePath}/styles/${file}`));
    await Promise.all(cssPromises);
    console.log('所有CSS文件加载完成');

    // JS文件列表 - 确保加载顺序正确
    const jsFiles = [
      'phone-shell.js', // 🔥 phone-shell 系统（最高优先级）
      'data-extractor.js',
      'qq-data-manager.js', // 添加QQDataManager，必须在qq-app.js之前
      'qq-avatar-editor.js', // 添加头像编辑器，必须在qq-app.js之前
      'context-watcher.js', // 🌟 智能上下文监听器（替代旧的auto-refresh-manager）
      'context-watcher-test.js', // 🔧 智能监听器测试脚本
      'message-structure-unifier.js', // 🌟 消息结构统一工具
      'qq-emoji.js',
      'qq-photo.js',
      'qq-voice.js',
      'qq-sticker.js',
      'image-preview.js',
      'qq-app.js',
      'hide-redpack-in-group.js', // 🧧 群聊红包按钮隐藏功能
      'taobao-app.js',
      'task-app.js',
      'backpack-app.js',
      'chouka-app.js',
      'wallpaper-app.js',
      'phone-interface.js',
      'qq-friends-statusbar.js',
      'qq-redpack.js',
    ];

    // 按顺序加载所有JS模块
    console.log('开始加载JS模块...');
    for (const file of jsFiles) {
      try {
        await loadScript(`${basePath}/apps/${file}`);
      } catch (error) {
        console.warn(`模块 ${file} 加载失败，继续加载其他模块:`, error);
      }
    }
    console.log('所有JS模块加载完成');

    // 加载统一按钮JS
    try {
      await loadScript(`${basePath}/image/unified-buttons.js`);
      console.log('统一按钮管理器加载完成');
    } catch (error) {
      console.warn('统一按钮管理器加载失败:', error);
    }

    // 等待jQuery加载
    if (typeof $ === 'undefined') {
      console.log('等待jQuery加载...');
      await new Promise(resolve => {
        const checkJQuery = () => {
          if (typeof $ !== 'undefined') {
            console.log('jQuery已加载');
            resolve();
          } else {
            setTimeout(checkJQuery, 100);
          }
        };
        checkJQuery();
      });
    }

    // 初始化所有应用
    setTimeout(() => {
      try {
        console.log('开始初始化应用模块...');

        if (window['HQDataExtractor']) {
          console.log('数据提取器初始化完成');
        }

        if (window['QQDataManager']) {
          console.log('QQ数据管理器初始化完成');
        }

        if (window['QQAvatarEditor']) {
          console.log('QQ头像编辑器初始化完成');
        }

        // 🔥 重要：只初始化手机按钮，不显示手机界面
        if (window['PhoneInterface']) {
          window['PhoneInterface'].initButtonOnly();
          console.log('✅ 手机按钮初始化完成（界面默认隐藏）');
        }

        // 然后初始化其他应用
        if (window['QQApp']) {
          window['QQApp'].init();
          console.log('QQ应用初始化完成');
        }

        if (window['TaobaoApp']) {
          window['TaobaoApp'].init();
          console.log('淘宝应用初始化完成');
        }

        if (window['TaskApp']) {
          window['TaskApp'].init();
          console.log('任务应用初始化完成');
        }

        if (window['BackpackApp']) {
          window['BackpackApp'].init();
          console.log('背包应用初始化完成');
        }

        if (window['ChoukaApp']) {
          window['ChoukaApp'].init();
          console.log('抽卡应用初始化完成');
        }

        if (window['GameApp']) {
          window['GameApp'].init();
          console.log('🎮 游戏应用初始化完成');
        }

        if (window['WallpaperApp']) {
          window['WallpaperApp'].init();
          console.log('美化应用初始化完成');
        }

        if (window['QQFriendsStatusbar']) {
          window['QQFriendsStatusbar'].init();
          console.log('QQ好友状态栏应用初始化完成');
        }

        if (window['QQEmojiManager']) {
          window['QQEmojiManager'].init();
          console.log('QQ表情包功能初始化完成');
        }

        if (window['QQPhoto']) {
          console.log('QQ照片功能已加载');
        }

        if (window['QQVoice']) {
          console.log('QQ语音功能已加载');
        }

        if (window['QQSticker']) {
          console.log('QQ表情包功能已加载');
        }

        if (window['ImagePreview']) {
          console.log('图片预览功能已加载并自动启动');
        }

        if (window['ContextWatcher']) {
          console.log('✅ 智能上下文监听器已自动初始化，已替代传统的自动刷新管理器');
        }

        if (window['MessageStructureUnifier']) {
          console.log('✅ 消息结构统一工具已加载');
        }
                
                console.log('🎉 mobile-ui-test插件初始化完成！');
                
                // 🔧 添加调试功能
                window['debugMobileUI'] = function() {
                    console.log('='.repeat(50));
                    console.log('🔧 Mobile UI 完整诊断开始');
                    console.log('='.repeat(50));
                    
                    // 1. 检查基础环境
                    console.log('\n📋 1. 基础环境检查:');
                    console.log('jQuery:', !!window['$'] ? '✅' : '❌');
                    console.log('HQDataExtractor:', !!window['HQDataExtractor'] ? '✅' : '❌');
                    console.log('AutoRefreshManager:', !!window['AutoRefreshManager'] ? '✅' : '❌');
                    
                    // 2. 检查应用
                    console.log('\n🎯 2. 应用检查:');
                    const apps = ['QQApp', 'TaobaoApp', 'TaskApp', 'BackpackApp', 'ChoukaApp', 'GameApp', 'PhoneInterface'];
                    apps.forEach(appName => {
                        const app = window[appName];
                        console.log(`  ${appName}:`, !!app ? '✅ 存在' : '❌ 不存在');
                        if (app) {
                            const methods = ['init', 'show', 'hide'];
                            methods.forEach(method => {
                                if (typeof app[method] === 'function') {
                                    console.log(`    └─ ${method}(): ✅`);
                                }
                            });
                            // 检查特殊方法
                            if (appName === 'TaskApp' && typeof app['loadTasks'] === 'function') {
                                console.log('    └─ loadTasks(): ✅');
                            }
                            if (appName === 'TaobaoApp' && typeof app['loadProducts'] === 'function') {
                                console.log('    └─ loadProducts(): ✅');
                            }
                            if (appName === 'QQApp' && typeof app['loadMessages'] === 'function') {
                                console.log('    └─ loadMessages(): ✅');
                            }
                        }
                    });
                    
                    // 3. 检查AutoRefreshManager
                    if (window['AutoRefreshManager']) {
                        console.log('\n🔄 3. AutoRefreshManager检查:');
                        const manager = window['AutoRefreshManager'];
                        console.log('  状态:', manager.isEnabled ? '✅ 已启用' : '❌ 未启用');
                        console.log('  刷新间隔:', manager.refreshInterval, 'ms');
                        console.log('  刷新次数:', manager.refreshCount || 0);
                        
                        const methods = ['init', 'start', 'stop', 'refreshAllApps'];
                        methods.forEach(method => {
                            console.log(`  ${method}():`, typeof manager[method] === 'function' ? '✅' : '❌');
                        });
                        
                        // 检查控制面板
                        const $ = window['$'];
                        if ($) {
                            console.log('  控制面板:', $('#auto-refresh-panel').length > 0 ? '✅ 存在' : '❌ 不存在');
                        }
                    }
                    
                    console.log('\n='.repeat(50));
                    console.log('🔧 诊断完成');
                    console.log('='.repeat(50));
                };
                
                // 🧪 添加测试功能
                window['testAutoRefresh'] = function() {
                    console.log('🧪 测试自动刷新功能...');
                    
                    if (!window['AutoRefreshManager']) {
                        console.error('❌ AutoRefreshManager不存在');
                        return;
                    }
                    
                    const manager = window['AutoRefreshManager'];
                    
                    try {
                        // 测试初始化
                        console.log('🔄 测试初始化...');
                        manager.init();
                        console.log('✅ 初始化成功');
                        
                        // 测试手动刷新
                        setTimeout(() => {
                            console.log('🔄 测试手动刷新...');
                            manager.refreshAllApps();
                            console.log('✅ 手动刷新成功');
                        }, 1000);
                        
                        // 测试启动自动刷新
                        setTimeout(() => {
                            console.log('▶️ 测试启动自动刷新...');
                            manager.start();
                            console.log('✅ 自动刷新已启动');
                            
                            // 5秒后停止
                            setTimeout(() => {
                                console.log('⏹️ 停止自动刷新...');
                                manager.stop();
                                console.log('✅ 自动刷新已停止');
                            }, 5000);
                        }, 2000);
                        
                    } catch (error) {
                        console.error('❌ 测试失败:', error);
                    }
                };
                
                // 🔧 输出调试信息
                setTimeout(() => {
                    console.log('\n🛠️ 调试功能已就绪!');
                    console.log('💡 可用的调试命令:');
                    console.log('  - debugMobileUI() : 完整诊断');
                    console.log('  - testAutoRefresh() : 测试自动刷新');
                    console.log('  - AutoRefreshManager.init() : 手动初始化自动刷新');
                    console.log('  - AutoRefreshManager.start() : 启动自动刷新');
                    console.log('  - AutoRefreshManager.stop() : 停止自动刷新');
                    
                    // 自动运行诊断
                    console.log('\n🔍 运行自动诊断...');
                    window['debugMobileUI']();
                }, 500);
                
            } catch (error) {
                console.error('初始化应用时出错:', error);
            }
        }, 1000);
        
    } catch (error) {
        console.error('加载mobile-ui-test插件模块时出错:', error);
    }
}

// 卸载扩展
function unload() {
  console.log('正在卸载mobile-ui-test插件...');

  // 清理全局变量
  if (window['QQApp']) delete window['QQApp'];
  if (window['QQDataManager']) delete window['QQDataManager'];
  if (window['QQAvatarEditor']) delete window['QQAvatarEditor'];
  if (window['TaobaoApp']) delete window['TaobaoApp'];
  if (window['TaskApp']) delete window['TaskApp'];
  if (window['BackpackApp']) delete window['BackpackApp'];
  if (window['ChoukaApp']) delete window['ChoukaApp'];
  if (window['GameApp']) delete window['GameApp'];
  if (window['WallpaperApp']) delete window['WallpaperApp'];
  if (window['PhoneInterface']) delete window['PhoneInterface'];
  if (window['HQDataExtractor']) delete window['HQDataExtractor'];
  if (window['QQFriendsStatusbar']) delete window['QQFriendsStatusbar'];
  if (window['QQEmojiManager']) {
    window['QQEmojiManager'].destroy();
    delete window['QQEmojiManager'];
  }
  if (window['QQPhoto']) delete window['QQPhoto'];

  // 移除UI元素
  $('#qq_interface').remove();
  $('#group_create_dialog').remove();
  $('#taobao_interface').remove();
  $('#wallpaper_interface').remove();
  $('#game_interface').remove();
  $('#phone_interface').remove();
  $('#qq_friends_statusbar').remove();
  $('#qq_friends_interface').remove();
  $('#friend_details_dialog').remove();
  $('.qq-emoji-picker').remove();
  $('#emoji-preview').remove();
  $('.emoji-picker-btn').remove();

  console.log('mobile-ui-test插件已卸载');
}

// 等待DOM加载完成后初始化
jQuery(async () => {
  // 初始化扩展
  await init();

  console.log(`Extension "${MODULE_NAME}" 加载完成`);
});
