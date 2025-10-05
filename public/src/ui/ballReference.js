/**
 * 球形参考管理模块
 */

export class BallReferenceManager {
  constructor() {
    this.references = [];
    this.storageKey = 'snooker-ball-references';
    this.currentTab = 'reference'; // 'reference' 或 'favorites'

    this.elements = {
      list: null,
      addBtn: null,
      tabButtons: null,
      referenceTab: null,
      favoritesTab: null
    };

    this.init();
  }

  /**
   * 初始化
   */
  init() {
    // 创建Tab切换UI
    this.createTabUI();

    // 获取DOM元素
    this.elements.list = document.getElementById('ball-reference-list');
    this.elements.addBtn = document.getElementById('add-reference-btn');

    // 加载数据
    this.loadFromStorage();

    // 默认为空列表，用户可以自行添加

    // 绑定事件
    this.bindEvents();

    // 渲染列表
    this.render();
  }

  /**
   * 创建Tab切换UI
   */
  createTabUI() {
    const header = document.querySelector('.ball-reference-header');
    if (!header) return;

    // 修改header结构，添加Tab按钮
    const h3 = header.querySelector('h3');
    const addBtn = header.querySelector('.add-reference-btn');

    // 创建Tab容器
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    // 创建Tab按钮
    const referenceTab = document.createElement('button');
    referenceTab.id = 'reference-tab';
    referenceTab.className = 'tab-btn active';
    referenceTab.textContent = '球形参考';
    referenceTab.style.cssText = `
      padding: 5px 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s;
    `;

    const favoritesTab = document.createElement('button');
    favoritesTab.id = 'favorites-tab';
    favoritesTab.className = 'tab-btn';
    favoritesTab.textContent = '我的收藏';
    favoritesTab.style.cssText = `
      padding: 5px 12px;
      background: #e0e0e0;
      color: #666;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s;
    `;

    this.elements.referenceTab = referenceTab;
    this.elements.favoritesTab = favoritesTab;

    // Tab点击事件
    referenceTab.addEventListener('click', () => this.switchTab('reference'));
    favoritesTab.addEventListener('click', () => this.switchTab('favorites'));

    tabContainer.appendChild(referenceTab);
    tabContainer.appendChild(favoritesTab);

    // 重新组织header结构
    header.innerHTML = '';
    header.appendChild(tabContainer);
    header.appendChild(addBtn);
  }

