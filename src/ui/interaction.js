/**
 * 交互功能模块
 * 处理鼠标拖拽等交互
 */

export class Interaction {
  constructor(canvas, state, ballsRenderer) {
    this.canvas = canvas;
    this.state = state;
    this.ballsRenderer = ballsRenderer;

    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));

    // 触摸事件支持
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  /**
   * 获取鼠标/触摸位置
   */
  getEventPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  /**
   * 鼠标按下
   */
  onMouseDown(event) {
    const pos = this.getEventPosition(event);

    // 检查是否点击在白球上
    if (this.ballsRenderer.isPointOnCueBall(pos, this.state.cueBall)) {
      this.isDragging = true;
      this.state.startDragging('cueBall');

      const canvasPos = this.ballsRenderer.toCanvasCoord(
        this.state.cueBall.x,
        this.state.cueBall.y
      );
      this.dragOffset.x = pos.x - canvasPos.x;
      this.dragOffset.y = pos.y - canvasPos.y;

      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // 检查是否点击在目标球上
    if (this.ballsRenderer.isPointOnObjectBall(pos, this.state.objectBall)) {
      if (!this.state.objectBall.locked) {
        this.isDragging = true;
        this.state.startDragging('objectBall');

        const canvasPos = this.ballsRenderer.toCanvasCoord(
          this.state.objectBall.x,
          this.state.objectBall.y
        );
        this.dragOffset.x = pos.x - canvasPos.x;
        this.dragOffset.y = pos.y - canvasPos.y;

        this.canvas.style.cursor = 'grabbing';
      }
      return;
    }
  }

  /**
   * 鼠标移动
   */
  onMouseMove(event) {
    const pos = this.getEventPosition(event);

    if (this.isDragging) {
      // 计算新位置
      const newPos = this.ballsRenderer.fromCanvasCoord(
        pos.x - this.dragOffset.x,
        pos.y - this.dragOffset.y
      );

      // 限制在球桌范围内
      const ballRadius = this.state.getBallRadius();
      const tableLength = this.state.config.table.playingArea.length;
      const tableWidth = this.state.config.table.playingArea.width;

      newPos.x = Math.max(ballRadius, Math.min(tableLength - ballRadius, newPos.x));
      newPos.y = Math.max(ballRadius, Math.min(tableWidth - ballRadius, newPos.y));

      // 更新球的位置
      const draggingBall = this.state.getDraggingBall();
      if (draggingBall === 'cueBall') {
        this.state.setCueBallPosition(newPos.x, newPos.y);
      } else if (draggingBall === 'objectBall') {
        this.state.setObjectBallPosition(newPos.x, newPos.y);
      }
    } else {
      // 更新鼠标样式
      if (this.ballsRenderer.isPointOnCueBall(pos, this.state.cueBall) ||
          (this.ballsRenderer.isPointOnObjectBall(pos, this.state.objectBall) &&
           !this.state.objectBall.locked)) {
        this.canvas.style.cursor = 'grab';
      } else {
        this.canvas.style.cursor = 'default';
      }
    }
  }

  /**
   * 鼠标释放
   */
  onMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.state.stopDragging();
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * 鼠标离开
   */
  onMouseLeave(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.state.stopDragging();
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * 触摸开始
   */
  onTouchStart(event) {
    event.preventDefault();
    this.onMouseDown(event);
  }

  /**
   * 触摸移动
   */
  onTouchMove(event) {
    event.preventDefault();
    this.onMouseMove(event);
  }

  /**
   * 触摸结束
   */
  onTouchEnd(event) {
    event.preventDefault();
    this.onMouseUp(event);
  }
}
