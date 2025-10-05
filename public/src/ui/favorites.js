/**
 * 收藏管理器
 * 管理球形收藏的增删查功能
 */

import { ThumbnailGenerator } from '../renderer/thumbnail.js';
import { Geometry } from '../core/geometry.js';

export class FavoritesManager {
  constructor(config, state) {
    this.config = config;
    this.state = state;
    this.thumbnailGenerator = new ThumbnailGenerator(config);
    this.favorites = [];
    this.deletePassword = 'delete';

    // 检测是否为本地环境
    this.isLocalEnv = this.detectLocalEnvironment();

    this.init();
  }

  /**
   * 检测是否为本地环境
   */
  detectLocalEnvironment() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
  }

  /**
   * 初始化
   */
  async init() {
    console.log('🔧 FavoritesManager init started');
    await this.loadFavorites();
    this.setupUI();
    // 初始化完成后直接渲染收藏列表
    this.renderFavoritesList();
    console.log('🔧 FavoritesManager init completed');
  }

  /**
   * 加载收藏列表
   */
  async loadFavorites() {
    try {
      const response = await fetch('/data/favorites.json');
      const data = await response.json();
      this.favorites = data.favorites || [];
      console.log(`✅ 成功加载 ${this.favorites.length} 个收藏`);
    } catch (error) {
      console.error('❌ 加载收藏失败:', error);
      this.favorites = [];
    }
  }

  /**
   * 设置UI
   */
  setupUI() {
    // 只在本地环境添加收藏按钮和导出按钮
    if (this.isLocalEnv) {
      this.addSaveButton();
    }
  }

  /**
   * 添加保存按钮
   */
  addSaveButton() {
    const angleInfoSection = document.querySelector('.panel-section');
    if (!angleInfoSection) return;

    const saveBtn = document.createElement('button');
    saveBtn.id = 'save-favorite-btn';
    saveBtn.className = 'save-favorite-btn';
    saveBtn.innerHTML = '⭐ 收藏当前球形';
    saveBtn.style.cssText = `
      width: 100%;
      margin-top: 15px;
      padding: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    `;

    saveBtn.addEventListener('mouseover', () => {
      saveBtn.style.transform = 'scale(1.05)';
    });

    saveBtn.addEventListener('mouseout', () => {
      saveBtn.style.transform = 'scale(1)';
    });

    saveBtn.addEventListener('click', () => this.showSaveDialog());

    // 插入到角度信息区域后面
    const angleInfo = document.getElementById('angle-info');
    if (angleInfo && angleInfo.parentNode) {
      angleInfo.parentNode.insertBefore(saveBtn, angleInfo.nextSibling);
    }
  }

  /**
   * 显示保存对话框
   */
  showSaveDialog() {
    const name = prompt('请输入收藏名称:', `${this.state.objectBall.type}球练习`);

    if (name === null) return; // 用户取消

    if (!name.trim()) {
      alert('名称不能为空！');
      return;
    }

    this.saveFavorite(name.trim());
  }

  /**
   * 保存收藏
   */
  saveFavorite(name) {
    // 生成缩略图
    const thumbnail = this.thumbnailGenerator.generate(this.state);

    // 获取当前角度信息
    const angleInfo = this.getCurrentAngleInfo();

    // 创建收藏对象
    const favorite = {
      id: `fav_${Date.now()}`,
      name: name,
      timestamp: Date.now(),
      cueBall: { ...this.state.cueBall },
      objectBall: { ...this.state.objectBall },
      selectedPocket: {
        id: this.state.selectedPocket.id,
        name: this.state.selectedPocket.name,
        x: this.state.selectedPocket.x,
        y: this.state.selectedPocket.y
      },
      angleInfo: angleInfo,
      thumbnail: thumbnail
    };

    // 添加到列表
    this.favorites.push(favorite);

    // 重新渲染列表
    this.renderFavoritesList();

    // 显示JSON供复制
    this.showJsonForCopy();
  }

  /**
   * 下载favorites.json文件
   */
  downloadFavoritesFile() {
    const data = {
      version: '1.0',
      favorites: this.favorites
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'favorites.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 渲染收藏列表
   */
  renderFavoritesList() {
    console.log(`🎨 renderFavoritesList called, favorites count: ${this.favorites.length}`);
    // 复用ball-reference-list容器
    const listContainer = document.getElementById('ball-reference-list');
    if (!listContainer) {
      console.log('❌ renderFavoritesList: listContainer not found');
      return;
    }

    listContainer.innerHTML = '';

    if (this.favorites.length === 0) {
      console.log('📭 No favorites to display');
      listContainer.innerHTML = `
        <div class="favorites-empty">
          <p>暂无收藏</p>
          <p>点击上方"收藏当前球形"按钮添加</p>
        </div>
      `;
      return;
    }

    console.log('📋 Rendering favorites list with items:', this.favorites.length);

    // 只在本地环境添加导出按钮
    if (this.isLocalEnv) {
      const exportBtnContainer = document.createElement('div');
      exportBtnContainer.className = 'export-btn-container';

      const exportBtn = document.createElement('button');
      exportBtn.className = 'export-json-btn';
      exportBtn.textContent = '📋 复制JSON到剪贴板';

      exportBtn.addEventListener('click', () => {
        this.showJsonForCopy();
      });

      exportBtnContainer.appendChild(exportBtn);
      listContainer.appendChild(exportBtnContainer);
    }

    // 按彩球类型分组
    const groupedFavorites = this.groupFavoritesByBallType();

    // 球类型顺序和中文名称
    const ballOrder = [
      { type: 'red', name: '红球', color: '#DC143C' },
      { type: 'yellow', name: '黄球', color: '#FFD700' },
      { type: 'green', name: '绿球', color: '#228B22' },
      { type: 'brown', name: '咖啡球', color: '#8B4513' },
      { type: 'blue', name: '蓝球', color: '#4169E1' },
      { type: 'pink', name: '粉球', color: '#FF69B4' },
      { type: 'black', name: '黑球', color: '#000000' }
    ];

    // 按顺序渲染每个分组
    ballOrder.forEach(ball => {
      const favorites = groupedFavorites[ball.type];
      if (favorites && favorites.length > 0) {
        // 创建分组容器
        const groupContainer = document.createElement('div');
        groupContainer.className = 'ball-type-group';

        // 创建分组标题
        const groupHeader = document.createElement('div');
        groupHeader.className = 'ball-type-header';
        groupHeader.style.borderLeftColor = ball.color;

        // 球型图标
        const ballIcon = document.createElement('div');
        ballIcon.className = 'ball-type-icon';
        ballIcon.style.backgroundColor = ball.color;

        // 标题文字
        const titleSpan = document.createElement('span');
        titleSpan.className = 'ball-type-title';
        titleSpan.textContent = ball.name;

        // 数量标签
        const countSpan = document.createElement('span');
        countSpan.className = 'ball-type-count';
        countSpan.textContent = favorites.length;

        groupHeader.appendChild(ballIcon);
        groupHeader.appendChild(titleSpan);
        groupHeader.appendChild(countSpan);
        groupContainer.appendChild(groupHeader);

        // 添加该分组的收藏项
        favorites.forEach(favorite => {
          const item = this.createFavoriteItem(favorite);
          groupContainer.appendChild(item);
        });

        listContainer.appendChild(groupContainer);
      }
    });
  }

  /**
   * 按球类型分组收藏
   */
  groupFavoritesByBallType() {
    const groups = {};

    this.favorites.forEach(favorite => {
      const ballType = favorite.objectBall.type;
      if (!groups[ballType]) {
        groups[ballType] = [];
      }
      groups[ballType].push(favorite);
    });

    return groups;
  }

  /**
   * 创建收藏项DOM
   */
  createFavoriteItem(favorite) {
    const item = document.createElement('div');
    item.className = 'favorite-item';

    // 缩略图容器
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'favorite-thumbnail';
    thumbnailContainer.addEventListener('click', () => this.restoreFavorite(favorite));

    const thumbnail = document.createElement('img');
    thumbnail.src = favorite.thumbnail;
    thumbnail.alt = favorite.name;

    thumbnailContainer.appendChild(thumbnail);

    // 信息区域
    const info = document.createElement('div');
    info.className = 'favorite-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'favorite-name';
    nameEl.textContent = favorite.name;

    const angleEl = document.createElement('div');
    angleEl.className = 'favorite-angle';
    angleEl.textContent = `角度: ${favorite.angleInfo.angle}° | ${favorite.angleInfo.thickness}`;

    const timeEl = document.createElement('div');
    timeEl.className = 'favorite-time';
    const date = new Date(favorite.timestamp);
    timeEl.textContent = date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    info.appendChild(nameEl);
    info.appendChild(angleEl);
    info.appendChild(timeEl);

    // 按钮区域
    const actions = document.createElement('div');
    actions.className = 'favorite-actions';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'favorite-load-btn';
    loadBtn.textContent = '加载';
    loadBtn.addEventListener('click', () => this.restoreFavorite(favorite));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'favorite-delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => this.deleteFavorite(favorite.id));

    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(thumbnailContainer);
    item.appendChild(info);
    item.appendChild(actions);

    return item;
  }

  /**
   * 恢复收藏的球形
   */
  restoreFavorite(favorite) {
    // 更新状态
    this.state.cueBall = { ...favorite.cueBall };
    this.state.objectBall = { ...favorite.objectBall };
    this.state.selectedPocket = favorite.selectedPocket;

    // 通知状态更新
    this.state.notify();

    console.log('已加载收藏:', favorite.name);
  }

  /**
   * 删除收藏
   */
  deleteFavorite(id) {
    const password = prompt('请输入删除密码:');

    if (password === null) return; // 用户取消

    if (password !== this.deletePassword) {
      alert('❌ 密码错误！');
      return;
    }

    // 从列表中删除
    const index = this.favorites.findIndex(f => f.id === id);
    if (index > -1) {
      const deleted = this.favorites.splice(index, 1)[0];

      // 重新渲染
      this.renderFavoritesList();

      // 自动复制最新的JSON到剪贴板
      this.showJsonForCopy();

      alert(`✅ 已删除"${deleted.name}"\n\n最新的JSON已复制到剪贴板！\n请手动更新 public/data/favorites.json 文件。`);
    }
  }

  /**
   * 显示JSON供复制
   */
  showJsonForCopy() {
    const data = {
      version: '1.0',
      favorites: this.favorites
    };

    const jsonStr = JSON.stringify(data, null, 2);

    // 复制到剪贴板
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert(`✅ JSON已复制到剪贴板！\n\n请手动替换文件内容：\n1. 打开 public/data/favorites.json\n2. 粘贴剪贴板内容\n3. 保存文件\n4. 刷新页面查看效果\n\n共 ${this.favorites.length} 个收藏`);
    }).catch(err => {
      // 如果复制失败，显示文本框让用户手动复制
      const textarea = document.createElement('textarea');
      textarea.value = jsonStr;
      textarea.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        height: 60%;
        padding: 20px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        background: white;
        border: 2px solid #333;
        border-radius: 8px;
      `;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(textarea);
      textarea.select();

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '关闭';
      closeBtn.style.cssText = `
        position: fixed;
        top: 10%;
        right: 12%;
        padding: 10px 20px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 10001;
      `;

      closeBtn.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(textarea);
        document.body.removeChild(closeBtn);
      };

      document.body.appendChild(closeBtn);
    });
  }

  /**
   * 获取当前角度信息
   */
  getCurrentAngleInfo() {
    const angle = Geometry.calculateAimingAngle(
      this.state.cueBall,
      this.state.objectBall,
      this.state.selectedPocket
    );

    const aimingData = Geometry.getAimingDataByAngle(
      angle,
      this.config.aimingMethod.angleData
    );

    return {
      angle: angle.toFixed(1),
      aimPosition: aimingData.aimPosition || "--",
      thickness: aimingData.thickness || "--",
      difficulty: aimingData.difficulty || "unknown"
    };
  }
}
