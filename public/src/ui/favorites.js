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
    await this.loadFavorites();
    this.setupUI();
    this.setupTabListener();
  }

  /**
   * 设置Tab切换监听
   */
  setupTabListener() {
    document.addEventListener('tabSwitch', (e) => {
      const listContainer = document.getElementById('ball-reference-list');
      if (!listContainer) return;

      if (e.detail.tab === 'favorites') {
        // 切换到收藏tab，显示收藏列表
        this.renderFavoritesList();
      }
    });
  }

  /**
   * 加载收藏列表
   */
  async loadFavorites() {
    try {
      const response = await fetch('/data/favorites.json');
      const data = await response.json();
      this.favorites = data.favorites || [];
    } catch (error) {
      console.error('加载收藏失败:', error);
      this.favorites = [];
    }
  }

  /**
   * 设置UI
   */
  setupUI() {
    // 只在本地环境添加收藏按钮
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
    // 复用ball-reference-list容器
    const listContainer = document.getElementById('ball-reference-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (this.favorites.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #999;">
          <p>暂无收藏</p>
          <p style="font-size: 12px;">点击上方"收藏当前球形"按钮添加</p>
        </div>
      `;
      return;
    }

    // 只在本地环境添加导出按钮
    if (this.isLocalEnv) {
      const exportBtnContainer = document.createElement('div');
      exportBtnContainer.style.cssText = 'margin-bottom: 15px; text-align: center;';

      const exportBtn = document.createElement('button');
      exportBtn.textContent = '📋 复制JSON到剪贴板';
      exportBtn.style.cssText = `
        width: 100%;
        padding: 10px;
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      `;

      exportBtn.addEventListener('mouseover', () => {
        exportBtn.style.transform = 'scale(1.05)';
      });

      exportBtn.addEventListener('mouseout', () => {
        exportBtn.style.transform = 'scale(1)';
      });

      exportBtn.addEventListener('click', () => {
        this.showJsonForCopy();
      });

      exportBtnContainer.appendChild(exportBtn);
      listContainer.appendChild(exportBtnContainer);
    }

    // 添加收藏项
    this.favorites.forEach(favorite => {
      const item = this.createFavoriteItem(favorite);
      listContainer.appendChild(item);
    });
  }

  /**
   * 创建收藏项DOM
   */
  createFavoriteItem(favorite) {
    const item = document.createElement('div');
    item.className = 'favorite-item';
    item.style.cssText = `
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
      transition: box-shadow 0.2s;
    `;

    item.addEventListener('mouseover', () => {
      item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    item.addEventListener('mouseout', () => {
      item.style.boxShadow = 'none';
    });

    // 缩略图
    const thumbnail = document.createElement('img');
    thumbnail.src = favorite.thumbnail;
    thumbnail.style.cssText = `
      width: 100%;
      height: auto;
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
    `;
    thumbnail.addEventListener('click', () => this.restoreFavorite(favorite));

    // 信息区域
    const info = document.createElement('div');
    info.style.cssText = 'margin-bottom: 8px;';

    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-weight: bold; font-size: 14px; margin-bottom: 4px;';
    nameEl.textContent = favorite.name;

    const angleEl = document.createElement('div');
    angleEl.style.cssText = 'font-size: 12px; color: #666;';
    angleEl.textContent = `角度: ${favorite.angleInfo.angle}° | ${favorite.angleInfo.thickness}`;

    const timeEl = document.createElement('div');
    timeEl.style.cssText = 'font-size: 11px; color: #999; margin-top: 2px;';
    const date = new Date(favorite.timestamp);
    timeEl.textContent = date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    info.appendChild(nameEl);
    info.appendChild(angleEl);
    info.appendChild(timeEl);

    // 按钮区域
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px;';

    const loadBtn = document.createElement('button');
    loadBtn.textContent = '加载';
    loadBtn.style.cssText = `
      flex: 1;
      padding: 6px;
      background: #4169E1;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    `;
    loadBtn.addEventListener('click', () => this.restoreFavorite(favorite));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除';
    deleteBtn.style.cssText = `
      flex: 1;
      padding: 6px;
      background: #DC143C;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    `;
    deleteBtn.addEventListener('click', () => this.deleteFavorite(favorite.id));

    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(thumbnail);
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

      alert(`✅ 已删除"${deleted.name}"\n\n请点击"导出收藏数据"按钮下载最新的收藏列表。`);
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
