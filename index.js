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
      'qq-app.css',
      'qq-avatar-editor.css',
      'taobao-app.css',
      'task-app.css',
      'backpack-app.css',
      'chouka-app.css',
      'wallpaper-app.css',
      'phone-interface.css',
    ];

    // 加载所有CSS文件（并行加载，失败不中断）
    console.log('开始加载CSS文件...');
    const cssPromises = cssFiles.map(file => loadCSS(`${basePath}/styles/${file}`));
    await Promise.all(cssPromises);
    console.log('所有CSS文件加载完成');

    // JS文件列表 - 确保qq-data-manager.js在qq-app.js之前加载
    const jsFiles = [
      'data-extractor.js',
      'qq-data-manager.js', // 添加QQDataManager，必须在qq-app.js之前
      'qq-avatar-editor.js', // 添加头像编辑器，必须在qq-app.js之前
      'qq-app.js',
      'taobao-app.js',
      'task-app.js',
      'backpack-app.js',
      'chouka-app.js',
      'wallpaper-app.js',
      'phone-interface.js',
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

        if (window['WallpaperApp']) {
          window['WallpaperApp'].init();
          console.log('美化应用初始化完成');
        }

        if (window['PhoneInterface']) {
          window['PhoneInterface'].init();
          console.log('手机界面初始化完成');
        }

        console.log('🎉 mobile-ui-test插件初始化完成！');
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
  if (window['WallpaperApp']) delete window['WallpaperApp'];
  if (window['PhoneInterface']) delete window['PhoneInterface'];
  if (window['HQDataExtractor']) delete window['HQDataExtractor'];

  // 移除UI元素
  $('#qq_interface').remove();
  $('#group_create_dialog').remove();
  $('#taobao_interface').remove();
  $('#wallpaper_interface').remove();
  $('#phone_interface').remove();

  console.log('mobile-ui-test插件已卸载');
}

// 等待DOM加载完成后初始化
jQuery(async () => {
  // 初始化扩展
  await init();

  console.log(`Extension "${MODULE_NAME}" 加载完成`);
});
