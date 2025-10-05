/**
 * 辅助线渲染模块
 */

import { Geometry } from '../core/geometry.js';

export class LinesRenderer {
  constructor(ctx, config, scale = 1) {
    this.ctx = ctx;
    this.config = config;
    this.scale = scale;
    this.colors = config.visualization.colors;
    this.lineStyles = config.visualization.lineStyles;
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
   * 渲染所有辅助线
   */
  render(state) {
    const cueBall = state.cueBall;
    const objectBall = state.objectBall;
    const pocket = state.selectedPocket;

    // 绘制袋口线（目标球到袋口）
    if (state.showPocketLine) {
      this.drawPocketLine(objectBall, pocket);
    }

    // 绘制瞄准线（白球到瞄准点）
    if (state.showAimingLine) {
      this.drawAimingLine(cueBall, objectBall, pocket);
    }

    // 绘制角度标注
    if (state.showAngleLines) {
      this.drawAngleMarker(cueBall, objectBall, pocket);
    }

    // 绘制白球穿过目标球中心的辅助线
    if (state.showGuideLine) {
      this.drawCueBallThroughObjectLine(cueBall, objectBall);
    }
  }

  /**
   * 绘制白球穿过目标球中心的辅助线（延伸到球桌边缘）
   */
  drawCueBallThroughObjectLine(cueBall, objectBall) {
    const ctx = this.ctx;
    const { x: x1, y: y1 } = this.toCanvasCoord(cueBall.x, cueBall.y);
    const { x: x2, y: y2 } = this.toCanvasCoord(objectBall.x, objectBall.y);

    // 计算从白球穿过目标球的方向向量
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // 计算方向向量（单位向量）
    const dirX = dx / length;
    const dirY = dy / length;

    // 计算与球桌边缘的交点
    const tableLength = this.config.table.playingArea.length * this.scale;
    const tableWidth = this.config.table.playingArea.width * this.scale;

    // 从目标球位置开始延伸，找到与边缘的交点
    let intersectionX, intersectionY;
    let isRightAngle = false;

    // 计算射线与四条边的交点
    const intersections = [];

    // 上边 (y = 0)
    if (dirY < 0) {
      const t = (0 - y2) / dirY;
      const ix = x2 + t * dirX;
      if (ix >= 0 && ix <= tableLength && t > 0) {
        intersections.push({ x: ix, y: 0, edge: 'top' });
      }
    }

    // 下边 (y = tableWidth)
    if (dirY > 0) {
      const t = (tableWidth - y2) / dirY;
      const ix = x2 + t * dirX;
      if (ix >= 0 && ix <= tableLength && t > 0) {
        intersections.push({ x: ix, y: tableWidth, edge: 'bottom' });
      }
    }

    // 左边 (x = 0)
    if (dirX < 0) {
      const t = (0 - x2) / dirX;
      const iy = y2 + t * dirY;
      if (iy >= 0 && iy <= tableWidth && t > 0) {
        intersections.push({ x: 0, y: iy, edge: 'left' });
      }
    }

    // 右边 (x = tableLength)
    if (dirX > 0) {
      const t = (tableLength - x2) / dirX;
      const iy = y2 + t * dirY;
      if (iy >= 0 && iy <= tableWidth && t > 0) {
        intersections.push({ x: tableLength, y: iy, edge: 'right' });
      }
    }

    // 取最近的交点
    if (intersections.length > 0) {
      intersections.sort((a, b) => {
        const distA = Math.sqrt((a.x - x2) ** 2 + (a.y - y2) ** 2);
        const distB = Math.sqrt((b.x - x2) ** 2 + (b.y - y2) ** 2);
        return distA - distB;
      });

      const intersection = intersections[0];
      intersectionX = intersection.x;
      intersectionY = intersection.y;

      // 判断是否为直角（穿球线垂直于边缘）
      const angleThreshold = 2; // 允许2度误差
      if (intersection.edge === 'top' || intersection.edge === 'bottom') {
        // 上下边缘：垂直线的dirX应该接近0
        const angle = Math.abs(Math.atan2(dirY, dirX) * 180 / Math.PI);
        isRightAngle = Math.abs(angle - 90) < angleThreshold || Math.abs(angle + 90) < angleThreshold;
      } else {
        // 左右边缘：水平线的dirY应该接近0
        const angle = Math.abs(Math.atan2(dirY, dirX) * 180 / Math.PI);
        isRightAngle = Math.abs(angle) < angleThreshold || Math.abs(angle - 180) < angleThreshold;
      }
    }

    ctx.save();
    ctx.strokeStyle = this.colors.guideLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);  // 虚线样式

    ctx.beginPath();
    ctx.moveTo(x1, y1);  // 从白球开始
    if (intersectionX !== undefined && intersectionY !== undefined) {
      ctx.lineTo(intersectionX, intersectionY);  // 到交点
    } else {
      // 如果没有找到交点，使用原来的延长方式
      const extendFactor = 10;
      const extendedX = x1 + (dx / length) * length * extendFactor;
      const extendedY = y1 + (dy / length) * length * extendFactor;
      ctx.lineTo(extendedX, extendedY);
    }
    ctx.stroke();

    // 绘制直角标识
    if (isRightAngle && intersectionX !== undefined && intersectionY !== undefined) {
      this.drawRightAngleMarker(intersectionX, intersectionY, dirX, dirY);
    }

    ctx.restore();
  }

