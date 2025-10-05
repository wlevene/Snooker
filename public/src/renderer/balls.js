/**
 * 球渲染模块
 */

export class BallsRenderer {
  constructor(ctx, config, scale = 1) {
    this.ctx = ctx;
    this.config = config;
    this.scale = scale;
    this.colors = config.visualization.colors;
    this.ballColors = config.balls;
  }

  /**
   * 设置缩放比例
   */
  setScale(scale) {
    this.scale = scale;
  }

  /**
   * 将实际坐标转换为Canvas坐标
   */
  toCanvasCoord(x, y) {
    return {
      x: x * this.scale,
      y: y * this.scale
    };
  }

  /**
   * 将Canvas坐标转换为实际坐标
   */
  fromCanvasCoord(x, y) {
    return {
      x: x / this.scale,
      y: y / this.scale
    };
  }

  /**
   * 渲染所有球
   */
  render(state) {
    // 先绘制目标球，再绘制白球（保证白球在上层）
    this.renderObjectBall(state.objectBall);
    this.renderCueBall(state.cueBall);
  }

  /**
   * 渲染白球
   */
  renderCueBall(cueBall) {
    const ctx = this.ctx;
    const { x, y } = this.toCanvasCoord(cueBall.x, cueBall.y);
    const radius = this.config.ball.radius * this.scale;

    // 绘制球体
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = this.ballColors.white.color;
    ctx.fill();

    // 绘制球体边框
    ctx.strokeStyle = this.colors.cueBallBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 添加高光效果
    this.drawHighlight(x, y, radius);
  }

  /**
   * 渲染目标球
   */
  renderObjectBall(objectBall) {
    const ctx = this.ctx;
    const { x, y } = this.toCanvasCoord(objectBall.x, objectBall.y);
    const radius = this.config.ball.radius * this.scale;

    // 获取球的颜色
    const ballType = this.ballColors[objectBall.type];
    const color = ballType ? ballType.color : this.ballColors.red.color;

    // 绘制球体
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // 绘制球体边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 添加高光效果
    this.drawHighlight(x, y, radius);

    // 如果球被锁定，绘制锁定标记
    if (objectBall.locked) {
      this.drawLockIcon(x, y, radius);
    }
  }

  /**
   * 绘制高光效果
   */
  drawHighlight(x, y, radius) {
    const ctx = this.ctx;

    // 创建径向渐变
    const gradient = ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      radius * 0.1,
      x,
      y,
      radius
    );

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  /**
   * 绘制锁定图标
   */
  drawLockIcon(x, y, radius) {
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;

    // 绘制锁的主体（矩形）
    const lockSize = radius * 0.5;
    ctx.fillRect(x - lockSize / 2, y - lockSize / 4, lockSize, lockSize / 1.5);

    // 绘制锁的弧形部分
    ctx.beginPath();
    ctx.arc(x, y - lockSize / 4, lockSize / 3, Math.PI, 0, false);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 检查点击位置是否在球上
   */
  isPointOnBall(point, ball) {
    const ballPos = this.toCanvasCoord(ball.x, ball.y);
    const radius = this.config.ball.radius * this.scale;
    const dx = point.x - ballPos.x;
    const dy = point.y - ballPos.y;
    return (dx * dx + dy * dy) <= (radius * radius);
  }

  /**
   * 检查点击位置是否在白球上
   */
  isPointOnCueBall(point, cueBall) {
    return this.isPointOnBall(point, cueBall);
  }

  /**
   * 检查点击位置是否在目标球上
   */
  isPointOnObjectBall(point, objectBall) {
    return this.isPointOnBall(point, objectBall);
  }
}
