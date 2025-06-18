// 淘宝应用 - 现代化v0风格版本
(function (window) {
  'use strict';

  const TaobaoApp = {
    // ======== 保留所有现有数据和功能 ========
    // 购物车数据
    cart: [],

    // 商品数据缓存
    allProducts: [],
    productCategories: [],

    // 用户点数
    userPoints: 0,

    // 当前页面状态
    currentPage: 'products', // 'products' 或 'cart'

    // ======== 保留原有核心功能方法 ========

    // 发送消息到聊天框 - 从原始文件复制
    sendToChat: function (message) {
      try {
        console.log('尝试发送消息:', message);

        // 方法1: 直接使用DOM元素
        const originalInput = document.getElementById('send_textarea');
        const sendButton = document.getElementById('send_but');

        console.log('输入框元素:', originalInput);
        console.log('发送按钮元素:', sendButton);

        if (!originalInput) {
          console.error('找不到输入框元素 send_textarea');
          // 尝试备用方案
          this.sendToChatBackup(message);
          return;
        }

        if (!sendButton) {
          console.error('找不到发送按钮元素 send_but');
          // 尝试备用方案
          this.sendToChatBackup(message);
          return;
        }

        // 检查输入框是否可用
        if (
          (originalInput instanceof HTMLInputElement || originalInput instanceof HTMLTextAreaElement) &&
          originalInput.disabled
        ) {
          console.warn('输入框被禁用');
          return;
        }

        // 检查发送按钮是否可用
        if ($(sendButton).hasClass('disabled')) {
          console.warn('发送按钮被禁用');
          return;
        }

        // 设置值（处理input和textarea两种类型）
        if (originalInput instanceof HTMLInputElement || originalInput instanceof HTMLTextAreaElement) {
          originalInput.value = message;
          console.log('已设置输入框值:', originalInput.value);

          // 触发输入事件
          originalInput.dispatchEvent(new Event('input', { bubbles: true }));
          originalInput.dispatchEvent(new Event('change', { bubbles: true }));

          console.log('已触发输入事件');

          // 延迟点击发送按钮
          setTimeout(() => {
            console.log('准备点击发送按钮');
            sendButton.click();
            console.log('已点击发送按钮');
          }, 300);
        } else {
          console.error('输入框不是有效的输入元素类型:', originalInput.tagName);
          // 尝试备用方案
          this.sendToChatBackup(message);
        }
      } catch (error) {
        console.error('发送消息时出错:', error);
        // 尝试备用方案
        this.sendToChatBackup(message);
      }
    },

    // 备用发送方法 - 从原始文件复制
    sendToChatBackup: function (message) {
      try {
        console.log('尝试备用发送方法:', message);

        // 尝试查找其他可能的输入框
        const textareas = document.querySelectorAll('textarea');
        const inputs = document.querySelectorAll('input[type="text"]');

        console.log('找到的textarea元素:', textareas.length);
        console.log('找到的text input元素:', inputs.length);

        // 尝试使用SillyTavern全局API（如果可用）
        if (typeof window.sillyTavern !== 'undefined') {
          console.log('找到SillyTavern全局对象');
          // 这里可以尝试使用SillyTavern的API
        }

        // 最后的尝试：直接模拟用户输入
        if (textareas.length > 0) {
          const textarea = textareas[0];
          console.log('尝试使用第一个textarea元素');
          textarea.value = message;
          textarea.focus();

          // 模拟键盘事件
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
      } catch (error) {
        console.error('备用发送方法也失败了:', error);
      }
    },

    // 初始化淘宝应用 - 保持不变
    init: async function () {
      this.loadCart();
      await this.calculateUserPoints();
      this.createInterface();
      this.bindEvents();
      console.log('淘宝应用已初始化');
    },

    // 加载购物车数据 - 保持不变
    loadCart: function () {
      const savedCart = localStorage.getItem('taobao_cart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
      }
    },

    // 计算用户点数 - 保持不变
    calculateUserPoints: async function () {
      try {
        if (window['HQDataExtractor'] && typeof window['HQDataExtractor'].extractTaobaoExpenses === 'function') {
          const expenses = await window['HQDataExtractor'].extractTaobaoExpenses();
          this.userPoints = expenses.reduce((total, expense) => total + expense.amount, 0);
          console.log('用户点数已更新:', this.userPoints);
          this.updatePointsDisplay();
        } else {
          console.warn('HQDataExtractor 不可用，无法计算用户点数');
          this.userPoints = 1000; // 默认点数
          this.updatePointsDisplay();
        }
      } catch (error) {
        console.error('计算用户点数时出错:', error);
        this.userPoints = 1000; // 默认点数
        this.updatePointsDisplay();
      }
    },

    // 更新点数显示
    updatePointsDisplay: function () {
      const $userPoints = $('#user_points');
      if ($userPoints.length > 0) {
        $userPoints.text(this.userPoints);
      }
    },

    // 刷新商品数据 - 保持原本的后端逻辑
    refreshProducts: function () {
      this.sendToChat('{{停止角色扮演}}刷新商品');
      alert('刷新商品请求已发送！');
    },

    // 刷新点数数据 - 保持原本的后端逻辑
    refreshPoints: async function () {
      await this.calculateUserPoints();
      alert('点数已刷新！');
    },

    // 初始化分类滚动条
    initCategoryScrollbar: function () {
      const $categoryTabs = $('#category_tabs');
      const $scrollbar = $('#category_scrollbar');
      const $thumb = $('#category_scrollbar_thumb');

      if ($categoryTabs.length === 0 || $scrollbar.length === 0 || $thumb.length === 0) {
        return;
      }

      // 更新滚动条显示
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

        // 计算thumb宽度和位置
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

      // 全新的拖拽逻辑 - 完全可控，无惯性
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

      // 拖拽中 - 直接映射鼠标位置
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

        // 立即设置滚动位置，无任何延迟或动画
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

    // 分析商品数据，提取商品类型 - 保持不变
    analyzeProducts: function (products) {
      const categories = new Set();
      products.forEach(product => {
        if (product.type) {
          categories.add(product.type);
        }
      });
      this.productCategories = Array.from(categories);
      return this.productCategories;
    },

    // 根据类型筛选商品 - 保持不变
    getProductsByCategory: function (category) {
      if (category === '全部') {
        return this.allProducts;
      }
      return this.allProducts.filter(product => product.type === category);
    },

    // ======== 新的现代化界面方法 ========

    // 创建淘宝应用界面（在主手机界面内）
    createInterface: function () {
      console.log('🛒 创建淘宝应用界面（在主手机界面内）');

      // 检查主手机界面
      const $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) {
        console.error('❌ 主手机界面不存在，无法创建淘宝应用');
        return;
      }

      // 查找或创建淘宝应用容器
      let $appContainer = $phoneInterface.find('.taobao-app-container');
      if ($appContainer.length === 0) {
        $appContainer = $(`
                    <div class="taobao-app-container" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 30;">
                        <!-- 淘宝应用内容将在这里动态创建 -->
                </div>
                `);
        $phoneInterface.append($appContainer);
      }

      this.bindEvents();
    },

    // 在手机界面内显示淘宝应用
    showInPhoneInterface: function () {
      console.log('📱 在手机界面内显示淘宝应用');

      const $phoneInterface = $('#phone_interface');
      const $appContainer = $phoneInterface.find('.taobao-app-container');

      // 创建应用内容并添加到容器中
      const appContent = this.createAppHTML();
      $appContainer.html(appContent);

      // 显示应用容器，隐藏主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').hide();
      $phoneInterface.find('.qq-app-container').hide(); // 隐藏其他应用
      $phoneInterface.find('.wallpaper-app-container').hide();
      $appContainer.show();

      // 初始加载数据并渲染
      this.loadAndRenderData();
    },

    // 创建现代化应用HTML结构
    createAppHTML: function () {
      return `
                                <!-- 应用头部 -->
                <div class="taobao-header">
                    <div class="header-left">
                        <h1 class="app-title">淘宝</h1>
                        <div class="points-display" id="points_display">
                            点数: <span id="user_points">0</span>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="header-btn refresh-products-btn" onclick="TaobaoApp.refreshProducts()" title="刷新商品">
                            <i class="fas fa-box"></i>
                        </button>
                        <button class="header-btn refresh-points-btn" onclick="TaobaoApp.refreshPoints()" title="刷新点数">
                            <i class="fas fa-coins"></i>
                        </button>
                        <button class="header-btn cart-btn" onclick="TaobaoApp.showCartPage()" title="购物车">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="cart-badge" id="cart_badge_count" style="display: none;"></span>
                        </button>
                        <button class="header-btn search-btn" onclick="TaobaoApp.toggleSearch()" title="搜索商品">
                            <i class="fas fa-search"></i>
                        </button>
                        <button class="header-btn taobao-home-btn" onclick="TaobaoApp.goHome()" title="返回手机首页">
                            ${window.UNIFIED_BUTTON_ICONS ? window.UNIFIED_BUTTON_ICONS.HOME : '🏠'}
                        </button>
                    </div>
                </div>

                <!-- 商品页面 -->
                <div class="taobao-products-page" id="products_page">
                    <!-- 分类标签容器 -->
                    <div class="taobao-category-container">
                        <!-- 搜索栏（默认隐藏）-->
                        <div class="taobao-search-container" id="search_container" style="display: none;">
                            <div class="search-input-wrapper">
                                <input type="text" id="product_search" placeholder="搜索商品..." class="search-input">
                                <button class="search-close-btn" onclick="TaobaoApp.toggleSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- 分类标签 -->
                        <div class="taobao-category-tabs" id="category_tabs">
                            <!-- 动态生成分类标签 -->
                        </div>
                        <!-- 分类滚动条 -->
                        <div class="category-scrollbar" id="category_scrollbar">
                            <div class="category-scrollbar-thumb" id="category_scrollbar_thumb"></div>
                        </div>
                    </div>

                    <!-- 商品网格 -->
                    <div class="taobao-product-grid" id="product_grid">
                        <!-- 动态生成商品卡片 -->
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <p>正在加载商品...</p>
                        </div>
                    </div>
                </div>

                <!-- 购物车页面 -->
                <div class="taobao-cart-page" id="cart_page" style="display: none;">
                                        <!-- 购物车头部 -->
                    <div class="cart-header">
                        <button class="back-btn" onclick="TaobaoApp.showProductsPage()">
                            <i class="fas fa-arrow-left"></i>
                            返回
                        </button>
                        <h2 style="margin: 0; font-size: 18px;">购物车</h2>
                        <button class="header-btn taobao-home-btn" onclick="TaobaoApp.goHome()" title="返回手机首页">
                            ${window.UNIFIED_BUTTON_ICONS ? window.UNIFIED_BUTTON_ICONS.HOME : '🏠'}
                        </button>
                    </div>

                    <!-- 购物车内容 -->
                    <div class="cart-content" id="cart_content">
                        <!-- 动态生成购物车内容 -->
                    </div>

                    <!-- 购物车底部 -->
                    <div class="cart-footer" id="cart_footer" style="display: none;">
                        <div class="cart-total">
                                <div>
                                <div class="total-amount" id="total_amount">¥0.00</div>
                                <div class="points-info" id="points_info">需要点数: 0 | 当前点数: 0</div>
                                </div>
                        </div>
                        <button class="checkout-btn" id="checkout_btn" onclick="TaobaoApp.checkout()">
                            立即结算
                        </button>
                            </div>
                        </div>
                    `;
    },

    // 加载并渲染数据
    loadAndRenderData: async function () {
      try {
        console.log('🔄 开始加载淘宝数据...');

        // 显示加载状态
        $('#product_grid').html(`
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>正在加载商品...</p>
                    </div>
                `);

        // 使用数据提取器获取商品数据
        const products = await window['HQDataExtractor'].extractProducts();
        console.log('📦 获取到商品数据:', products.length, '件');

        this.allProducts = products;
        this.analyzeProducts(products);

        // 渲染分类标签
        this.renderCategoryTabs();

        // 渲染商品列表
        this.renderProductGrid(products);

        // 绑定事件
        this.bindProductEvents();

        // 更新购物车显示
        this.updateCartBadge();

        // 刷新统一按钮样式
        if (window.UnifiedButtons) {
          setTimeout(() => {
            window.UnifiedButtons.refresh();
          }, 200);
        }

        console.log('✅ 淘宝数据加载完成');
      } catch (error) {
        console.error('❌ 加载淘宝数据时出错:', error);
        $('#product_grid').html(`
                    <div style="text-align: center; padding: 40px; color: #6b7280; grid-column: 1 / -1;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <h3 style="margin: 0 0 8px 0;">加载失败</h3>
                        <p style="margin: 0 0 16px 0;">无法获取商品数据</p>
                        <button onclick="TaobaoApp.loadAndRenderData()" style="background: #f97316; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">重试</button>
                    </div>
                `);
      }
    },

    // 渲染分类标签页
    renderCategoryTabs: function () {
      const categories = ['全部', ...this.productCategories];
      const categoryTabsHtml = categories
        .map((category, index) => {
          const isActive = index === 0;
          const activeClass = isActive ? 'active' : '';

          // 计算每个分类的商品数量
          const count =
            category === '全部' ? this.allProducts.length : this.allProducts.filter(p => p.type === category).length;

          // 分类emoji映射
          const categoryEmojis = {
            全部: '🛍️',
            数码: '📱',
            服装: '👗',
            美妆: '💄',
            食品: '🍎',
            家居: '🏠',
            图书: '📚',
            运动: '⚽',
            玩具: '🧸',
            汽车: '🚗',
          };

          const emoji = categoryEmojis[category] || '🏷️';

          return `
                    <div class="category-tab ${activeClass}" data-category="${category}">
                        <span>${emoji}</span>
                        <span>${category}</span>
                        <span class="category-count">${count}</span>
                                </div>
                `;
        })
        .join('');

      $('#category_tabs').html(categoryTabsHtml);

      // 初始化分类滚动条
      this.initCategoryScrollbar();
    },

    // 渲染商品网格
    renderProductGrid: function (products) {
      if (products.length === 0) {
        $('#product_grid').html(`
                    <div class="no-results">
                        <div class="no-results-icon">🛍️</div>
                        <h3>暂无商品</h3>
                        <p>请稍后再试或联系客服</p>
                            </div>
                `);
        return;
      }

      const productsHtml = products
        .map((product, index) => {
          // 检查是否有原价（用于显示折扣）
          const hasOriginalPrice =
            product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);

          return `
                    <div class="taobao-product-card" data-category="${product.type}" data-name="${String(
            product.name,
          ).toLowerCase()}" data-description="${String(product.describe).toLowerCase()}">
                        <!-- 左侧商品描述区域 -->
                        <div class="product-description-area">
                            <div class="product-description-text">${product.describe}</div>
                            </div>
                            
                        <!-- 右侧商品信息区域 -->
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-full-description">${product.describe}</p>
                            <div class="product-type">${product.type}</div>
                            <div class="product-price-section">
                                <span class="product-price">${product.price}</span>
                                ${
                                  hasOriginalPrice
                                    ? `<span class="product-original-price">${product.originalPrice}</span>`
                                    : ''
                                }
                                    </div>
                            <button class="add-to-cart-btn" onclick="TaobaoApp.addToCart(${index})">
                                加入购物车
                            </button>
                                    </div>
                                </div>
                `;
        })
        .join('');

      $('#product_grid').html(`<div class="taobao-product-list">${productsHtml}</div>`);
    },

    // 绑定商品相关事件
    bindProductEvents: function () {
      // 搜索功能
      $('#product_search')
        .off('input')
        .on('input', e => {
          const searchTerm = $(e.target).val().toLowerCase();
          this.searchProducts(searchTerm);
        });

      // 分类标签点击
      $('.category-tab')
        .off('click')
        .on('click', e => {
          const $tab = $(e.currentTarget);
          const category = $tab.data('category');

          // 更新标签状态
          $('.category-tab').removeClass('active');
          $tab.addClass('active');

          // 筛选商品
          this.filterProductsByCategory(category);
        });
    },

    // 搜索商品 - 保持原有逻辑
    searchProducts: function (searchTerm) {
      const $products = $('.taobao-product-card');
      let visibleCount = 0;

      if (searchTerm === '') {
        // 如果搜索框为空，恢复分类筛选状态
        const activeCategory = $('.category-tab.active').data('category') || '全部';
        this.filterProductsByCategory(activeCategory);
        return;
      }

      $products.each(function () {
        const $this = $(this);
        const name = String($this.data('name') || '').toLowerCase();
        const description = String($this.data('description') || '').toLowerCase();
        const category = String($this.data('category') || '').toLowerCase();

        if (name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
          $this.show();
          visibleCount++;
        } else {
          $this.hide();
        }
      });

      // 显示搜索结果提示
      if (visibleCount === 0) {
        $('#product_grid').append(`
                    <div class="no-results search-no-results">
                        <div class="no-results-icon">🔍</div>
                        <h3>没有找到相关商品</h3>
                        <p>请尝试其他关键词</p>
                            </div>
                        `);
      } else {
        $('.search-no-results').remove();
      }
    },

    // 根据分类筛选商品 - 保持原有逻辑并增强动画
    filterProductsByCategory: function (category) {
      const $products = $('.taobao-product-card');
      $('.search-no-results').remove();

      if (category === '全部') {
        $products.show();
      } else {
        $products.each(function () {
          const $this = $(this);
          const productCategory = $this.data('category');
          if (productCategory === category) {
            $this.show();
          } else {
            $this.hide();
          }
        });
      }
    },

    // 添加到购物车 - 保持原有逻辑
    addToCart: function (productIndex) {
      const product = this.allProducts[productIndex];
      if (!product) {
        console.error('商品不存在:', productIndex);
        return;
      }

      // 检查购物车中是否已存在该商品
      const existingItem = this.cart.find(item => item.name === product.name);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.cart.push({
          name: product.name,
          type: product.type,
          describe: product.describe,
          price: product.price,
          quantity: 1,
        });
      }

      // 保存购物车
      this.saveCart();

      // 更新购物车徽章
      this.updateCartBadge();

      // 显示成功提示
      this.showAddToCartSuccess(product.name);

      console.log('商品已添加到购物车:', product.name);
    },

    // 保存购物车到本地存储 - 保持不变
    saveCart: function () {
      localStorage.setItem('taobao_cart', JSON.stringify(this.cart));
    },

    // 更新购物车徽章
    updateCartBadge: function () {
      const totalItems = this.getCartItemCount();
      const $badge = $('#cart_badge_count');

      if (totalItems > 0) {
        $badge.text(totalItems).show();
      } else {
        $badge.hide();
      }
    },

    // 获取购物车商品总数 - 保持不变
    getCartItemCount: function () {
      return this.cart.reduce((total, item) => total + item.quantity, 0);
    },

    // 获取购物车总价 - 保持不变
    getCartTotal: function () {
      return this.cart.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
    },

    // 显示购物车页面
    showCartPage: function () {
      this.currentPage = 'cart';
      $('#products_page').hide();
      $('#cart_page').show();
      this.renderCartContent();
    },

    // 显示商品页面
    showProductsPage: function () {
      this.currentPage = 'products';
      $('#cart_page').hide();
      $('#products_page').show();
    },

    // 渲染购物车内容
    renderCartContent: function () {
      const $cartContent = $('#cart_content');
      const $cartFooter = $('#cart_footer');

      if (this.cart.length === 0) {
        $cartContent.html(`
                    <div class="cart-empty">
                        <div class="cart-empty-icon">🛒</div>
                        <h3>购物车是空的</h3>
                        <p>快去挑选心仪的商品吧</p>
                        <button class="go-shopping-btn" onclick="TaobaoApp.showProductsPage()">
                            去购物
                        </button>
                    </div>
                `);
        $cartFooter.hide();
        return;
      }

      // 渲染购物车商品
      const cartItemsHtml = this.cart
        .map((item, index) => {
          const totalPrice = (parseFloat(item.price) * item.quantity).toFixed(2);
          return `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            ${item.describe.substring(0, 20)}...
                                </div>
                        <div class="cart-item-info">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <p class="cart-item-type">${item.type}</p>
                            <div class="cart-item-price">¥${item.price}</div>
                            <div class="cart-item-controls">
                                <div class="quantity-controls">
                                    <button class="quantity-btn" onclick="TaobaoApp.updateQuantity('${item.name}', ${
            item.quantity - 1
          })">-</button>
                                    <span class="quantity-display">${item.quantity}</span>
                                    <button class="quantity-btn" onclick="TaobaoApp.updateQuantity('${item.name}', ${
            item.quantity + 1
          })">+</button>
                                    </div>
                                <button class="remove-btn" onclick="TaobaoApp.removeFromCart('${item.name}')">
                                    移除
                                </button>
                                    </div>
                                </div>
                            </div>
                `;
        })
        .join('');

      $cartContent.html(cartItemsHtml);

      // 显示并更新底部信息
      this.updateCartFooter();
      $cartFooter.show();
    },

    // 更新购物车底部信息
    updateCartFooter: function () {
      const total = this.getCartTotal();
      const pointsNeeded = Math.ceil(total);
      const hasEnoughPoints = this.userPoints >= pointsNeeded;

      $('#total_amount').text(`¥${total.toFixed(2)}`);
      $('#points_info').html(`
                    需要点数: ${pointsNeeded} | 当前点数: ${this.userPoints}
                <span style="color: ${hasEnoughPoints ? '#10b981' : '#dc2626'};">
                    ${hasEnoughPoints ? '✓ 点数充足' : '✗ 点数不足'}
                </span>
            `);

      const $checkoutBtn = $('#checkout_btn');
      if (hasEnoughPoints) {
        $checkoutBtn.prop('disabled', false).text('立即结算');
      } else {
        $checkoutBtn.prop('disabled', true).text('点数不足');
      }
    },

    // 更新商品数量 - 保持原有逻辑
    updateQuantity: function (productName, newQuantity) {
      if (newQuantity <= 0) {
        this.removeFromCart(productName);
        return;
      }

      const item = this.cart.find(item => item.name === productName);
      if (item) {
        item.quantity = newQuantity;
        this.saveCart();
        this.renderCartContent();
        this.updateCartBadge();
      }
    },

    // 从购物车移除商品 - 保持原有逻辑
    removeFromCart: function (productName) {
      this.cart = this.cart.filter(item => item.name !== productName);
      this.saveCart();
      this.renderCartContent();
      this.updateCartBadge();
    },

    // 清空购物车 - 保持不变
    clearCart: function () {
      this.cart = [];
      this.saveCart();
      this.updateCartBadge();
    },

    // 结算功能 - 保持原有逻辑
    checkout: function () {
      if (this.cart.length === 0) {
        alert('购物车是空的，无法结算！');
        return;
      }

      const total = this.getCartTotal();
      const itemCount = this.getCartItemCount();
      const pointsNeeded = Math.ceil(total);

      // 检查点数是否足够
      if (this.userPoints < pointsNeeded) {
        alert(
          `点数不足！\n需要点数: ${pointsNeeded}\n当前点数: ${this.userPoints}\n缺少点数: ${
            pointsNeeded - this.userPoints
          }\n\n请先获取更多点数再进行购买。`,
        );
        return;
      }

      if (
        confirm(
          `确定要结算吗？\n商品数量: ${itemCount}件\n总金额: ¥${total.toFixed(
            2,
          )}\n需要点数: ${pointsNeeded}\n剩余点数: ${this.userPoints - pointsNeeded}`,
        )
      ) {
        // 构建购物车内容文本
        let cartContent = '我购买了以下商品：\n';

        // 添加购物车商品信息 - 使用参考.js的格式
        this.cart.forEach(item => {
          cartContent += `[背包物品|物品名称:${item.name}|物品类型:${item.type}|物品数量:${item.quantity}|物品描述:${
            item.describe
          }] 花费总计${(parseFloat(item.price) * item.quantity).toFixed(2)}点数\n`;
        });

        // 添加总计和消耗点数
        cartContent += `\n[总计|${total.toFixed(2)}] [消耗点数|${pointsNeeded}]`;

        // 将购物车内容发送到聊天框
        this.sendToChat(cartContent);

        // 更新用户点数（本地减少，实际点数会在重新计算时更新）
        this.userPoints -= pointsNeeded;
        this.updatePointsDisplay();

        // 清空购物车
        this.clearCart();

        // 跳转到商品页面
        this.showProductsPage();

        alert(`结算完成！\n消耗点数: ${pointsNeeded}\n剩余点数: ${this.userPoints}\n\n购买信息已发送到聊天记录中`);
      }
    },

    // 显示添加到购物车成功提示
    showAddToCartSuccess: function (productName) {
      const $toast = $(`
                <div class="add-to-cart-toast">
                    <i class="fas fa-check-circle"></i>
                    ${productName} 已添加到购物车！
                </div>
            `);

      $('body').append($toast);

      setTimeout(() => {
        $toast.fadeOut(300, function () {
          $(this).remove();
        });
      }, 2000);
    },

    // 更新点数显示
    updatePointsDisplay: function () {
      // 如果有点数显示元素，更新它
      $('.points-info').each(function () {
        const $this = $(this);
        const text = $this.text();
        if (text.includes('当前点数:')) {
          $this.html(text.replace(/当前点数:\s*\d+/, `当前点数: ${TaobaoApp.userPoints}`));
        }
      });
    },

    // 刷新数据
    refreshData: async function () {
      console.log('🔄 刷新淘宝数据...');
      await this.calculateUserPoints();
      await this.loadAndRenderData();
    },

    // 返回主页
    goHome: function () {
      console.log('🏠 返回手机主页');

      // 立即隐藏淘宝应用，不使用动画
      const $phoneInterface = $('#phone_interface');
      const $appContainer = $phoneInterface.find('.taobao-app-container');

      if ($appContainer.length > 0) {
        $appContainer.hide();
      }

      // 移除淘宝应用模式
      $phoneInterface.removeClass('show-taobao-app-content');
      $('body').removeClass('taobao-app-mode');

      // 显示主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();

      // 确保手机界面处于正确的显示状态，但不触发动画
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

    // ======== 主要入口方法 ========

    // 显示淘宝应用 - 新的集成方式
    show: async function () {
      console.log('🛒 显示淘宝应用（现代化版本）');

      const $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) {
        console.error('❌ 主手机界面不存在');
        return;
      }

      // 确保界面已创建
      if ($phoneInterface.find('.taobao-app-container').length === 0) {
        this.createInterface();
      }

      // 在手机界面内显示应用
      this.showInPhoneInterface();
    },

    // 隐藏淘宝应用
    hide: function () {
      console.log('🔒 隐藏淘宝应用');
      const $phoneInterface = $('#phone_interface');
      const $appContainer = $phoneInterface.find('.taobao-app-container');

      if ($appContainer.length > 0) {
        $appContainer.hide();
      }

      // 显示主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();
    },

    // 绑定全局事件
    bindEvents: function () {
      // 这里可以绑定一些全局事件，如果需要的话
      console.log('📱 淘宝应用事件绑定完成');
    },

    // 切换搜索栏的显示状态
    toggleSearch: function () {
      const $searchContainer = $('#search_container');
      const $categoryTabs = $('#category_tabs');
      const $scrollbar = $('#category_scrollbar');

      if ($searchContainer.css('display') === 'none') {
        // 显示搜索栏，隐藏分类标签
        $searchContainer.show();
        $categoryTabs.hide();
        $scrollbar.hide();
        // 聚焦到搜索框
        setTimeout(() => {
          $('#product_search').focus();
        }, 100);
      } else {
        // 隐藏搜索栏，显示分类标签
        $searchContainer.hide();
        $categoryTabs.show();
        $scrollbar.show();
        // 清空搜索并显示所有商品
        $('#product_search').val('');
        this.renderProductGrid(this.allProducts);
      }
    },
  };

  // 导出到全局
  window.TaobaoApp = TaobaoApp;
})(window);