  /**
   * 切换Tab
   */
  switchTab(tab) {
    this.currentTab = tab;

    // 更新Tab样式
    if (tab === 'reference') {
      this.elements.referenceTab.style.background = '#667eea';
      this.elements.referenceTab.style.color = 'white';
      this.elements.favoritesTab.style.background = '#e0e0e0';
      this.elements.favoritesTab.style.color = '#666';
      this.elements.addBtn.style.display = 'block';
    } else {
      this.elements.referenceTab.style.background = '#e0e0e0';
      this.elements.referenceTab.style.color = '#666';
      this.elements.favoritesTab.style.background = '#667eea';
      this.elements.favoritesTab.style.color = 'white';
      this.elements.addBtn.style.display = 'none';
    }

    // 触发自定义事件，通知收藏管理器切换显示
    const event = new CustomEvent('tabSwitch', { detail: { tab } });
    document.dispatchEvent(event);

    // 根据tab显示不同内容
    if (tab === 'reference') {
      this.render();
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    if (this.elements.addBtn) {
      this.elements.addBtn.addEventListener('click', () => {
        this.addReference();
      });
    }
  }

  /**
   * 从localStorage加载数据
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.references = JSON.parse(data);
      } else {
        // 如果没有数据，添加一个示例
        this.references = [
          {
            id: 1,
            description: '示例：点击"添加"创建您自己的球形参考'
          }
        ];
        this.saveToStorage();
      }
    } catch (error) {
      console.error('加载球形参考数据失败:', error);
      this.references = [];
    }
  }

  /**
   * 保存到localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.references));
    } catch (error) {
      console.error('保存球形参考数据失败:', error);
    }
  }

  /**
   * 添加新的参考
   */
  addReference() {
    const newId = this.references.length > 0
      ? Math.max(...this.references.map(r => r.id)) + 1
      : 1;

    this.references.push({
      id: newId,
      description: '新球形参考'
    });

    this.saveToStorage();
    this.render();
  }

  /**
   * 删除参考
   */
  deleteReference(id) {
    this.references = this.references.filter(r => r.id !== id);
    this.saveToStorage();
    this.render();
  }

  /**
   * 更新参考描述
   */
  updateReference(id, description) {
    const ref = this.references.find(r => r.id === id);
    if (ref) {
      ref.description = description;
      this.saveToStorage();
    }
  }

  /**
   * 绘制小型球台示意图
   */
  drawDiagram(ref) {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    // 缩放比例
    const scale = canvas.width / 3569;

    // 绘制台面
    ctx.fillStyle = '#1a7a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制边框
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    if (ref.whitePos && ref.targetPos && ref.pocketId) {
      // 绘制目标球
      const targetX = ref.targetPos.x * scale;
      const targetY = ref.targetPos.y * scale;
      const ballRadius = 26.25 * scale;

      ctx.beginPath();
      ctx.arc(targetX, targetY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = this.getBallColor(ref.ballType);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // 绘制白球
      const whiteX = ref.whitePos.x * scale;
      const whiteY = ref.whitePos.y * scale;

      ctx.beginPath();
      ctx.arc(whiteX, whiteY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();

      // 绘制袋口标记
      const pocketPos = this.getPocketPosition(ref.pocketId);
      if (pocketPos) {
        const pocketX = pocketPos.x * scale;
        const pocketY = pocketPos.y * scale;

        ctx.beginPath();
        ctx.arc(pocketX, pocketY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
      }

      // 绘制瞄准线（白球到目标球）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(whiteX, whiteY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // 绘制进袋线（目标球到袋口）
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(pocketPos.x * scale, pocketPos.y * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    return canvas;
  }

  /**
   * 获取球的颜色
   */
  getBallColor(ballType) {
    const colors = {
      red: '#DC143C',
      yellow: '#FFD700',
      green: '#228B22',
      brown: '#8B4513',
      blue: '#4169E1',
      pink: '#FF69B4',
      black: '#000000'
    };
    return colors[ballType] || '#FFFFFF';
  }

  /**
   * 获取袋口位置
   */
  getPocketPosition(pocketId) {
    const pockets = {
      'top-left': { x: 0, y: 0 },
      'middle-top': { x: 1784, y: 0 },
      'top-right': { x: 3569, y: 0 },
      'bottom-right': { x: 3569, y: 1778 },
      'middle-bottom': { x: 1784, y: 1778 },
      'bottom-left': { x: 0, y: 1778 }
    };
    return pockets[pocketId];
  }

  /**
   * 渲染列表
   */
  render() {
    if (!this.elements.list) return;

    this.elements.list.innerHTML = '';

    this.references.forEach(ref => {
      const item = document.createElement('div');
      item.className = 'reference-item';

      // 创建示意图容器
      const diagramContainer = document.createElement('div');
      diagramContainer.className = 'reference-diagram';

      // 如果有位置数据，绘制示意图
      if (ref.whitePos && ref.targetPos && ref.pocketId) {
        const canvas = this.drawDiagram(ref);
        diagramContainer.appendChild(canvas);
      }

      // 创建信息容器
      const infoContainer = document.createElement('div');
      infoContainer.className = 'reference-info';
      infoContainer.innerHTML = `
        <input
          type="text"
          value="${ref.description}"
          data-id="${ref.id}"
          class="reference-input"
        />
        <div class="reference-actions">
          <button class="delete-btn" data-id="${ref.id}">删除</button>
        </div>
      `;

      item.appendChild(diagramContainer);
      item.appendChild(infoContainer);
      this.elements.list.appendChild(item);
    });

    // 绑定输入框事件
    this.elements.list.querySelectorAll('.reference-input').forEach(input => {
      input.addEventListener('blur', (e) => {
        const id = parseInt(e.target.dataset.id);
        const description = e.target.value.trim();
        if (description) {
          this.updateReference(id, description);
        }
      });

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });
    });

    // 绑定删除按钮事件
    this.elements.list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        if (confirm('确定要删除这个球形参考吗？')) {
          this.deleteReference(id);
        }
      });
    });
  }
}
