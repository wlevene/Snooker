/**
 * 缩略图生成器
 * 生成小的球桌缩略图用于收藏预览
 */

export class ThumbnailGenerator {
  constructor(config) {
    this.config = config;
    this.width = 200;
    this.height = 100;
    this.scale = this.width / config.table.playingArea.length;
  }

  /**
   * 生成缩略图
   * @param {Object} state - 当前状态
   * @returns {String} base64图片数据
   */
  generate(state) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');

    // 绘制球桌
    this.drawTable(ctx);

    // 绘制袋口标记
    this.drawPockets(ctx, state.selectedPocket);

    // 绘制瞄准线和袋口线
    this.drawLines(ctx, state);

    // 绘制球
    this.drawBalls(ctx, state);

    // 转换为base64
    return canvas.toDataURL('image/png');
  }

  /**
   * 绘制球桌
   */
  drawTable(ctx) {
    const { table } = this.config;

    // 球桌背景
    ctx.fillStyle = '#1a7a3e';
    ctx.fillRect(0, 0, this.width, this.height);

    // 球桌边框
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);

    // 开球线（D区）
    const baulkX = table.baulkLine.distanceFromBottom * this.scale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baulkX, 0);
    ctx.lineTo(baulkX, this.height);
    ctx.stroke();

    // D区半圆
    const dRadius = table.dArea.radius * this.scale;
    const dCenterX = table.dArea.centerFromBottom * this.scale;
    const dCenterY = this.height / 2;

    ctx.beginPath();
    ctx.arc(dCenterX, dCenterY, dRadius, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  /**
   * 绘制袋口
   */
  drawPockets(ctx, selectedPocket) {
    const pockets = this.config.table.pocketPositions;

    pockets.forEach(pocket => {
      const x = pocket.x * this.scale;
      const y = pocket.y * this.scale;

      // 选中的袋口用黄色，其他用黑色
      if (pocket.id === selectedPocket.id) {
        ctx.fillStyle = '#FFD700';
      } else {
        ctx.fillStyle = '#000000';
      }

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * 绘制辅助线
   */
  drawLines(ctx, state) {
    const cueBall = state.cueBall;
    const objectBall = state.objectBall;
    const pocket = state.selectedPocket;

    const cueBallX = cueBall.x * this.scale;
    const cueBallY = cueBall.y * this.scale;
    const objectBallX = objectBall.x * this.scale;
    const objectBallY = objectBall.y * this.scale;
    const pocketX = pocket.x * this.scale;
    const pocketY = pocket.y * this.scale;

    // 袋口线（橙色虚线）
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(objectBallX, objectBallY);
    ctx.lineTo(pocketX, pocketY);
    ctx.stroke();

    // 瞄准线（黄色实线）
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cueBallX, cueBallY);
    ctx.lineTo(objectBallX, objectBallY);
    ctx.stroke();
  }

  /**
   * 绘制球
   */
  drawBalls(ctx, state) {
    const ballRadius = this.config.ball.radius * this.scale;

    // 绘制目标球
    const objectBall = state.objectBall;
    const objectBallX = objectBall.x * this.scale;
    const objectBallY = objectBall.y * this.scale;

    const ballColor = this.config.balls[objectBall.type]?.color || '#DC143C';

    ctx.fillStyle = ballColor;
    ctx.beginPath();
    ctx.arc(objectBallX, objectBallY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 绘制白球
    const cueBall = state.cueBall;
    const cueBallX = cueBall.x * this.scale;
    const cueBallY = cueBall.y * this.scale;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cueBallX, cueBallY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}
