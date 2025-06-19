// 背包应用 - iPhone风格，集成到phone-shell系统
(function (window) {
  'use strict';

  const BackpackApp = {
    // 当前选中的分类
    selectedCategory: '全部',

    // 当前选中的状态标签（物品状态或类别）
    selectedTab: 'items', // 'items' 或 'used'

    // 所有物品数据
    allItems: [],

    // 已使用的物品记录
    usedItems: [],

    // 动态分析出的物品类别
    itemCategories: [],

    // 默认分类配置（用于映射和图标）
    defaultCategories: [
      { id: 'all', name: '全部', emoji: '📦' },
      { id: 'consumable', name: '消耗品', emoji: '🧪' },
      { id: 'equipment', name: '装备', emoji: '⚔️' },
      { id: 'material', name: '材料', emoji: '🔧' },
      { id: 'special', name: '特殊', emoji: '✨' },
      { id: 'food', name: '食物', emoji: '🍎' },
      { id: 'medicine', name: '药品', emoji: '💊' },
      { id: 'weapon', name: '武器', emoji: '🗡️' },
      { id: 'armor', name: '防具', emoji: '🛡️' },
      { id: 'tool', name: '工具', emoji: '🔨' },
      { id: 'gem', name: '宝石', emoji: '💎' },
      { id: 'scroll', name: '卷轴', emoji: '📜' },
      { id: 'potion', name: '药水', emoji: '🧪' },
      { id: 'book', name: '书籍', emoji: '📚' },
      { id: 'misc', name: '杂物', emoji: '📦' },
    ],

    // 初始化背包应用
    init: function () {
      this.createInterface();
      this.bindEvents();
      console.log('🎒 背包应用已初始化');
    },

    // 创建界面（在主手机界面内）
    createInterface: function () {
      console.log('🎒 创建背包应用界面（在主手机界面内）');

      // 检查主手机界面
      const $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) {
        console.error('❌ 主手机界面不存在，无法创建背包应用');
        return;
      }

      // 查找或创建背包应用容器
      let $backpackContainer = $phoneInterface.find('.backpack-app-container');
      if ($backpackContainer.length === 0) {
        $backpackContainer = $(`
                    <div class="backpack-app-container" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 30;">
                        <!-- 背包应用内容将在这里动态创建 -->
                    </div>
                `);
        $phoneInterface.append($backpackContainer);
      }

      this.bindEvents();
    },

    // 绑定事件
    bindEvents: function () {
      // 背包应用内部点击事件（防止冒泡到外部）
      $(document).on('click', '.backpack-app-container', function (e) {
        e.stopPropagation();
      });

      // 背包应用内容点击事件（防止冒泡）
      $(document).on('click', '.backpack-app', function (e) {
        e.stopPropagation();
      });

      // 背包物品卡片点击事件（防止冒泡）
      $(document).on('click', '.backpack-item-card', function (e) {
        e.stopPropagation();
      });

      // 背包分类标签点击事件（防止冒泡）
      $(document).on('click', '.backpack-category-tab', function (e) {
        e.stopPropagation();
      });

      // 背包按钮点击事件（防止冒泡）
      $(document).on('click', '.backpack-refresh-btn, .backpack-home-btn', function (e) {
        e.stopPropagation();
      });

      // 使用物品对话框点击事件（防止冒泡）
      $(document).on('click', '.backpack-use-dialog-content', function (e) {
        e.stopPropagation();
      });

      // 背包滚动区域点击事件（防止冒泡）
      $(document).on('click', '.backpack-items-container', function (e) {
        e.stopPropagation();
      });

      // 背包物品列表点击事件（防止冒泡）
      $(document).on('click', '.backpack-items-list', function (e) {
        e.stopPropagation();
      });

      // 背包头部区域点击事件（防止冒泡）
      $(document).on('click', '.backpack-header', function (e) {
        e.stopPropagation();
      });

      // 背包分类区域点击事件（防止冒泡）
      $(document).on('click', '.backpack-categories', function (e) {
        e.stopPropagation();
      });

      // 拖拽条相关事件（防止冒泡）
      $(document).on('click', '.backpack-category-scrollbar', function (e) {
        e.stopPropagation();
      });

      $(document).on('mousedown', '.backpack-category-scrollbar-thumb', function (e) {
        e.stopPropagation();
      });

      console.log('🎒 背包应用事件已绑定，防止内部点击冒泡');
    },

    // 显示背包应用
    show: async function () {
      const $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) {
        console.error('❌ 主手机界面不存在');
        return;
      }

      // 确保界面已创建
      if ($phoneInterface.find('.backpack-app-container').length === 0) {
        this.createInterface();
      }

      // 在手机界面内显示背包应用
      this.showInPhoneInterface();
    },

    // 在手机界面内显示背包应用
    showInPhoneInterface: function () {
      console.log('📱 在手机界面内显示背包应用');

      const $phoneInterface = $('#phone_interface');
      const $backpackContainer = $phoneInterface.find('.backpack-app-container');

      // 创建背包应用内容并添加到容器中
      const appContent = this.createBackpackHTML();
      $backpackContainer.html(appContent);

      // 显示背包应用容器，隐藏主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').hide();
      $phoneInterface
        .find('.qq-app-container, .taobao-app-container, .task-app-container, .wallpaper-app-container')
        .hide();
      $backpackContainer.show();

      // 渲染背包内容
      this.renderBackpackContent();
    },

    // 创建背包应用HTML结构
    createBackpackHTML: function () {
      return `
                <div class="backpack-app">
                    <!-- 头部区域 -->
                    <div class="backpack-header">
                        <div class="backpack-header-left">
                            <div class="backpack-header-indicator"></div>
                            <h1 class="backpack-header-title">背包</h1>
                        </div>
                        <div class="backpack-header-buttons">
                            <button class="backpack-refresh-btn" onclick="BackpackApp.refreshItems()">
                                <span>🔄</span>
                                <span>刷新物品</span>
                            </button>
                            <button class="backpack-home-btn" onclick="BackpackApp.goHome()">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
                                  <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- 状态标签页（物品/已使用） -->
                    <div class="backpack-status-tabs">
                        <button class="backpack-status-tab active" data-tab="items" onclick="BackpackApp.selectStatusTab('items')">
                            <span class="backpack-status-tab-emoji">📦</span>
                            <span>物品</span>
                        </button>
                        <button class="backpack-status-tab" data-tab="used" onclick="BackpackApp.selectStatusTab('used')">
                            <span class="backpack-status-tab-emoji">✅</span>
                            <span>已使用</span>
                        </button>
                    </div>

                    <!-- 分类标签（仅在物品标签页显示） -->
                    <div class="backpack-categories" id="backpack_categories_container">
                        <div class="backpack-category-tabs" id="backpack_category_tabs">
                            <!-- 分类标签将在数据加载后动态生成 -->
                        </div>
                        <!-- 分类标签拖拽条 -->
                        <div class="backpack-category-scrollbar" id="backpack_category_scrollbar">
                            <div class="backpack-category-scrollbar-thumb" id="backpack_category_scrollbar_thumb"></div>
                        </div>
                    </div>

                    <!-- 物品列表 -->
                    <div class="backpack-items-container">
                        <div class="backpack-items-list" id="backpack_items_list">
                            <!-- 物品将在这里动态加载 -->
                        </div>
                    </div>
                </div>
            `;
    },

    // 渲染背包内容
    renderBackpackContent: async function () {
      console.log('🔄 正在加载背包数据...');

      try {
        const items = await window['HQDataExtractor'].extractBackpackItems();
        console.log('🎒 提取到的物品数据:', items);

        // 存储所有物品数据
        this.allItems = items;

        // 分析已使用物品状态
        this.analyzeUsedItemsFromChat();

        // 分析物品类别
        this.analyzeItemCategories(items);

        // 重新生成分类标签
        this.updateCategoryTabs();

        // 渲染当前标签页内容
        this.renderCurrentTabContent();
      } catch (error) {
        console.error('❌ 加载背包数据时出错:', error);
        this.showErrorState();
      }
    },

    // 分析物品数据，提取物品类型（参考淘宝应用的实现）
    analyzeItemCategories: function (items) {
      const categories = new Set();
      items.forEach(item => {
        if (item.type) {
          // 清理和标准化类型名称
          const cleanType = item.type.trim();
          if (cleanType) {
            categories.add(cleanType);
          }
        }
      });
      this.itemCategories = Array.from(categories);
      console.log('🏷️ 分析出的物品类别:', this.itemCategories);
      return this.itemCategories;
    },

    // 分析聊天记录中的已使用物品（参考任务应用的实现）
    analyzeUsedItemsFromChat: function () {
      const usedItemsSet = new Set();

      try {
        // 获取SillyTavern上下文
        let chatMessages = [];

        // 尝试通过全局变量获取聊天消息
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
          const context = SillyTavern.getContext();
          if (context && context.chat) {
            chatMessages = context.chat;
          }
        }

        // 如果无法获取SillyTavern上下文，尝试其他方法
        if (chatMessages.length === 0 && window.HQDataExtractor && window.HQDataExtractor.getContext) {
          const context = window.HQDataExtractor.getContext();
          if (context && context.chat) {
            chatMessages = context.chat;
          }
        }

        console.log(`🔍 分析 ${chatMessages.length} 条聊天消息中的已使用物品...`);

        // 遍历聊天消息，查找物品使用记录
        chatMessages.forEach(message => {
          if (!message.mes) return;

          const messageText = message.mes;

          // 查找物品使用消息
          // 格式1：对xxx使用了xxx
          const useItemRegex1 = /对(.+?)使用了(.+?)(?:[。！!]|$)/g;
          let useMatch1;
          while ((useMatch1 = useItemRegex1.exec(messageText)) !== null) {
            const itemName = useMatch1[2].trim();
            if (itemName) {
              usedItemsSet.add(itemName);
              console.log(`📝 发现使用物品记录: ${itemName}`);
            }
          }

          // 格式2：使用了xxx
          const useItemRegex2 = /使用了(.+?)(?:[。！!]|$)/g;
          let useMatch2;
          while ((useMatch2 = useItemRegex2.exec(messageText)) !== null) {
            const itemName = useMatch2[1].trim();
            if (itemName) {
              usedItemsSet.add(itemName);
              console.log(`📝 发现使用物品记录: ${itemName}`);
            }
          }

          // 格式3：[物品使用|物品名称]
          const useItemRegex3 = /\[物品使用\|(.+?)\]/g;
          let useMatch3;
          while ((useMatch3 = useItemRegex3.exec(messageText)) !== null) {
            const itemName = useMatch3[1].trim();
            if (itemName) {
              usedItemsSet.add(itemName);
              console.log(`📝 发现物品使用标记: ${itemName}`);
            }
          }
        });

        // 将已使用物品转换为数组并存储
        this.usedItems = Array.from(usedItemsSet).map(itemName => {
          // 尝试从当前物品中找到对应的物品信息
          const originalItem = this.allItems.find(item => item.name === itemName);
          return {
            name: itemName,
            type: originalItem ? originalItem.type : '未知',
            description: originalItem ? originalItem.description : '已使用的物品',
            usedAt: new Date().toISOString(), // 记录使用时间
            originalItem: originalItem,
          };
        });

        console.log('✅ 已使用物品分析结果:', {
          usedItemNames: Array.from(usedItemsSet),
          usedItemsCount: this.usedItems.length,
        });
      } catch (error) {
        console.error('❌ 分析已使用物品时出错:', error);
        this.usedItems = [];
      }
    },

    // 更新分类标签页（参考淘宝应用的实现）
    updateCategoryTabs: function () {
      const $categoryTabs = $('#backpack_category_tabs');
      if ($categoryTabs.length === 0) return;

      // 生成分类标签，包括"全部"和实际的物品类别
      const categories = ['全部', ...this.itemCategories];
      const tabsHtml = categories
        .map((category, index) => {
          const isActive = category === this.selectedCategory ? 'active' : '';

          // 计算每个分类的物品数量（排除已使用的物品）
          const usedItemNames = new Set(this.usedItems.map(item => item.name));
          const availableItems = this.allItems.filter(item => !usedItemNames.has(item.name));
          const count =
            category === '全部' ? availableItems.length : availableItems.filter(item => item.type === category).length;

          // 获取分类的emoji图标
          const emoji = this.getCategoryEmoji(category);

          return `
            <div class="backpack-category-tab ${isActive}"
                 data-category="${category}"
                 onclick="BackpackApp.selectCategory('${category}')">
              <span>${emoji}</span>
              <span>${category}</span>
              <span class="backpack-category-count">${count}</span>
            </div>
          `;
        })
        .join('');

      $categoryTabs.html(tabsHtml);

      // 初始化拖拽条
      this.initCategoryScrollbar();
    },

    // 选择状态标签页
    selectStatusTab: function (tab) {
      console.log('📋 切换状态标签页:', tab);
      this.selectedTab = tab;

      // 更新标签页样式
      $('.backpack-status-tab').removeClass('active');
      $(`.backpack-status-tab[data-tab="${tab}"]`).addClass('active');

      // 显示/隐藏分类标签区域
      const $categoriesContainer = $('#backpack_categories_container');
      if (tab === 'items') {
        $categoriesContainer.removeClass('hidden');
      } else {
        $categoriesContainer.addClass('hidden');
      }

      // 渲染对应内容
      this.renderCurrentTabContent();
    },

    // 渲染当前标签页内容
    renderCurrentTabContent: function () {
      if (this.selectedTab === 'items') {
        // 渲染物品列表
        this.renderItemsList(this.allItems);
      } else if (this.selectedTab === 'used') {
        // 渲染已使用物品列表
        this.renderUsedItemsList();
      }
    },

    // 渲染已使用物品列表
    renderUsedItemsList: function () {
      const $itemsList = $('#backpack_items_list');
      $itemsList.empty();

      if (this.usedItems.length === 0) {
        $itemsList.html(`
          <div class="backpack-empty-state">
            <div class="backpack-empty-icon">✅</div>
            <div class="backpack-empty-title">暂无已使用物品</div>
            <div class="backpack-empty-description">您还没有使用过任何物品</div>
          </div>
        `);
        return;
      }

      // 渲染已使用物品卡片
      this.usedItems.forEach(item => {
        const $itemCard = this.createUsedItemCard(item);
        $itemsList.append($itemCard);
      });
    },

    // 创建已使用物品卡片
    createUsedItemCard: function (item) {
      const categoryClass = this.getCategoryClass(item.type);
      const categoryEmoji = this.getCategoryEmoji(item.type);
      const usedDate = new Date(item.lastUsedAt || item.usedAt).toLocaleDateString();
      const usedQuantity = item.usedQuantity || 1;

      const $itemCard = $(`
        <div class="backpack-item-card used-item-card">
          <div class="backpack-item-content">
            <div class="backpack-item-icon">
              ${categoryEmoji}
            </div>
            <div class="backpack-item-info">
              <div class="backpack-item-name">${item.name}</div>
              <div class="backpack-item-description">${item.description}</div>
              <div class="backpack-item-meta">
                <span class="backpack-item-category ${categoryClass}">${item.type}</span>
                <div class="backpack-item-used-info">
                  <div class="backpack-item-used-quantity">
                    <span>已使用:</span>
                    <span class="backpack-item-used-quantity-value">${usedQuantity}个</span>
                  </div>
                  <div class="backpack-item-used-date">
                    <span>最后使用:</span>
                    <span class="backpack-item-used-date-value">${usedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);

      return $itemCard;
    },

    // 初始化分类标签拖拽条（完全参考淘宝应用的真实实现）
    initCategoryScrollbar: function () {
      const $categoryTabs = $('#backpack_category_tabs');
      const $scrollbar = $('#backpack_category_scrollbar');
      const $thumb = $('#backpack_category_scrollbar_thumb');

      if ($categoryTabs.length === 0 || $scrollbar.length === 0 || $thumb.length === 0) {
        return;
      }

      // 更新滚动条显示（完全复制淘宝的逻辑）
      const updateScrollbar = () => {
        const tabsElement = $categoryTabs[0];
        const scrollWidth = tabsElement.scrollWidth;
        const clientWidth = tabsElement.clientWidth;

        if (scrollWidth <= clientWidth) {
          // 不需要滚动条
          $scrollbar.hide();
          return;
        }

        $scrollbar.show();

        // 计算thumb宽度和位置（使用百分比，和淘宝一样）
        const thumbWidthPercent = Math.max((clientWidth / scrollWidth) * 100, 8);
        const scrollPercent = tabsElement.scrollLeft / (scrollWidth - clientWidth);
        const thumbLeftPercent = scrollPercent * (100 - thumbWidthPercent);

        $thumb.css({
          width: thumbWidthPercent + '%',
          left: thumbLeftPercent + '%',
        });
      };

      // 监听分类标签滚动
      $categoryTabs.on('scroll', updateScrollbar);

      // 全新的拖拽逻辑 - 完全可控，无惯性（完全复制淘宝的实现）
      let isDragging = false;
      let lastClientX = 0;

      // 开始拖拽
      $thumb.on('mousedown touchstart', e => {
        isDragging = true;
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        lastClientX = clientX;

        // 禁用所有可能的动画和过渡
        $thumb.css({
          transition: 'none',
          animation: 'none',
        });
        $categoryTabs.css({
          'scroll-behavior': 'auto',
          transition: 'none',
        });

        e.preventDefault();
        e.stopPropagation();
      });

      // 拖拽中 - 直接映射鼠标位置（完全复制淘宝的实现）
      $(document).on('mousemove touchmove', e => {
        if (!isDragging) return;

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;

        // 获取滚动条的位置信息
        const scrollbarRect = $scrollbar[0].getBoundingClientRect();
        const scrollbarLeft = scrollbarRect.left;
        const scrollbarWidth = scrollbarRect.width;

        // 计算鼠标在滚动条中的相对位置（0-1）
        const relativePosition = Math.max(0, Math.min(1, (clientX - scrollbarLeft) / scrollbarWidth));

        // 直接根据鼠标位置设置滚动位置
        const tabsElement = $categoryTabs[0];
        const maxScrollLeft = tabsElement.scrollWidth - tabsElement.clientWidth;
        const targetScrollLeft = relativePosition * maxScrollLeft;

        // 立即设置滚动位置，无动画
        tabsElement.scrollLeft = targetScrollLeft;

        lastClientX = clientX;
        e.preventDefault();
        e.stopPropagation();
      });

      // 结束拖拽
      $(document).on('mouseup touchend', () => {
        if (isDragging) {
          isDragging = false;

          // 恢复平滑滚动（仅用于非拖拽时的滚动）
          setTimeout(() => {
            $thumb.css('transition', 'left 0.2s ease');
            $categoryTabs.css('scroll-behavior', 'smooth');
          }, 50);
        }
      });

      // 点击滚动条背景快速跳转
      $scrollbar.on('click', e => {
        if (e.target === $thumb[0] || isDragging) return;

        const scrollbarRect = $scrollbar[0].getBoundingClientRect();
        const clickX = e.clientX - scrollbarRect.left;
        const scrollbarWidth = scrollbarRect.width;

        const tabsElement = $categoryTabs[0];
        const maxScrollLeft = tabsElement.scrollWidth - tabsElement.clientWidth;
        const targetScrollLeft = (clickX / scrollbarWidth) * maxScrollLeft;

        // 平滑滚动到目标位置
        $categoryTabs.animate(
          {
            scrollLeft: targetScrollLeft,
          },
          200,
        );
      });

      // 处理拖拽时的选择防护
      $thumb.on('selectstart dragstart', e => {
        e.preventDefault();
        return false;
      });

      // 初始更新
      setTimeout(updateScrollbar, 100);

      // 监听窗口大小变化
      $(window).on('resize', updateScrollbar);
    },

    // 获取分类的emoji图标
    getCategoryEmoji: function (categoryName) {
      if (categoryName === '全部') return '📦';

      // 根据类型名称匹配合适的emoji
      const typeStr = categoryName.toLowerCase();

      // 精确匹配
      const exactMatch = this.defaultCategories.find(cat => cat.name === categoryName || cat.id === typeStr);
      if (exactMatch) return exactMatch.emoji;

      // 模糊匹配
      if (typeStr.includes('消耗') || typeStr.includes('consumable')) return '🧪';
      if (typeStr.includes('装备') || typeStr.includes('equipment')) return '⚔️';
      if (typeStr.includes('材料') || typeStr.includes('material')) return '🔧';
      if (typeStr.includes('特殊') || typeStr.includes('special')) return '✨';
      if (typeStr.includes('食物') || typeStr.includes('food')) return '🍎';
      if (typeStr.includes('药') || typeStr.includes('medicine') || typeStr.includes('potion')) return '💊';
      if (typeStr.includes('武器') || typeStr.includes('weapon') || typeStr.includes('剑') || typeStr.includes('刀'))
        return '🗡️';
      if (typeStr.includes('防具') || typeStr.includes('armor') || typeStr.includes('盾') || typeStr.includes('甲'))
        return '🛡️';
      if (typeStr.includes('工具') || typeStr.includes('tool')) return '🔨';
      if (typeStr.includes('宝石') || typeStr.includes('gem') || typeStr.includes('石')) return '💎';
      if (typeStr.includes('卷轴') || typeStr.includes('scroll')) return '📜';
      if (typeStr.includes('书') || typeStr.includes('book')) return '📚';

      // 默认图标
      return '📦';
    },

    // 渲染物品列表
    renderItemsList: function (items) {
      const $itemsList = $('#backpack_items_list');
      $itemsList.empty();

      // 过滤物品
      const filteredItems = this.filterItems(items);

      if (filteredItems.length === 0) {
        this.showEmptyState();
        return;
      }

      // 渲染物品卡片
      filteredItems.forEach(item => {
        const $itemCard = this.createItemCard(item);
        $itemsList.append($itemCard);
      });
    },

    // 过滤物品（根据实际的物品类型进行精确匹配，排除已使用的物品）
    filterItems: function (items) {
      // 获取已使用物品的名称集合
      const usedItemNames = new Set(this.usedItems.map(item => item.name));

      // 先过滤掉已使用的物品
      let availableItems = items.filter(item => !usedItemNames.has(item.name));

      // 再按分类过滤
      if (this.selectedCategory === '全部') {
        return availableItems;
      }

      // 直接按照物品的实际类型进行过滤
      return availableItems.filter(item => {
        return item.type === this.selectedCategory;
      });
    },

    // 创建物品卡片
    createItemCard: function (item) {
      const categoryClass = this.getCategoryClass(item.type);
      const categoryEmoji = this.getCategoryEmoji(item.type);

      const $itemCard = $(`
                <div class="backpack-item-card" data-item='${JSON.stringify(item)}'>
                    <div class="backpack-item-content">
                        <div class="backpack-item-icon">
                            ${categoryEmoji}
                        </div>
                        <div class="backpack-item-info">
                            <div class="backpack-item-name">${item.name}</div>
                            <div class="backpack-item-description">${item.description}</div>
                            <div class="backpack-item-meta">
                                <span class="backpack-item-category ${categoryClass}">${item.type}</span>
                                <div class="backpack-item-quantity">
                                    <span>数量:</span>
                                    <span class="backpack-item-quantity-value">${item.count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

      // 绑定点击事件
      $itemCard.on('click', () => {
        this.showUseItemPage(item);
      });

      return $itemCard;
    },

    // 获取分类样式类名
    getCategoryClass: function (type) {
      const typeStr = (type || '').toLowerCase();

      // 根据物品类型返回对应的CSS类名
      if (typeStr.includes('消耗') || typeStr.includes('consumable') || typeStr.includes('药')) return 'consumable';
      if (
        typeStr.includes('装备') ||
        typeStr.includes('equipment') ||
        typeStr.includes('武器') ||
        typeStr.includes('防具')
      )
        return 'equipment';
      if (typeStr.includes('材料') || typeStr.includes('material') || typeStr.includes('原料')) return 'material';
      if (typeStr.includes('特殊') || typeStr.includes('special') || typeStr.includes('稀有')) return 'special';
      if (typeStr.includes('食物') || typeStr.includes('food') || typeStr.includes('食品')) return 'food';

      // 根据具体的物品类型名称进行更精确的分类
      if (typeStr.includes('武器') || typeStr.includes('剑') || typeStr.includes('刀') || typeStr.includes('弓'))
        return 'equipment';
      if (typeStr.includes('防具') || typeStr.includes('盾') || typeStr.includes('甲') || typeStr.includes('护'))
        return 'equipment';
      if (typeStr.includes('药水') || typeStr.includes('药剂') || typeStr.includes('丹药')) return 'consumable';
      if (typeStr.includes('宝石') || typeStr.includes('水晶') || typeStr.includes('石头')) return 'material';
      if (typeStr.includes('卷轴') || typeStr.includes('书籍') || typeStr.includes('秘籍')) return 'special';

      // 默认分类
      return 'misc';
    },

    // 显示空状态
    showEmptyState: function () {
      const $itemsList = $('#backpack_items_list');
      $itemsList.html(`
                <div class="backpack-empty-state">
                    <div class="backpack-empty-icon">📦</div>
                    <div class="backpack-empty-title">暂无物品</div>
                    <div class="backpack-empty-description">该分类下暂时没有物品</div>
                </div>
            `);
    },

    // 显示错误状态
    showErrorState: function () {
      const $itemsList = $('#backpack_items_list');
      $itemsList.html(`
                <div class="backpack-empty-state">
                    <div class="backpack-empty-icon">❌</div>
                    <div class="backpack-empty-title">加载失败</div>
                    <div class="backpack-empty-description">无法加载背包数据，请稍后重试</div>
                </div>
            `);
    },

    // 选择分类
    selectCategory: function (categoryName) {
      console.log('🏷️ 选择分类:', categoryName);
      this.selectedCategory = categoryName;

      // 更新分类标签样式
      $('.backpack-category-tab').removeClass('active');
      $(`.backpack-category-tab[data-category="${categoryName}"]`).addClass('active');

      // 只重新渲染物品列表，不重新加载数据
      this.renderItemsList(this.allItems);
    },

    // 刷新物品
    refreshItems: function () {
      console.log('🔄 刷新背包物品...');
      this.renderBackpackContent();
    },

    // 返回主页
    goHome: function () {
      console.log('🏠 返回手机主页');

      // 1. 立即隐藏背包应用容器，不使用动画
      const $phoneInterface = $('#phone_interface');
      const $backpackContainer = $phoneInterface.find('.backpack-app-container');

      if ($backpackContainer.length > 0) {
        $backpackContainer.hide();
      }

      // 2. 移除背包应用模式
      $phoneInterface.removeClass('show-backpack-app-content');
      $('body').removeClass('backpack-app-mode');

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

    // 隐藏背包应用
    hide: function () {
      const $phoneInterface = $('#phone_interface');
      const $backpackContainer = $phoneInterface.find('.backpack-app-container');

      if ($backpackContainer.length > 0) {
        $backpackContainer.hide();
      }

      // 显示主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();
    },

    // 显示使用物品页面（集成在手机中）
    showUseItemPage: function (item) {
      console.log('📱 显示使用物品页面:', item.name);

      const $phoneInterface = $('#phone_interface');
      const $backpackContainer = $phoneInterface.find('.backpack-app-container');

      // 创建使用物品页面HTML
      const useItemPageHTML = this.createUseItemPageHTML(item);

      // 替换背包应用内容为使用物品页面
      $backpackContainer.html(useItemPageHTML);

      // 绑定使用物品页面事件
      this.bindUseItemPageEvents(item);
    },

    // 创建使用物品页面HTML
    createUseItemPageHTML: function (item) {
      const categoryClass = this.getCategoryClass(item.type);
      const categoryEmoji = this.getCategoryEmoji(item.type);

      return `
        <div class="backpack-app">
          <!-- 头部区域 -->
          <div class="backpack-header">
            <div class="backpack-header-left">
              <button class="backpack-back-btn" onclick="BackpackApp.goBackToBackpack()">
                <span>←</span>
                <span>返回</span>
              </button>
              <h1 class="backpack-header-title">使用物品</h1>
            </div>
            <div class="backpack-header-buttons">
              <button class="backpack-home-btn" onclick="BackpackApp.goHome()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 使用物品内容 -->
          <div class="backpack-use-item-page">
            <!-- 物品信息卡片 -->
            <div class="backpack-use-item-card">
              <div class="backpack-use-item-icon">
                ${categoryEmoji}
              </div>
              <div class="backpack-use-item-info">
                <h2 class="backpack-use-item-name">${item.name}</h2>
                <div class="backpack-use-item-meta">
                  <span class="backpack-item-category ${categoryClass}">${item.type}</span>
                  <span class="backpack-use-item-count">持有: <strong>${item.count}</strong></span>
                </div>
                <p class="backpack-use-item-description">${item.description}</p>
              </div>
            </div>

            <!-- 使用表单 -->
            <div class="backpack-use-item-form">
              <!-- 使用数量选择 -->
              <div class="backpack-use-item-quantity-section">
                <label class="backpack-use-item-label">使用数量</label>
                <div class="backpack-use-item-quantity-controls">
                  <button type="button" class="backpack-quantity-btn" id="decrease_quantity">-</button>
                  <input type="number" id="use_quantity_input" class="backpack-quantity-input"
                         value="1" min="1" max="${item.count}" readonly>
                  <button type="button" class="backpack-quantity-btn" id="increase_quantity">+</button>
                </div>
                <div class="backpack-use-item-hint">可用数量: ${item.count}</div>
              </div>

              <!-- 使用目标 -->
              <div class="backpack-use-item-target-section">
                <label class="backpack-use-item-label">使用目标及方法</label>
                <textarea
                  id="use_target_input"
                  class="backpack-use-item-textarea"
                  placeholder="请输入使用目标以及使用方法..."
                  maxlength="300"
                  rows="4"></textarea>
                <div class="backpack-use-item-hint">例如：对小明使用、对自己使用、对敌人使用等</div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="backpack-use-item-buttons">
              <button id="cancel_use_item" class="backpack-use-item-btn backpack-use-item-btn-cancel">
                <span>❌</span>
                <span>取消</span>
              </button>
              <button id="confirm_use_item" class="backpack-use-item-btn backpack-use-item-btn-confirm" disabled>
                <span>✅</span>
                <span>确认使用</span>
              </button>
            </div>
          </div>
        </div>
      `;
    },

    // 绑定使用物品页面事件
    bindUseItemPageEvents: function (item) {
      const self = this;

      // 自动聚焦到输入框
      setTimeout(() => {
        $('#use_target_input').focus();
      }, 100);

      // 绑定数量控制按钮事件
      $('#decrease_quantity')
        .off('click')
        .on('click', function () {
          const $quantityInput = $('#use_quantity_input');
          const currentValue = parseInt($quantityInput.val()) || 1;
          const minValue = parseInt($quantityInput.attr('min')) || 1;
          if (currentValue > minValue) {
            $quantityInput.val(currentValue - 1);
          }
        });

      $('#increase_quantity')
        .off('click')
        .on('click', function () {
          const $quantityInput = $('#use_quantity_input');
          const currentValue = parseInt($quantityInput.val()) || 1;
          const maxValue = parseInt($quantityInput.attr('max')) || item.count;
          if (currentValue < maxValue) {
            $quantityInput.val(currentValue + 1);
          }
        });

      // 绑定确认按钮事件
      $('#confirm_use_item')
        .off('click')
        .on('click', function () {
          const target = String($('#use_target_input').val() || '').trim();
          const quantity = parseInt($('#use_quantity_input').val()) || 1;

          if (target) {
            self.useItemWithQuantity(item, target, quantity);
            self.goBackToBackpack();
          } else {
            alert('请输入使用目标！');
          }
        });

      // 绑定取消按钮事件
      $('#cancel_use_item')
        .off('click')
        .on('click', function () {
          self.goBackToBackpack();
        });

      // 实时更新按钮状态
      $('#use_target_input')
        .off('input')
        .on('input', function () {
          const value = $(this).val().trim();
          const $confirmBtn = $('#confirm_use_item');
          if (value) {
            $confirmBtn.removeClass('disabled').prop('disabled', false);
          } else {
            $confirmBtn.addClass('disabled').prop('disabled', true);
          }
        });

      // 支持回车键确认（Ctrl+Enter）
      $('#use_target_input')
        .off('keydown')
        .on('keydown', function (e) {
          if (e.ctrlKey && e.which === 13) {
            // Ctrl+回车键
            $('#confirm_use_item').click();
          }
        });
    },

    // 返回背包主页面
    goBackToBackpack: function () {
      console.log('🔙 返回背包主页面');

      // 重新显示背包应用
      this.showInPhoneInterface();
    },

    // 显示使用物品对话框（保留原有方法作为备用）
    showUseItemDialog: function (item) {
      const categoryClass = this.getCategoryClass(item.type);
      const categoryName = item.type; // 直接使用物品类型名称

      const $dialog = $(`
                <div id="use_item_dialog" class="backpack-use-dialog">
                    <div class="backpack-use-dialog-content">
                        <h3 class="backpack-use-dialog-title">使用物品</h3>

                        <div class="backpack-use-dialog-item">
                            <div class="backpack-use-dialog-item-name">${item.name}</div>
                            <div class="backpack-use-dialog-item-meta">
                                <span class="backpack-item-category ${categoryClass}">${categoryName}</span>
                                <span>物品ID: ${item.id || 'N/A'}</span>
                                <span>持有: <strong>${item.count}</strong></span>
                            </div>
                            <div class="backpack-use-dialog-item-description">${item.description}</div>
                        </div>

                        <div class="backpack-use-dialog-form">
                            <label class="backpack-use-dialog-label">使用目标及方法</label>
                            <input type="text"
                                   id="use_target_input"
                                   class="backpack-use-dialog-input"
                                   placeholder="请输入使用目标以及使用方法"
                                   maxlength="300">
                            <div class="backpack-use-dialog-hint">例如：对小明使用、对自己使用、对敌人使用等</div>
                        </div>

                        <div class="backpack-use-dialog-buttons">
                            <button id="cancel_use_item" class="backpack-use-dialog-btn backpack-use-dialog-btn-cancel">
                                <span>❌</span>
                                <span>取消</span>
                            </button>
                            <button id="confirm_use_item" class="backpack-use-dialog-btn backpack-use-dialog-btn-confirm">
                                <span>✅</span>
                                <span>确认使用</span>
                            </button>
                        </div>
                    </div>
                </div>
            `);

      $('body').append($dialog);

      // 自动聚焦到输入框
      setTimeout(() => {
        $('#use_target_input').focus();
      }, 100);

      // 绑定按钮事件
      $('#confirm_use_item').on('click', () => {
        const target = String($('#use_target_input').val() || '').trim();
        if (target) {
          this.useItem(item, target);
          $dialog.remove();
        } else {
          alert('请输入使用目标！');
        }
      });

      $('#cancel_use_item').on('click', () => {
        $dialog.remove();
      });

      // 点击背景关闭对话框
      $dialog.on('click', function (e) {
        if (e.target === this) {
          $(this).remove();
        }
      });

      // 支持回车键确认
      $('#use_target_input').on('keypress', function (e) {
        if (e.which === 13) {
          // 回车键
          $('#confirm_use_item').click();
        }
      });

      // 实时更新按钮状态
      $('#use_target_input').on('input', function () {
        const value = $(this).val().trim();
        const $confirmBtn = $('#confirm_use_item');
        if (value) {
          $confirmBtn.removeClass('disabled').prop('disabled', false);
        } else {
          $confirmBtn.addClass('disabled').prop('disabled', true);
        }
      });

      // 初始状态设置按钮为禁用
      $('#confirm_use_item').addClass('disabled').prop('disabled', true);
    },

    // 使用指定数量的物品
    useItemWithQuantity: function (item, target, quantity) {
      console.log('正在使用物品:', item.name, '数量:', quantity, '目标:', target);

      const self = this;

      // 延迟执行，避免干扰正在进行的发送操作
      setTimeout(() => {
        try {
          // 检查聊天输入框是否空闲
          const $originalInput = $('#send_textarea');
          const $sendButton = $('#send_but');

          if ($originalInput.length > 0 && $sendButton.length > 0) {
            const isDisabled = $originalInput.prop('disabled');
            const currentValue = $originalInput.val() || '';

            if (!isDisabled && !$sendButton.hasClass('disabled') && currentValue === '') {
              // 构造消息文本，包含数量信息
              const quantityText = quantity > 1 ? `${quantity}个` : '';
              const message = `对${target}使用了${quantityText}${item.name}`;
              $originalInput.val(message);

              // 触发输入事件
              $originalInput.trigger('input');

              setTimeout(() => {
                if (!$sendButton.hasClass('disabled')) {
                  $sendButton.click();
                  console.log('物品使用消息已发送');
                }
              }, 200);

              // 处理物品数量变化
              self.processItemUsage(item, quantity);

              // 显示成功提示
              const quantityMsg = quantity > 1 ? `${quantity}个` : '';
              self.showSuccessMessage(`成功使用${quantityMsg}${item.name}`);
            } else {
              console.warn('聊天输入框不可用或正在忙碌中');
              alert('当前聊天输入框不可用，请稍后再试');
            }
          } else {
            console.warn('未找到聊天输入框元素');
            alert('未找到聊天输入框，请确保页面已正确加载');
          }
        } catch (error) {
          console.error('发送物品使用消息时出错：', error);
          alert('发送消息时出错，请手动发送');
        }
      }, 500);
    },

    // 使用物品并发送快捷回复（保留原方法作为兼容）
    useItem: function (item, target) {
      // 默认使用1个物品
      this.useItemWithQuantity(item, target, 1);
    },

    // 处理物品使用后的数量变化
    processItemUsage: function (item, usedQuantity) {
      console.log(`📦 处理物品使用: ${item.name}, 使用数量: ${usedQuantity}, 原有数量: ${item.count}`);

      // 减少物品数量
      const remainingCount = item.count - usedQuantity;

      if (remainingCount <= 0) {
        // 物品完全用完，移到已使用列表
        this.addToUsedItems(item, usedQuantity);
        console.log(`✅ 物品 "${item.name}" 已完全使用，移到已使用列表`);
      } else {
        // 物品还有剩余，更新数量并记录使用
        item.count = remainingCount;
        this.addToUsedItems(item, usedQuantity);
        console.log(`📝 物品 "${item.name}" 剩余数量: ${remainingCount}`);
      }

      // 刷新界面显示
      this.refreshCurrentView();
    },

    // 刷新当前视图
    refreshCurrentView: function () {
      if (this.selectedTab === 'items') {
        this.updateCategoryTabs();
        this.renderItemsList(this.allItems);
      } else if (this.selectedTab === 'used') {
        this.renderUsedItemsList();
      }
    },

    // 将物品添加到已使用列表
    addToUsedItems: function (item, usedQuantity = 1) {
      // 检查是否已经在已使用列表中
      const existingUsedItem = this.usedItems.find(usedItem => usedItem.name === item.name);

      if (existingUsedItem) {
        // 如果已存在，增加使用数量和更新使用时间
        existingUsedItem.usedQuantity = (existingUsedItem.usedQuantity || 1) + usedQuantity;
        existingUsedItem.lastUsedAt = new Date().toISOString();
        existingUsedItem.usageHistory = existingUsedItem.usageHistory || [];
        existingUsedItem.usageHistory.push({
          quantity: usedQuantity,
          usedAt: new Date().toISOString(),
        });
        console.log(`📝 更新已使用物品 "${item.name}" 数量: +${usedQuantity}, 总计: ${existingUsedItem.usedQuantity}`);
      } else {
        // 添加到已使用列表
        const usedItem = {
          name: item.name,
          type: item.type,
          description: item.description,
          usedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          usedQuantity: usedQuantity,
          originalItem: item,
          usageHistory: [
            {
              quantity: usedQuantity,
              usedAt: new Date().toISOString(),
            },
          ],
        };

        this.usedItems.push(usedItem);
        console.log(`✅ 物品 "${item.name}" 已添加到已使用列表，数量: ${usedQuantity}`);
      }
    },

    // 显示成功消息
    showSuccessMessage: function (message) {
      const $successMsg = $(`
                <div style="position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10010; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <i style="margin-right: 8px;">✓</i>${message}
                </div>
            `);

      $('body').append($successMsg);

      // 3秒后自动消失
      setTimeout(() => {
        $successMsg.fadeOut(300, function () {
          $(this).remove();
        });
      }, 3000);
    },

    // 显示背包应用 - 与手机界面系统兼容的方法
    show: async function () {
      console.log('🎒 显示背包应用（现代化版本）');

      const $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) {
        console.error('❌ 主手机界面不存在');
        return;
      }

      // 确保界面已创建
      if ($phoneInterface.find('.backpack-app-container').length === 0) {
        this.createInterface();
      }

      // 在手机界面内显示应用
      this.showInPhoneInterface();
    },

    // 隐藏背包应用
    hide: function () {
      console.log('🔒 隐藏背包应用');
      const $phoneInterface = $('#phone_interface');
      const $appContainer = $phoneInterface.find('.backpack-app-container');

      if ($appContainer.length > 0) {
        $appContainer.hide();
      }

      // 显示主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();
    },
  };

  // 导出到全局
  window['BackpackApp'] = BackpackApp;
})(window);