  /**
   * 绘制直角标识
   */
  drawRightAngleMarker(x, y, dirX, dirY) {
    const ctx = this.ctx;
    const markerSize = 15; // 直角标识的大小

    ctx.save();
    ctx.strokeStyle = '#FFD700'; // 金色
    ctx.lineWidth = 2;
    ctx.setLineDash([]); // 实线

    // 根据方向确定直角标识的朝向
    // 需要画一个小L形
    let cornerX1, cornerY1, cornerX2, cornerY2;

    // 计算垂直于穿球线的方向
    const perpX = -dirY;
    const perpY = dirX;

    // 根据碰撞边缘调整标识位置
    const epsilon = 0.001;
    const tableLength = this.config.table.playingArea.length * this.scale;
    const tableWidth = this.config.table.playingArea.width * this.scale;

    if (Math.abs(y) < epsilon) {
      // 上边缘
      cornerX1 = x - markerSize;
      cornerY1 = y + markerSize;
      cornerX2 = x + markerSize;
      cornerY2 = y + markerSize;
    } else if (Math.abs(y - tableWidth) < epsilon) {
      // 下边缘
      cornerX1 = x - markerSize;
      cornerY1 = y - markerSize;
      cornerX2 = x + markerSize;
      cornerY2 = y - markerSize;
    } else if (Math.abs(x) < epsilon) {
      // 左边缘
      cornerX1 = x + markerSize;
      cornerY1 = y - markerSize;
      cornerX2 = x + markerSize;
      cornerY2 = y + markerSize;
    } else if (Math.abs(x - tableLength) < epsilon) {
      // 右边缘
      cornerX1 = x - markerSize;
      cornerY1 = y - markerSize;
      cornerX2 = x - markerSize;
      cornerY2 = y + markerSize;
    }

    // 绘制L形直角标识
    ctx.beginPath();
    ctx.moveTo(cornerX1, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, cornerY1);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 绘制袋口线（从袋口穿过目标球延伸到球桌边缘）
   */
  drawPocketLine(objectBall, pocket) {
    const ctx = this.ctx;
    const { x: x1, y: y1 } = this.toCanvasCoord(objectBall.x, objectBall.y);
    const { x: x2, y: y2 } = this.toCanvasCoord(pocket.x, pocket.y);

    // 计算方向向量并延长到球桌边缘
    const dx = x1 - x2;
    const dy = y1 - y2;
    const length = Math.sqrt(dx * dx + dy * dy);

    // 延长线到球桌边缘（取一个足够大的倍数）
    const extendFactor = 10;
    const extendedX = x2 + (dx / length) * length * extendFactor;
    const extendedY = y2 + (dy / length) * length * extendFactor;

    const style = this.lineStyles.pocketLine;

    ctx.save();
    ctx.strokeStyle = this.colors.pocketLine;
    ctx.lineWidth = style.width;
    ctx.setLineDash(style.dash);

    ctx.beginPath();
    ctx.moveTo(x2, y2);  // 从袋口开始
    ctx.lineTo(extendedX, extendedY);  // 延伸到球桌外
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 绘制瞄准线（白球到瞄准点/假想球球心）
   */
  drawAimingLine(cueBall, objectBall, pocket) {
    const ctx = this.ctx;
    const ballRadius = this.config.ball.radius;

    // 计算瞄准点（假想球球心）
    const aimPoint = Geometry.calculateAimingPoint(
      cueBall,
      objectBall,
      pocket,
      ballRadius
    );

    const { x: x1, y: y1 } = this.toCanvasCoord(cueBall.x, cueBall.y);
    const { x: x2, y: y2 } = this.toCanvasCoord(aimPoint.x, aimPoint.y);

    const style = this.lineStyles.aimingLine;

    ctx.save();
    ctx.strokeStyle = this.colors.aimingLine;
    ctx.lineWidth = style.width;
    ctx.setLineDash(style.dash);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 绘制假想球（半透明）
    ctx.beginPath();
    ctx.arc(x2, y2, ballRadius * this.scale, 0, Math.PI * 2);
    ctx.strokeStyle = this.colors.aimingLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 绘制角度标注
   */
  drawAngleMarker(cueBall, objectBall, pocket) {
    const ctx = this.ctx;

    // 计算角度
    const angle = Geometry.calculateAimingAngle(cueBall, objectBall, pocket);

    const { x: centerX, y: centerY } = this.toCanvasCoord(objectBall.x, objectBall.y);

    // 计算两条线的角度
    // 第一条：目标球到袋口
    const angle1 = Geometry.angleRadians(objectBall, pocket);
    // 第二条：穿球线方向（从白球到目标球）
    const angle2 = Geometry.angleRadians(cueBall, objectBall);

    // 确定角度弧的方向
    let startAngle = angle1;
    let endAngle = angle2;
    if (angle2 < angle1) {
      [startAngle, endAngle] = [endAngle, startAngle];
    }

    // 绘制角度弧
    const arcRadius = 50 * this.scale;
    ctx.save();
    ctx.strokeStyle = this.colors.angleMark;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, startAngle, endAngle);
    ctx.stroke();

    // 绘制角度文本
    const midAngle = (startAngle + endAngle) / 2;
    const textRadius = arcRadius + 20;
    const textX = centerX + Math.cos(midAngle) * textRadius;
    const textY = centerY + Math.sin(midAngle) * textRadius;

    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = this.colors.angleMark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${angle.toFixed(1)}°`, textX, textY);

    ctx.restore();
  }

  /**
   * 绘制厚度示意（在目标球上显示接触区域）
   */
  drawThicknessGuide(cueBall, objectBall, pocket) {
    const ctx = this.ctx;
    const ballRadius = this.config.ball.radius;

    // 计算角度和cutPoint
    const angle = Geometry.calculateAimingAngle(cueBall, objectBall, pocket);
    const cutPoint = Math.cos(angle * Math.PI / 180);

    const { x: centerX, y: centerY } = this.toCanvasCoord(objectBall.x, objectBall.y);
    const radius = ballRadius * this.scale;

    // 计算袋口方向
    const pocketAngle = Geometry.angleRadians(objectBall, pocket);

    // 计算接触区域的角度范围
    const contactAngle = Math.asin(Math.sin(angle * Math.PI / 180));

    ctx.save();

    // 绘制接触区域（绿色半透明）
    ctx.fillStyle = 'rgba(144, 238, 144, 0.3)';
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius,
      pocketAngle + Math.PI - contactAngle,
      pocketAngle + Math.PI + contactAngle
    );
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // 绘制接触边界线
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // 左边界
    const leftAngle = pocketAngle + Math.PI - contactAngle;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(leftAngle) * radius,
      centerY + Math.sin(leftAngle) * radius
    );

    // 右边界
    const rightAngle = pocketAngle + Math.PI + contactAngle;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(rightAngle) * radius,
      centerY + Math.sin(rightAngle) * radius
    );

    ctx.stroke();

    ctx.restore();
  }

  /**
   * 绘制参考角度线（显示标准角度如30°、45°等）
   */
  drawReferenceAngles(objectBall, pocket) {
    const ctx = this.ctx;
    const { x: centerX, y: centerY } = this.toCanvasCoord(objectBall.x, objectBall.y);

    // 标准参考角度
    const referenceAngles = [30, 45, 60];
    const pocketAngle = Geometry.angleRadians(objectBall, pocket);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 5]);

    referenceAngles.forEach(angle => {
      const angleRad = angle * Math.PI / 180;
      const lineLength = 200 * this.scale;

      // 绘制两条参考线（角度的两边）
      const angle1 = pocketAngle + angleRad;
      const angle2 = pocketAngle - angleRad;

      [angle1, angle2].forEach(a => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(a) * lineLength,
          centerY + Math.sin(a) * lineLength
        );
        ctx.stroke();
      });
    });

    ctx.restore();
  }
}
