/**
 * 状态管理模块
 * 管理应用的全局状态
 */

export class State {
  constructor(config) {
    this.config = config;

    // 球的位置
    this.cueBall = { x: 1200, y: 1200 }; // 向右移动一点
    this.objectBall = {
      x: config.spotPositions.blue.x, // 蓝球位置
      y: config.spotPositions.blue.y,
      type: 'blue',
      locked: true // 默认锁定
    };

    // 选中的袋口 - 默认选择B袋（middle-top）
    this.selectedPocket = config.table.pocketPositions.find(p => p.id === 'middle-top') || config.table.pocketPositions[0];

    // UI显示选项
    this.showAimingLine = config.ui.defaultSettings.showAimingLine;
    this.showPocketLine = config.ui.defaultSettings.showPocketLine;
    this.showAngleLines = config.ui.defaultSettings.showAngleLines;
    this.showThicknessGuide = config.ui.defaultSettings.showThicknessGuide;
    this.showAimGuide = config.ui.defaultSettings.showAimGuide;
    this.showGuideLine = true; // 默认显示白球穿过目标球的辅助线
    this.showGrid = true; // 默认显示网格

    // 彩球显示控制 - 默认选中蓝球
    this.selectedColoredBalls = 'blue';

    // 当前选中的预设场景
    this.currentScenario = null;

    // 拖拽状态
    this.dragging = null; // 'cueBall' or 'objectBall'

    // 事件监听器
    this.listeners = [];
  }

  /**
   * 获取球半径（像素）
   */
  getBallRadius() {
    return this.config.ball.radius;
  }

  /**
   * 获取球直径（像素）
   */
  getBallDiameter() {
    return this.config.ball.diameter;
  }

  /**
   * 设置白球位置
   */
  setCueBallPosition(x, y) {
    this.cueBall.x = x;
    this.cueBall.y = y;
    this.notify();
  }

  /**
   * 设置目标球位置
   */
  setObjectBallPosition(x, y) {
    if (!this.objectBall.locked) {
      this.objectBall.x = x;
      this.objectBall.y = y;
      this.notify();
    }
  }

  /**
   * 设置目标球类型
   */
  setObjectBallType(type) {
    this.objectBall.type = type;
    this.notify();
  }

  /**
   * 锁定/解锁目标球
   */
  toggleObjectBallLock() {
    this.objectBall.locked = !this.objectBall.locked;
    this.notify();
  }

  /**
   * 设置选中的袋口
   */
  setSelectedPocket(pocketId) {
    const pocket = this.config.table.pocketPositions.find(p => p.id === pocketId);
    if (pocket) {
      this.selectedPocket = pocket;
      this.notify();
    }
  }

  /**
   * 切换显示选项
   */
  toggleShowAimingLine() {
    this.showAimingLine = !this.showAimingLine;
    this.notify();
  }

  toggleShowPocketLine() {
    this.showPocketLine = !this.showPocketLine;
    this.notify();
  }

  toggleShowAngleLines() {
    this.showAngleLines = !this.showAngleLines;
    this.notify();
  }

  toggleShowThicknessGuide() {
    this.showThicknessGuide = !this.showThicknessGuide;
    this.notify();
  }

  toggleShowAimGuide() {
    this.showAimGuide = !this.showAimGuide;
    this.notify();
  }

  toggleShowGuideLine() {
    this.showGuideLine = !this.showGuideLine;
    this.notify();
  }

  toggleShowGrid() {
    this.showGrid = !this.showGrid;
    this.notify();
  }

  /**
   * 设置要显示的彩球
   * @param {string} ballType - 'all', 'red' 或具体颜色 'yellow', 'green', 'brown', 'blue', 'pink', 'black'
   */
  setSelectedColoredBalls(ballType) {
    this.selectedColoredBalls = ballType;

    // 如果选择了红球，随机生成位置
    if (ballType === 'red') {
      this.objectBall.type = 'red';
      // 生成随机位置（避开开球区和边界）
      const margin = 200; // 距离边界的最小距离
      const tableLength = this.config.table.playingArea.length;
      const tableWidth = this.config.table.playingArea.width;
      const baulkLine = this.config.table.baulkLine.distanceFromBottom;

      // 在开球线右侧随机生成位置
      this.objectBall.x = baulkLine + margin + Math.random() * (tableLength - baulkLine - margin * 2);
      this.objectBall.y = margin + Math.random() * (tableWidth - margin * 2);
      this.objectBall.locked = false; // 红球可以拖动
    }
    // 如果选择了特定彩球，将目标球设置为该彩球并移动到置球点
    else if (ballType !== 'all') {
      const spotPosition = this.config.spotPositions[ballType];
      if (spotPosition) {
        this.objectBall.type = ballType;
        this.objectBall.x = spotPosition.x;
        this.objectBall.y = spotPosition.y;
        this.objectBall.locked = true; // 彩球锁定
      }
    } else {
      // 显示全部时，解锁目标球，允许自由移动
      this.objectBall.locked = false;
    }

    this.notify();
  }

  /**
   * 加载预设场景
   */
  loadScenario(scenarioId) {
    const scenario = this.config.presetScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      this.cueBall.x = scenario.balls.cueBall.x;
      this.cueBall.y = scenario.balls.cueBall.y;

      this.objectBall.x = scenario.balls.objectBall.x;
      this.objectBall.y = scenario.balls.objectBall.y;
      this.objectBall.type = scenario.balls.objectBall.type;
      this.objectBall.locked = scenario.balls.objectBall.locked;

      this.setSelectedPocket(scenario.targetPocket);

      this.currentScenario = scenario;
      this.notify();
    }
  }

  /**
   * 开始拖拽
   */
  startDragging(ballType) {
    if (ballType === 'objectBall' && this.objectBall.locked) {
      return false;
    }
    this.dragging = ballType;
    return true;
  }

  /**
   * 停止拖拽
   */
  stopDragging() {
    this.dragging = null;
  }

  /**
   * 是否正在拖拽
   */
  isDragging() {
    return this.dragging !== null;
  }

  /**
   * 获取正在拖拽的球
   */
  getDraggingBall() {
    return this.dragging;
  }

  /**
   * 添加状态变化监听器
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * 移除监听器
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * 通知所有监听器状态已变化
   */
  notify() {
    this.listeners.forEach(callback => callback(this));
  }

  /**
   * 获取当前状态快照
   */
  getSnapshot() {
    return {
      cueBall: { ...this.cueBall },
      objectBall: { ...this.objectBall },
      selectedPocket: { ...this.selectedPocket },
      showAimingLine: this.showAimingLine,
      showPocketLine: this.showPocketLine,
      showAngleLines: this.showAngleLines,
      showThicknessGuide: this.showThicknessGuide,
      showAimGuide: this.showAimGuide,
      showGuideLine: this.showGuideLine,
      showGrid: this.showGrid,
      selectedColoredBalls: this.selectedColoredBalls
    };
  }
}
