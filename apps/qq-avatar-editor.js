// QQ头像编辑器模块
(function (window) {
  'use strict';

  const QQAvatarEditor = {
    // 当前编辑状态
    currentEditTarget: null, // 'user' | 'contact'
    currentContactInfo: null, // {qqNumber, contactName}

    // 编辑器状态
    editorState: {
      avatarUrl: '',
      imagePosition: { x: 0, y: 0 },
      imageScale: 100,
      imageRotation: 0,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      history: [],
      historyIndex: -1,
    },

    // 初始化编辑器
    init() {
      console.log('🎨 QQ头像编辑器初始化...');

      // 只绑定事件，界面按需创建
      this.bindEvents();
      console.log('✅ QQ头像编辑器初始化完成');
    },

    // 创建编辑器界面
    createEditorInterface() {
      const $editorPage = $(`
        <div class="qq-avatar-editor-page" style="display: none;">
          <!-- 状态栏 -->
          <div class="qq-status-bar">
            <div class="qq-status-time">7:13</div>
            <div class="qq-status-icons">
              <svg class="qq-signal-icon" width="18" height="12" viewBox="0 0 18 12" fill="none">
                <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/>
                <rect x="5" y="6" width="3" height="6" rx="1" fill="currentColor"/>
                <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/>
                <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/>
              </svg>
              <svg class="qq-battery-icon" width="24" height="12" viewBox="0 0 24 12" fill="none">
                <rect x="1" y="2" width="18" height="8" rx="2" stroke="currentColor" stroke-width="1"/>
                <rect x="20" y="4" width="2" height="4" rx="1" fill="currentColor"/>
                <rect x="3" y="4" width="14" height="4" rx="1" fill="currentColor"/>
              </svg>
            </div>
          </div>

          <!-- 编辑器头部 -->
          <div class="qq-avatar-editor-header">
            <button class="editor-back-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            <h1 class="editor-title">设置头像</h1>
          </div>

          <!-- 编辑器主体 -->
          <div class="qq-avatar-editor-body">
            <!-- 预览区域 -->
            <div class="avatar-preview-section">
              <div class="avatar-preview-container">
                <div class="avatar-preview-frame">
                  <img class="avatar-preview-image" src="" alt="头像预览">
                  <div class="preview-overlay"></div>
                </div>
                <div class="preview-info">
                  <p class="preview-tip">拖拽调整位置，双击重置</p>
                </div>
              </div>
            </div>

            <!-- 控制面板 -->
            <div class="editor-controls">
              <!-- 选择图片 -->
              <div class="control-section">
                <h3>输入图片链接</h3>
                <div class="url-input-section">
                  <input type="text" class="avatar-url-input" placeholder="输入图片URL地址">
                  <button class="load-url-btn">加载</button>
                </div>
              </div>

              <!-- 调整控制 -->
              <div class="control-section adjustment-controls" style="display: none;">
                <h3>调整图片</h3>

                <!-- 缩放控制 -->
                <div class="control-group compact">
                  <label>缩放 (<span class="scale-value">100</span>%)</label>
                  <div class="slider-container">
                    <input type="range" class="scale-slider" min="50" max="200" value="100" step="5">
                    <div class="slider-buttons">
                      <button class="slider-btn" data-action="scale-down">-</button>
                      <button class="slider-btn" data-action="scale-up">+</button>
                    </div>
                  </div>
                </div>

                <!-- 旋转控制 -->
                <div class="control-group compact">
                  <label>旋转 (<span class="rotation-value">0</span>°)</label>
                  <div class="slider-container">
                    <input type="range" class="rotation-slider" min="-180" max="180" value="0" step="15">
                    <div class="slider-buttons">
                      <button class="slider-btn" data-action="rotate-left">↶</button>
                      <button class="slider-btn" data-action="rotate-right">↷</button>
                    </div>
                  </div>
                </div>

                <!-- 快捷操作 -->
                <div class="control-group compact">
                  <label>快捷操作</label>
                  <div class="quick-actions">
                    <button class="action-btn" data-action="center">居中</button>
                    <button class="action-btn reset-btn" data-action="reset">重置</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作按钮 -->
          <div class="editor-bottom-actions">
            <button class="editor-cancel-btn">取消</button>
            <button class="editor-save-btn">保存</button>
          </div>
        </div>
      `);

      // 智能选择添加位置
      const $phoneInterface = $('#phone_interface');
      const $qqContainer = $phoneInterface.find('.qq-app-container');

      // 移除可能存在的旧编辑器
      $('.qq-avatar-editor-page').remove();

      if ($qqContainer.length) {
        console.log('将头像编辑器添加到QQ应用容器');
        $qqContainer.append($editorPage);
      } else if ($phoneInterface.length) {
        console.log('将头像编辑器添加到手机界面');
        $phoneInterface.append($editorPage);
      } else {
        // 最后的备用方案：添加到body
        console.log('将头像编辑器添加到body');
        $('body').append($editorPage);
      }

      console.log(
        '✅ 头像编辑器界面已创建，位置:',
        $editorPage.parent().attr('id') || $editorPage.parent().attr('class'),
      );

      // 调试：检查创建的界面结构
      console.log('🔍 创建的界面结构检查:');
      console.log('- 编辑器页面存在:', $editorPage.length > 0);
      console.log('- 状态栏存在:', $editorPage.find('.qq-status-bar').length > 0);
      console.log('- 头部存在:', $editorPage.find('.qq-avatar-editor-header').length > 0);
      console.log('- 底部操作区域存在:', $editorPage.find('.editor-bottom-actions').length > 0);
      console.log('- 取消按钮存在:', $editorPage.find('.editor-cancel-btn').length > 0);
      console.log('- 保存按钮存在:', $editorPage.find('.editor-save-btn').length > 0);
      console.log('- 编辑器主体存在:', $editorPage.find('.qq-avatar-editor-body').length > 0);
    },

    // 绑定事件
    bindEvents() {
      const self = this;

      // 返回按钮 - 更新选择器
      $(document).on('click', '.editor-back-btn', function (e) {
        e.stopPropagation();
        console.log('🔙 点击返回按钮');
        self.hideEditor();
      });

      // 取消按钮
      $(document).on('click', '.editor-cancel-btn', function (e) {
        e.stopPropagation();
        console.log('❌ 点击取消按钮');
        self.hideEditor();
      });

      // 保存按钮
      $(document).on('click', '.editor-save-btn', function (e) {
        e.stopPropagation();
        console.log('💾 点击保存按钮');
        self.saveAvatar();
      });

      // 删除了文件上传相关的事件处理，只保留URL输入功能

      // URL加载
      $(document).on('click', '.load-url-btn', function (e) {
        e.stopPropagation();
        const url = $('.avatar-url-input').val().trim();
        if (url) {
          self.handleUrlChange(url);
        }
      });

      $(document).on('input', '.avatar-url-input', function () {
        const url = $(this).val().trim();
        if (url) {
          self.handleUrlChange(url);
        }
      });

      // 缩放控制
      $(document).on('input', '.scale-slider', function () {
        const scale = parseInt($(this).val());
        self.updateScale(scale);
      });

      $(document).on('click', '[data-action="scale-down"]', function () {
        const currentScale = self.editorState.imageScale;
        const newScale = Math.max(50, currentScale - 5);
        self.updateScale(newScale);
      });

      $(document).on('click', '[data-action="scale-up"]', function () {
        const currentScale = self.editorState.imageScale;
        const newScale = Math.min(200, currentScale + 5);
        self.updateScale(newScale);
      });

      // 旋转控制
      $(document).on('input', '.rotation-slider', function () {
        const rotation = parseInt($(this).val());
        self.updateRotation(rotation);
      });

      $(document).on('click', '[data-action="rotate-left"]', function () {
        const currentRotation = self.editorState.imageRotation;
        const newRotation = currentRotation - 15;
        self.updateRotation(newRotation);
      });

      $(document).on('click', '[data-action="rotate-right"]', function () {
        const currentRotation = self.editorState.imageRotation;
        const newRotation = currentRotation + 15;
        self.updateRotation(newRotation);
      });

      // 位置控制 - 已删除方向按钮，只保留重置功能
      // $(document).on('click', '.position-btn[data-direction]', function () {
      //   const direction = $(this).data('direction');
      //   self.moveImage(direction);
      // });

      $(document).on('click', '[data-action="reset"]', function () {
        self.resetAdjustments();
      });

      // 快捷操作
      $(document).on('click', '[data-action="center"]', function () {
        self.centerImage();
      });

      // 拖拽事件
      $(document).on('mousedown touchstart', '.avatar-preview-image', function (e) {
        e.preventDefault();
        self.startDrag(e.type === 'mousedown' ? e : e.touches[0]);
      });

      $(document).on('mousemove touchmove', function (e) {
        if (self.editorState.isDragging) {
          e.preventDefault();
          self.handleDrag(e.type === 'mousemove' ? e : e.touches[0]);
        }
      });

      $(document).on('mouseup touchend', function () {
        if (self.editorState.isDragging) {
          self.stopDrag();
        }
      });

      // 双击重置
      $(document).on('dblclick', '.avatar-preview-image', function () {
        self.resetAdjustments();
      });

      console.log('✅ 头像编辑器事件已绑定');
    },

    // 显示编辑器 - 用户头像
    showUserEditor() {
      console.log('�� 显示用户头像编辑器');
      console.log('当前QQ容器存在:', $('#phone_interface .qq-app-container').length > 0);
      console.log('当前编辑器页面存在:', $('.qq-avatar-editor-page').length);

      this.currentEditTarget = 'user';
      this.currentContactInfo = null;

      // 获取当前用户信息
      const userData = window.QQApp ? window.QQApp.userData : { name: '用户', avatar: '' };

      // 设置界面标题
      $('.editor-title').text('设置用户头像');

      // 如果有现有头像，预填URL
      if (userData.avatar) {
        $('.avatar-url-input').val(userData.avatar);
        this.handleUrlChange(userData.avatar);
      }

      this.showEditor();
    },

    // 显示编辑器 - 联系人头像
    showContactEditor(qqNumber, contactName) {
      console.log('📱 显示联系人头像编辑器:', qqNumber, contactName);
      console.log('当前QQ容器存在:', $('#phone_interface .qq-app-container').length > 0);
      console.log('当前编辑器页面存在:', $('.qq-avatar-editor-page').length);

      this.currentEditTarget = 'contact';
      this.currentContactInfo = { qqNumber, contactName };

      // 获取当前头像
      const currentAvatar = window.QQApp ? window.QQApp.getAvatarUrl(qqNumber) : '';

      // 设置界面标题
      $('.editor-title').text(`设置 ${contactName} 的头像`);

      // 如果有现有头像，预填URL
      if (currentAvatar) {
        $('.avatar-url-input').val(currentAvatar);
        this.handleUrlChange(currentAvatar);
      }

      this.showEditor();
    },

    // 显示编辑器界面
    showEditor() {
      console.log('📱 显示头像编辑器界面');

      // 更新时间显示
      this.updateTime();

      // 检查是否在手机界面中
      const $phoneInterface = $('#phone_interface');
      const $qqContainer = $phoneInterface.find('.qq-app-container');

      if ($phoneInterface.length && $qqContainer.length) {
        console.log('在手机界面中显示头像编辑器');

        // 检查编辑器页面是否存在，如果不存在就创建
        let $editorPage = $qqContainer.find('.qq-avatar-editor-page');
        if ($editorPage.length === 0) {
          console.log('编辑器界面不存在，正在创建...');
          this.createEditorInterface();
          $editorPage = $qqContainer.find('.qq-avatar-editor-page');
        }

        // 隐藏QQ应用的其他内容
        $qqContainer.find('> div:not(.qq-avatar-editor-page)').hide();

        // 显示编辑器页面
        if ($editorPage.length) {
          $editorPage.css('display', 'flex').show();
          console.log('头像编辑器已在手机界面中显示');

          // 确保头部区域可见
          this.ensureHeaderVisible($editorPage);
        } else {
          console.error('创建编辑器界面后仍未找到页面');
        }
      } else {
        console.log('备用方案：独立显示头像编辑器');

        // 检查编辑器页面是否存在，如果不存在就创建
        let $editorPage = $('.qq-avatar-editor-page');
        if ($editorPage.length === 0) {
          console.log('编辑器界面不存在，正在创建...');
          this.createEditorInterface();
          $editorPage = $('.qq-avatar-editor-page');
        }

        // 备用方案：独立显示
        $editorPage.css('display', 'flex').show();

        // 确保头部区域可见
        this.ensureHeaderVisible($editorPage);
      }

      // 不要在显示编辑器时重置状态，这会丢失用户的调整
      // this.resetEditorState(); // 已注释，避免丢失用户调整
    },

    // 确保按钮区域可见
    ensureHeaderVisible($editorPage) {
      console.log('🔍 检查按钮区域可见性');

      const $header = $editorPage.find('.qq-avatar-editor-header');
      const $statusBar = $editorPage.find('.qq-status-bar');
      const $bottomActions = $editorPage.find('.editor-bottom-actions');
      const $cancelBtn = $editorPage.find('.editor-cancel-btn');
      const $saveBtn = $editorPage.find('.editor-save-btn');

      console.log('界面元素检查:');
      console.log('- 状态栏存在:', $statusBar.length > 0);
      console.log('- 头部存在:', $header.length > 0);
      console.log('- 底部操作区域存在:', $bottomActions.length > 0);
      console.log('- 取消按钮存在:', $cancelBtn.length > 0);
      console.log('- 保存按钮存在:', $saveBtn.length > 0);

      // 强制显示头部区域
      if ($header.length > 0) {
        $header.css({
          display: 'flex',
          visibility: 'visible',
          opacity: '1',
        });
        console.log('✅ 头部区域已强制显示');
      }

      // 强制显示底部操作按钮区域
      if ($bottomActions.length > 0) {
        $bottomActions.css({
          display: 'flex',
          visibility: 'visible',
          opacity: '1',
        });
        console.log('✅ 底部操作按钮区域已强制显示');
      }

      // 强制显示取消按钮
      if ($cancelBtn.length > 0) {
        $cancelBtn.css({
          display: 'flex',
          visibility: 'visible',
          opacity: '1',
        });
        console.log('✅ 取消按钮已强制显示');
      }

      // 强制显示保存按钮
      if ($saveBtn.length > 0) {
        $saveBtn.css({
          display: 'flex',
          visibility: 'visible',
          opacity: '1',
        });
        console.log('✅ 保存按钮已强制显示');
      }

      // 检查是否在手机界面中
      const $phoneContainer = $editorPage.closest('.qq-app-container');
      if ($phoneContainer.length > 0) {
        console.log('🔧 检测到手机界面，CSS样式将自动应用');
      }

      // 检查最终状态并输出详细调试信息
      setTimeout(() => {
        const finalCheck = {
          header: $header.is(':visible'),
          bottomActions: $bottomActions.is(':visible'),
          cancelBtn: $cancelBtn.is(':visible'),
          saveBtn: $saveBtn.is(':visible'),
        };
        console.log('🔍 最终可见性检查:', finalCheck);

        // 输出详细的位置和样式信息
        if ($header.length > 0) {
          const headerRect = $header[0].getBoundingClientRect();
          console.log('📐 头部区域位置:', {
            top: headerRect.top,
            left: headerRect.left,
            width: headerRect.width,
            height: headerRect.height,
            visible: headerRect.height > 0 && headerRect.width > 0,
          });

          // 检查手机界面适配
          const $phoneContainer = $header.closest('.qq-app-container');
          if ($phoneContainer.length > 0) {
            console.log('🔧 手机界面中，CSS样式应该已自动应用');
          }
        }

        // 底部按钮检查
        if ($bottomActions.length > 0) {
          const bottomRect = $bottomActions[0].getBoundingClientRect();
          console.log('📐 底部按钮区域位置:', {
            top: bottomRect.top,
            left: bottomRect.left,
            width: bottomRect.width,
            height: bottomRect.height,
            visible: bottomRect.height > 0 && bottomRect.width > 0,
          });
        }

        if ($cancelBtn.length > 0 && $saveBtn.length > 0) {
          console.log('📐 按钮检查完成');
          console.log('- 取消按钮存在且可见:', $cancelBtn.is(':visible'));
          console.log('- 保存按钮存在且可见:', $saveBtn.is(':visible'));
        }
      }, 100);
    },

    // 隐藏编辑器
    hideEditor() {
      console.log('📱 隐藏头像编辑器');

      // 隐藏编辑器页面
      $('.qq-avatar-editor-page').hide();

      // 检查是否在手机界面中
      const $phoneInterface = $('#phone_interface');
      const $qqContainer = $phoneInterface.find('.qq-app-container');

      if ($phoneInterface.length && $qqContainer.length) {
        console.log('在手机界面中恢复QQ应用');
        // 恢复QQ应用的其他内容
        $qqContainer.find('> div:not(.qq-avatar-editor-page)').show();

        // 确保QQ应用主界面可见
        if (window.QQApp && typeof window.QQApp.showMainInterface === 'function') {
          window.QQApp.showMainInterface();
        }
      } else {
        // 如果不在手机界面中，尝试显示QQ应用
        if (window.QQApp && typeof window.QQApp.show === 'function') {
          console.log('返回QQ应用主界面');
          window.QQApp.show();
        }
      }

      // 清理状态
      this.resetEditorState();
      $('.avatar-url-input').val('');
      $('.adjustment-controls').hide();
      // 保持URL输入框可见，不隐藏
      // $('.url-input-section').hide();
    },

    // 隐藏编辑器但不重置状态（用于保存后）
    hideEditorWithoutReset() {
      console.log('📱 隐藏头像编辑器（保持状态）');

      // 隐藏编辑器页面
      $('.qq-avatar-editor-page').hide();

      // 检查是否在手机界面中
      const $phoneInterface = $('#phone_interface');
      const $qqContainer = $phoneInterface.find('.qq-app-container');

      if ($phoneInterface.length && $qqContainer.length) {
        console.log('在手机界面中恢复QQ应用');
        // 恢复QQ应用的其他内容
        $qqContainer.find('> div:not(.qq-avatar-editor-page)').show();

        // 确保QQ应用主界面可见
        if (window.QQApp && typeof window.QQApp.showMainInterface === 'function') {
          window.QQApp.showMainInterface();
        }
      } else {
        // 如果不在手机界面中，尝试显示QQ应用
        if (window.QQApp && typeof window.QQApp.show === 'function') {
          console.log('返回QQ应用主界面');
          window.QQApp.show();
        }
      }

      // 不重置编辑器状态，保持用户的调整
      $('.avatar-url-input').val('');
      $('.adjustment-controls').hide();
      // 保持URL输入框可见，不隐藏
      // $('.url-input-section').hide();
    },

    // 处理URL变化
    handleUrlChange(url) {
      this.editorState.avatarUrl = url;

      if (url && url.trim()) {
        this.loadPreviewImage(url);
        $('.adjustment-controls').show();
      } else {
        $('.adjustment-controls').hide();
      }
    },

    // 加载预览图片
    loadPreviewImage(url) {
      const $img = $('.avatar-preview-image');
      const $container = $('.avatar-preview-frame');

      // 检查是否是新的图片URL
      const currentUrl = $img.attr('src');
      const isNewImage = currentUrl !== url;

      $img.off('load error');

      $img.on('load', () => {
        console.log('图片加载成功');
        // 只在加载新图片时重置调整，避免丢失用户的调整
        if (isNewImage) {
          console.log('🔄 新图片加载，重置调整参数');
          this.resetAdjustments();
        } else {
          console.log('🔄 相同图片重新加载，保持当前调整参数');
        }
      });

      $img.on('error', () => {
        console.error('图片加载失败:', url);
        $img.hide();
      });

      $img.attr('src', url).show();
    },

    // 开始拖拽
    startDrag(e) {
      this.editorState.isDragging = true;
      this.editorState.dragStart = {
        x: e.clientX - this.editorState.imagePosition.x,
        y: e.clientY - this.editorState.imagePosition.y,
      };
      $('.preview-overlay').show();
      $('body').addClass('user-select-none');
    },

    // 处理拖拽
    handleDrag(e) {
      if (!this.editorState.isDragging) return;

      const maxOffset = 200; // 增加拖拽范围，与保存时的限制保持一致
      const newX = e.clientX - this.editorState.dragStart.x;
      const newY = e.clientY - this.editorState.dragStart.y;

      this.editorState.imagePosition = {
        x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
      };

      this.updateImageTransform();
    },

    // 停止拖拽
    stopDrag() {
      this.editorState.isDragging = false;
      $('.preview-overlay').hide();
      $('body').removeClass('user-select-none');
    },

    // 更新缩放
    updateScale(scale) {
      this.editorState.imageScale = scale;
      $('.scale-slider').val(scale);
      $('.scale-value').text(scale);
      this.updateImageTransform();
    },

    // 重置调整
    resetAdjustments() {
      this.editorState.imagePosition = { x: 0, y: 0 };
      this.editorState.imageScale = 100;
      this.editorState.imageRotation = 0;

      $('.scale-slider').val(100);
      $('.scale-value').text('100');
      $('.rotation-slider').val(0);
      $('.rotation-value').text('0');

      this.updateImageTransform();
    },

    // 更新图片变换
    updateImageTransform() {
      const { imagePosition, imageScale, imageRotation } = this.editorState;

      // 限制变换参数范围，防止异常显示
      const safeScale = Math.max(0.1, Math.min(5, imageScale / 100)); // 限制缩放在10%-500%之间
      const safeX = Math.max(-200, Math.min(200, imagePosition.x)); // 限制位移范围
      const safeY = Math.max(-200, Math.min(200, imagePosition.y));
      const safeRotation = imageRotation % 360; // 确保旋转角度在0-360度之间

      // 调整变换顺序：先缩放和旋转，再平移，避免异常放大
      const transform = `scale(${safeScale}) rotate(${safeRotation}deg) translate(${safeX}px, ${safeY}px)`;

      $('.avatar-preview-image').css({
        transform: transform,
        'transform-origin': 'center center',
      });

      console.log('🔧 应用图片变换:', {
        scale: safeScale,
        translate: { x: safeX, y: safeY },
        rotate: safeRotation,
        transform: transform,
      });
    },

    // 保存头像
    saveAvatar() {
      console.log('💾 开始保存头像...');
      console.log('当前编辑目标:', this.currentEditTarget);
      console.log('联系人信息:', this.currentContactInfo);

      const { avatarUrl, imagePosition, imageScale, imageRotation } = this.editorState;
      console.log('编辑器状态:', { avatarUrl, imagePosition, imageScale, imageRotation });
      console.log('🔍 详细位移信息:', {
        'imagePosition.x': imagePosition.x,
        'imagePosition.y': imagePosition.y,
        'typeof x': typeof imagePosition.x,
        'typeof y': typeof imagePosition.y,
      });

      if (!avatarUrl.trim()) {
        alert('请输入有效的头像链接');
        return;
      }

      // 应用安全限制，确保保存的参数在合理范围内
      const safeScale = Math.max(0.1, Math.min(5, imageScale / 100));
      const safeX = Math.max(-200, Math.min(200, imagePosition.x));
      const safeY = Math.max(-200, Math.min(200, imagePosition.y));
      const safeRotation = imageRotation % 360;

      // 构建头像配置
      const avatarConfig = {
        url: avatarUrl,
        transform: {
          scale: safeScale,
          translateX: safeX,
          translateY: safeY,
          rotate: safeRotation,
        },
      };

      console.log('💾 保存头像配置 (安全限制后):', avatarConfig);

      try {
        if (this.currentEditTarget === 'user') {
          this.saveUserAvatar(avatarConfig);
        } else if (this.currentEditTarget === 'contact') {
          this.saveContactAvatar(avatarConfig);
        } else {
          console.error('❌ 未知的编辑目标:', this.currentEditTarget);
          alert('保存失败：编辑目标未知');
          return;
        }

        // 保存成功后隐藏编辑器并返回主界面
        console.log('✅ 头像保存成功，返回主界面');
        this.hideEditorWithoutReset(); // 使用不重置状态的隐藏方法

        // 延迟一下确保界面切换完成，然后更新相关界面
        setTimeout(() => {
          console.log('🔄 头像保存完成，开始更新相关界面');

          if (window.QQApp) {
            if (this.currentEditTarget === 'user') {
              // 用户头像更新
              if (typeof window.QQApp.updateUserDisplay === 'function') {
                console.log('🔄 更新用户头像显示');
                window.QQApp.updateUserDisplay();
              }
            } else if (this.currentEditTarget === 'contact' && this.currentContactInfo) {
              // 联系人头像更新
              const { qqNumber } = this.currentContactInfo;
              console.log('🔄 更新联系人头像显示:', qqNumber);

              // 只调用数据更新，避免重复调用
              if (typeof window.QQApp.updateAllAvatarDisplaysFromData === 'function') {
                window.QQApp.updateAllAvatarDisplaysFromData();
              }
            }

            // 统一更新好友管理界面（防抖处理已在方法内部）
            if (window.QQDataManager && typeof window.QQDataManager.updateFriendManagerAvatars === 'function') {
              console.log('🔄 更新好友管理界面头像');
              window.QQDataManager.updateFriendManagerAvatars();
            }
          }
        }, 200);
      } catch (error) {
        console.error('❌ 保存头像时发生错误:', error);
        alert('保存失败：' + error.message);
      }
    },

    // 保存用户头像
    saveUserAvatar(avatarConfig) {
      if (window.QQApp && typeof window.QQApp.setUserDataEnhanced === 'function') {
        try {
          const userName = window.QQApp.userData.name || '用户';
          window.QQApp.setUserDataEnhanced(userName, avatarConfig);
          console.log('✅ 用户头像已保存');

          // 显示成功提示
          this.showSuccessMessage('用户头像设置成功！');
        } catch (error) {
          console.error('❌ 保存用户头像失败:', error);
          throw new Error('保存用户头像失败');
        }
      } else {
        console.error('❌ QQApp.setUserDataEnhanced 方法不可用');
        throw new Error('QQ应用未正确加载，无法保存用户头像');
      }
    },

    // 保存联系人头像
    saveContactAvatar(avatarConfig) {
      if (window.QQApp && typeof window.QQApp.setAvatarUrlEnhanced === 'function') {
        try {
          const { qqNumber, contactName } = this.currentContactInfo;
          window.QQApp.setAvatarUrlEnhanced(qqNumber, avatarConfig);
          console.log('✅ 联系人头像已保存');

          // 显示成功提示
          this.showSuccessMessage(`${contactName} 的头像设置成功！`);
        } catch (error) {
          console.error('❌ 保存联系人头像失败:', error);
          throw new Error('保存联系人头像失败');
        }
      } else {
        console.error('❌ QQApp.setAvatarUrlEnhanced 方法不可用');
        throw new Error('QQ应用未正确加载，无法保存联系人头像');
      }
    },

    // 显示成功消息
    showSuccessMessage(message) {
      // 创建成功提示
      const $successToast = $(`
        <div class="avatar-success-toast" style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #28a745;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: fadeInOut 2s ease-in-out;
        ">
          ✅ ${message}
        </div>
      `);

      // 添加动画样式
      if (!$('#avatar-toast-styles').length) {
        $('head').append(`
          <style id="avatar-toast-styles">
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
              20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
          </style>
        `);
      }

      // 显示提示
      $('body').append($successToast);

      // 2秒后自动移除
      setTimeout(() => {
        $successToast.remove();
      }, 2000);
    },

    // 重置编辑器状态
    resetEditorState() {
      this.editorState = {
        avatarUrl: '',
        imagePosition: { x: 0, y: 0 },
        imageScale: 100,
        imageRotation: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        history: [],
        historyIndex: -1,
      };
    },

    // 删除了文件上传处理方法，只保留URL输入功能

    // 更新旋转
    updateRotation(rotation) {
      this.editorState.imageRotation = rotation;
      $('.rotation-slider').val(rotation);
      $('.rotation-value').text(rotation);
      this.updateImageTransform();
    },

    // 移动图像
    moveImage(direction) {
      const step = 5;
      const maxOffset = 200; // 与其他地方保持一致
      const { imagePosition } = this.editorState;

      switch (direction) {
        case 'up':
          imagePosition.y = Math.max(-maxOffset, imagePosition.y - step);
          break;
        case 'down':
          imagePosition.y = Math.min(maxOffset, imagePosition.y + step);
          break;
        case 'left':
          imagePosition.x = Math.max(-maxOffset, imagePosition.x - step);
          break;
        case 'right':
          imagePosition.x = Math.min(maxOffset, imagePosition.x + step);
          break;
      }

      this.updateImageTransform();
    },

    // 删除了适应宽度和适应高度功能，简化界面

    // 居中图像
    centerImage() {
      this.editorState.imagePosition = { x: 0, y: 0 };
      this.updateImageTransform();
    },

    // 更新时间显示
    updateTime() {
      const now = new Date();
      const timeString =
        now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      $('.qq-status-time').text(timeString);
    },
  };

  // 导出到全局并初始化
  console.log('🎨 QQ头像编辑器模块加载完成');

  // 导出到全局
  window.QQAvatarEditor = QQAvatarEditor;

  // 如果jQuery可用，立即初始化
  if (typeof $ !== 'undefined') {
    QQAvatarEditor.init();
    console.log('✅ QQAvatarEditor 已初始化并导出到全局');
  } else {
    // 等待jQuery加载
    const checkJQuery = () => {
      if (typeof $ !== 'undefined') {
        QQAvatarEditor.init();
        console.log('✅ QQAvatarEditor 已初始化并导出到全局');
      } else {
        setTimeout(checkJQuery, 100);
      }
    };
    checkJQuery();
  }

  // 导出到全局
  window['QQAvatarEditor'] = QQAvatarEditor;
})(window);
