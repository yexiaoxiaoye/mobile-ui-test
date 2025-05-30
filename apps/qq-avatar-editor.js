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
            <div class="editor-actions">
              <button class="editor-cancel-btn">取消</button>
              <button class="editor-save-btn">保存</button>
            </div>
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
                <h3>选择图片</h3>
                <div class="image-source-options">
                  <input type="file" id="avatar-file-input" accept="image/*" style="display: none;">
                  <button class="source-btn upload-btn" data-source="upload">
                    📁 从相册选择
                  </button>
                  <button class="source-btn url-btn" data-source="url">
                    🔗 输入图片链接
                  </button>
                </div>
                <div class="url-input-section" style="display: none;">
                  <input type="text" class="avatar-url-input" placeholder="输入图片URL地址">
                  <button class="load-url-btn">加载</button>
                </div>
              </div>

              <!-- 调整控制 -->
              <div class="control-section adjustment-controls" style="display: none;">
                <h3>调整图片</h3>

                <!-- 缩放控制 -->
                <div class="control-group">
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
                <div class="control-group">
                  <label>旋转 (<span class="rotation-value">0</span>°)</label>
                  <div class="slider-container">
                    <input type="range" class="rotation-slider" min="-180" max="180" value="0" step="15">
                    <div class="slider-buttons">
                      <button class="slider-btn" data-action="rotate-left">↶</button>
                      <button class="slider-btn" data-action="rotate-right">↷</button>
                    </div>
                  </div>
                </div>

                <!-- 位置控制 -->
                <div class="control-group">
                  <label>位置调整</label>
                  <div class="position-controls">
                    <button class="position-btn" data-direction="up">↑</button>
                    <button class="position-btn" data-direction="left">←</button>
                    <button class="position-btn reset-btn" data-action="reset">重置</button>
                    <button class="position-btn" data-direction="right">→</button>
                    <button class="position-btn" data-direction="down">↓</button>
                  </div>
                </div>

                <!-- 快捷操作 -->
                <div class="control-group">
                  <label>快捷操作</label>
                  <div class="quick-actions">
                    <button class="action-btn" data-action="fit-width">适应宽度</button>
                    <button class="action-btn" data-action="fit-height">适应高度</button>
                    <button class="action-btn" data-action="center">居中</button>
                  </div>
                </div>
              </div>
            </div>
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

      // 图片来源选择
      $(document).on('click', '.upload-btn', function (e) {
        e.stopPropagation();
        $('#avatar-file-input').click();
      });

      $(document).on('click', '.url-btn', function (e) {
        e.stopPropagation();
        $('.url-input-section').toggle();
      });

      // 文件选择
      $(document).on('change', '#avatar-file-input', function (e) {
        const file = e.target.files[0];
        if (file) {
          self.handleFileUpload(file);
        }
      });

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

      // 位置控制
      $(document).on('click', '.position-btn[data-direction]', function () {
        const direction = $(this).data('direction');
        self.moveImage(direction);
      });

      $(document).on('click', '[data-action="reset"]', function () {
        self.resetAdjustments();
      });

      // 快捷操作
      $(document).on('click', '[data-action="fit-width"]', function () {
        self.fitToWidth();
      });

      $(document).on('click', '[data-action="fit-height"]', function () {
        self.fitToHeight();
      });

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
      }

      // 重置编辑器状态
      this.resetEditorState();
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
      }

      // 清理状态
      this.resetEditorState();
      $('.avatar-url-input').val('');
      $('.adjustment-controls').hide();
      $('.url-input-section').hide();
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

      $img.off('load error');

      $img.on('load', () => {
        console.log('图片加载成功');
        this.resetAdjustments();
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

      const maxOffset = 150;
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
      const transform = `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${
        imageScale / 100
      }) rotate(${imageRotation}deg)`;

      $('.avatar-preview-image').css({
        transform: transform,
        'transform-origin': 'center center',
      });
    },

    // 保存头像
    saveAvatar() {
      console.log('💾 开始保存头像...');
      console.log('当前编辑目标:', this.currentEditTarget);
      console.log('联系人信息:', this.currentContactInfo);

      const { avatarUrl, imagePosition, imageScale, imageRotation } = this.editorState;
      console.log('编辑器状态:', { avatarUrl, imagePosition, imageScale, imageRotation });

      if (!avatarUrl.trim()) {
        alert('请输入有效的头像链接');
        return;
      }

      // 构建头像配置
      const avatarConfig = {
        url: avatarUrl,
        transform: {
          scale: imageScale / 100,
          translateX: imagePosition.x,
          translateY: imagePosition.y,
          rotate: imageRotation,
        },
      };

      console.log('💾 保存头像配置:', avatarConfig);

      if (this.currentEditTarget === 'user') {
        this.saveUserAvatar(avatarConfig);
      } else if (this.currentEditTarget === 'contact') {
        this.saveContactAvatar(avatarConfig);
      } else {
        console.error('❌ 未知的编辑目标:', this.currentEditTarget);
        alert('保存失败：编辑目标未知');
        return;
      }

      this.hideEditor();
    },

    // 保存用户头像
    saveUserAvatar(avatarConfig) {
      if (window.QQApp && typeof window.QQApp.setUserDataEnhanced === 'function') {
        const userName = window.QQApp.userData.name;
        window.QQApp.setUserDataEnhanced(userName, avatarConfig);
        console.log('✅ 用户头像已保存');
        alert('用户头像设置成功！');
      } else {
        console.error('❌ QQApp.setUserDataEnhanced 方法不可用');
      }
    },

    // 保存联系人头像
    saveContactAvatar(avatarConfig) {
      if (window.QQApp && typeof window.QQApp.setAvatarUrlEnhanced === 'function') {
        const { qqNumber } = this.currentContactInfo;
        window.QQApp.setAvatarUrlEnhanced(qqNumber, avatarConfig);
        console.log('✅ 联系人头像已保存');
        alert('联系人头像设置成功！');
      } else {
        console.error('❌ QQApp.setAvatarUrlEnhanced 方法不可用');
      }
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

    // 处理文件上传
    handleFileUpload(file) {
      const reader = new FileReader();
      reader.onload = e => {
        const imageUrl = e.target.result;
        this.handleUrlChange(imageUrl);
      };
      reader.readAsDataURL(file);
    },

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
      const { imagePosition } = this.editorState;

      switch (direction) {
        case 'up':
          imagePosition.y = Math.max(-150, imagePosition.y - step);
          break;
        case 'down':
          imagePosition.y = Math.min(150, imagePosition.y + step);
          break;
        case 'left':
          imagePosition.x = Math.max(-150, imagePosition.x - step);
          break;
        case 'right':
          imagePosition.x = Math.min(150, imagePosition.x + step);
          break;
      }

      this.updateImageTransform();
    },

    // 适应宽度
    fitToWidth() {
      this.editorState.imageScale = 100;
      this.editorState.imagePosition = { x: 0, y: 0 };
      $('.scale-slider').val(100);
      $('.scale-value').text(100);
      this.updateImageTransform();
    },

    // 适应高度
    fitToHeight() {
      this.editorState.imageScale = 120;
      this.editorState.imagePosition = { x: 0, y: 0 };
      $('.scale-slider').val(120);
      $('.scale-value').text(120);
      this.updateImageTransform();
    },

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
