/**
 * 位置参考圆渲染模块
 * 在目标球周围绘制虚线圆和虚线小球，帮助理解位置关系
 */

export class PositionCircleRenderer {
  constructor(ctx, config, scale = 1) {
    this.ctx = ctx;
    this.config = config;
    this.scale = scale;
    
    // 半米距离（像素）- 根据球桌比例计算
    // 标准斯诺克球桌长度为3.6米，对应3569像素，所以0.5米约为496像素
    this.circleRadius = 496;
    
    // 球的标准半径（米）
    this.ballRadius = 0.026; // 斯诺克球半径约2.6厘米
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
   * 渲染位置参考圆
   */
  render(state) {
    if (!state.showPositionCircle || !state.objectBall || !state.selectedPocket) {
      return;
    }

    const objectBall = state.objectBall;
    const selectedPocket = state.selectedPocket;
    const center = this.toCanvasCoord(objectBall.x, objectBall.y);
    const pocketPos = this.toCanvasCoord(selectedPocket.x, selectedPocket.y);
    const ballRadius = this.config.ball.radius * this.scale;
    
    // 计算从目标球边缘开始的圆弧半径
    const radius = this.circleRadius * this.scale + ballRadius;

    // 绘制虚线圆弧（1/4圆）
    this.drawDashedArc(center.x, center.y, radius, pocketPos.x, pocketPos.y, ballRadius);

    // 绘制圆弧上的虚线小球
    this.drawArcBalls(center.x, center.y, radius, ballRadius, pocketPos.x, pocketPos.y);
  }

  /**
   * 绘制虚线圆弧（1/4圆）
   */
  drawDashedArc(centerX, centerY, radius, pocketX, pocketY, ballRadius) {
    this.ctx.save();
    this.ctx.setLineDash([10, 5]);
    this.ctx.strokeStyle = '#888888';
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.6;

    // 计算目标袋口到目标球的角度（这是延长线的方向）
    const dx = centerX - pocketX; // 从袋口指向目标球
    const dy = centerY - pocketY;
    const pocketToBallAngle = Math.atan2(dy, dx);
    
    // 1/4圆弧：以袋口-目标球延长线为起始，顺时针90度
    const startAngle = pocketToBallAngle; // 起始角度：袋口到目标球的延长线方向
    const endAngle = pocketToBallAngle + Math.PI / 2; // 结束角度：顺时针90度

    // 圆弧半径：向外偏移一个球半径，使虚拟球边缘贴着延长线
    const arcRadius = radius + ballRadius;

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, arcRadius, startAngle, endAngle);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * 绘制圆弧上的虚线小球 - 只在1/4圆弧范围内
   */
  drawArcBalls(centerX, centerY, circleRadius, ballRadius, pocketX, pocketY) {
    this.ctx.save();
    
    // 设置虚线小球样式 - 白色虚线，紧密相连
    this.ctx.setLineDash([2, 1]); // 更短的虚线间隔
    this.ctx.strokeStyle = '#FFFFFF'; // 白色
    this.ctx.lineWidth = 1.5;
    this.ctx.globalAlpha = 0.8;

    // 计算目标袋口到目标球的角度（这是延长线的方向）
    const dx = centerX - pocketX; // 从袋口指向目标球
    const dy = centerY - pocketY;
    const pocketToBallAngle = Math.atan2(dy, dx);
    
    // 1/4圆弧范围：以袋口-目标球延长线为起始，顺时针90度
    const startAngle = pocketToBallAngle; // 起始角度
    const endAngle = pocketToBallAngle + Math.PI / 2; // 结束角度
    const arcLength = Math.PI / 2; // 90度弧长
    
    // 计算弧长（像素）
    const arcLengthPixels = arcLength * circleRadius;
    
    // 计算小球直径（像素）
    const ballDiameter = ballRadius * 2;
    
    // 计算能容纳的小球数量（让小球紧密相连）
    const ballCount = Math.floor(arcLengthPixels / ballDiameter);
    
    // 实际的角度间隔
    const angleStep = arcLength / ballCount;

    // 绘制密密麻麻的小球（只在1/4圆弧范围内）
    for (let i = 0; i < ballCount; i++) {
      const angle = startAngle + i * angleStep;
      
      // 计算小球中心位置：向外偏移一个球半径，使球边缘贴着延长线
      const ballCenterRadius = circleRadius + ballRadius;
      const ballX = centerX + ballCenterRadius * Math.cos(angle);
      const ballY = centerY + ballCenterRadius * Math.sin(angle);

      // 绘制白色虚线小球（只绘制边框，不填充）
      this.ctx.beginPath();
      this.ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * 检查点是否在位置参考圆上
   */
  isPointOnCircle(point, objectBall) {
    const dx = point.x - objectBall.x;
    const dy = point.y - objectBall.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const tolerance = 20; // 容差范围
    
    return Math.abs(distance - this.circleRadius) <= tolerance;
  }

  /**
   * 获取最近的小球位置
   */
  getNearestBallPosition(mouseX, mouseY, centerX, centerY, circleRadius, ballRadius) {
    // 计算圆周长和小球数量
    const circumference = 2 * Math.PI * circleRadius;
    const ballDiameter = ballRadius * 2;
    const ballCount = Math.floor(circumference / ballDiameter);
    const angleStep = (2 * Math.PI) / ballCount;
    
    let nearestAngle = 0;
    let minDistance = Infinity;

    for (let i = 0; i < ballCount; i++) {
      const angle = i * angleStep;
      const ballX = centerX + circleRadius * Math.cos(angle);
      const ballY = centerY + circleRadius * Math.sin(angle);
      
      const distance = Math.sqrt((mouseX - ballX) ** 2 + (mouseY - ballY) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        nearestAngle = angle;
      }
    }

    return {
      x: centerX + circleRadius * Math.cos(nearestAngle),
      y: centerY + circleRadius * Math.sin(nearestAngle),
      angle: nearestAngle
    };
  }
}