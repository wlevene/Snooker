/**
 * 主入口文件
 * 初始化应用并协调各个模块
 */

import { State } from './core/state.js';
import { TableRenderer } from './renderer/table.js';
import { BallsRenderer } from './renderer/balls.js';
import { LinesRenderer } from './renderer/lines.js';
import { AimGuideRenderer } from './renderer/aimGuide.js';
import { PositionCircleRenderer } from './renderer/positionCircle.js';
import { Interaction } from './ui/interaction.js';
import { Controls } from './ui/controls.js';
import { FavoritesManager } from './ui/favorites.js';

class SnookerApp {
  constructor() {
    this.config = null;
    this.state = null;
    this.canvas = null;
    this.ctx = null;
    this.scale = 1;

    // 渲染器
    this.tableRenderer = null;
    this.ballsRenderer = null;
    this.linesRenderer = null;
    this.aimGuideRenderer = null;
    this.positionCircleRenderer = null;

    // UI组件
    this.interaction = null;
    this.controls = null;
    this.favoritesManager = null;

    this.init();
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      // 加载配置
      await this.loadConfig();

      // 初始化Canvas
      this.initCanvas();

      // 初始化状态
      this.state = new State(this.config);

      // 初始化渲染器
      this.initRenderers();

      // 初始化UI
      this.initUI();

      // 开始渲染循环
      this.startRenderLoop();

      console.log('斯诺克角度瞄准法工具初始化完成');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }

  /**
   * 加载配置文件
   */
  async loadConfig() {
    try {
      const response = await fetch('data/config.json');
      this.config = await response.json();
    } catch (error) {
      console.error('加载配置文件失败:', error);
      throw error;
    }
  }

  /**
   * 初始化Canvas
   */
  initCanvas() {
    this.canvas = document.getElementById('table-canvas');
    this.ctx = this.canvas.getContext('2d');

    // 计算缩放比例以适应屏幕
    this.calculateScale();

    // 设置Canvas尺寸
    const tableLength = this.config.table.playingArea.length;
    const tableWidth = this.config.table.playingArea.width;

    this.canvas.width = tableLength * this.scale;
    this.canvas.height = tableWidth * this.scale;

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.calculateScale();
      this.canvas.width = tableLength * this.scale;
      this.canvas.height = tableWidth * this.scale;
      this.updateRenderersScale();
      this.render();
    });
  }

  /**
   * 计算缩放比例
   */
  calculateScale() {
    const canvasContainer = document.querySelector('.canvas-container');
    const containerWidth = canvasContainer.clientWidth - 20; // 减去padding
    const containerHeight = canvasContainer.clientHeight - 20;

    const tableLength = this.config.table.playingArea.length;
    const tableWidth = this.config.table.playingArea.width;

    // 根据容器大小计算最佳缩放比例
    const scaleX = containerWidth / tableLength;
    const scaleY = containerHeight / tableWidth;

    this.scale = Math.min(scaleX, scaleY, 0.25); // 最大缩放0.25
  }

  /**
   * 更新所有渲染器的缩放比例
   */
  updateRenderersScale() {
    if (this.tableRenderer) this.tableRenderer.setScale(this.scale);
    if (this.ballsRenderer) this.ballsRenderer.setScale(this.scale);
    if (this.linesRenderer) this.linesRenderer.setScale(this.scale);
    if (this.positionCircleRenderer) this.positionCircleRenderer.setScale(this.scale);
  }

  /**
   * 初始化渲染器
   */
  initRenderers() {
    this.tableRenderer = new TableRenderer(this.ctx, this.config, this.scale);
    this.ballsRenderer = new BallsRenderer(this.ctx, this.config, this.scale);
    this.linesRenderer = new LinesRenderer(this.ctx, this.config, this.scale);
    this.aimGuideRenderer = new AimGuideRenderer(this.config);
    this.positionCircleRenderer = new PositionCircleRenderer(this.ctx, this.config, this.scale);
  }

  /**
   * 初始化UI组件
   */
  initUI() {
    // 初始化交互
    this.interaction = new Interaction(this.canvas, this.state, this.ballsRenderer);

    // 初始化控制面板
    this.controls = new Controls(this.state, this.aimGuideRenderer);

    // 初始化收藏管理器
    this.favoritesManager = new FavoritesManager(this.config, this.state);

    // 监听状态变化，触发重新渲染
    this.state.addListener(() => {
      this.render();
    });
  }

  /**
   * 渲染场景
   */
  render() {
    // 1. 渲染球桌（包含网格和彩球）
    this.tableRenderer.render(this.state.showGrid, this.state.selectedColoredBalls);

    // 2. 渲染辅助线
    if (this.state.showPocketLine || this.state.showAimingLine || this.state.showAngleLines || this.state.showGuideLine) {
      this.linesRenderer.render(this.state);
    }

    // 3. 渲染厚度示意
    if (this.state.showThicknessGuide) {
      this.linesRenderer.drawThicknessGuide(
        this.state.cueBall,
        this.state.objectBall,
        this.state.selectedPocket
      );
    }

    // 4. 渲染位置参考圆
    if (this.state.showPositionCircle) {
      this.positionCircleRenderer.render(this.state);
    }

    // 5. 渲染球
    this.ballsRenderer.render(this.state);

    // 6. 渲染袋口标记和编号（最后绘制，确保在最上层）
    this.tableRenderer.drawPocketMarkers(this.state.selectedPocket.id);
  }

  /**
   * 开始渲染循环
   */
  startRenderLoop() {
    // 初始渲染
    this.render();

    // 只在状态变化时渲染，不需要持续循环
    // 渲染由state.notify()触发
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  new SnookerApp();
});
