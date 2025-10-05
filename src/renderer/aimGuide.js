/**
 * 瞄准示意图渲染模块
 * 在控制面板上绘制一个小圆球，显示瞄准点位置
 */

import { Geometry } from '../core/geometry.js';

export class AimGuideRenderer {
  constructor(config) {
    this.config = config;
    this.colors = config.visualization.colors;
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * 设置Canvas
   */
  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * 渲染瞄准示意图
   * @param {number} angle - 当前角度（度数）
   * @param {Object} aimingData - 瞄准数据
   */
  render(angle, aimingData) {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景
    ctx.fillStyle = this.colors.aimGuideBackground;
    ctx.fillRect(0, 0, width, height);

    // 绘制边框
    ctx.strokeStyle = this.colors.aimGuideBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // 球的中心位置
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // 绘制目标球（俯视图）
    this.drawTargetBall(centerX, centerY, radius);

    // 绘制瞄准线
    this.drawAimLine(centerX, centerY, radius, angle, aimingData);

    // 绘制接触区域
    this.drawContactArea(centerX, centerY, radius, angle, aimingData);
  }

  /**
   * 绘制目标球
   */
  drawTargetBall(x, y, radius) {
    const ctx = this.ctx;

    // 绘制球体
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 绘制球体边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 绘制球心
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#999999';
    ctx.fill();

    // 绘制水平和垂直参考线
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // 水平线
    ctx.beginPath();
    ctx.moveTo(x - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.stroke();

    // 垂直线
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x, y + radius);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  /**
   * 绘制瞄准线（红色竖线）
   */
  drawAimLine(x, y, radius, angle, aimingData) {
    const ctx = this.ctx;

    // 计算瞄准点的位置
    // 假设袋口在正上方（0度），白球在下方某个角度
    const cutPoint = aimingData.actualCutPoint || aimingData.cutPoint;

    // 瞄准点在球上的偏移量（水平方向）
    // cutPoint = cos(angle)，表示接触点的水平偏移比例
    const offsetX = radius * (1 - cutPoint);

    // 绘制瞄准线（红色竖线）
    ctx.strokeStyle = this.colors.aimGuideAimLine;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x + offsetX, y - radius * 1.2);
    ctx.lineTo(x + offsetX, y + radius * 1.2);
    ctx.stroke();

    // 绘制瞄准点标记（箭头）
    this.drawArrow(x + offsetX, y - radius * 1.3, 10);

    // 绘制cutPoint文本
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = this.colors.aimGuideAimLine;
    ctx.textAlign = 'center';
    ctx.fillText(
      `瞄准点`,
      x + offsetX,
      y + radius * 1.5
    );
  }

  /**
   * 绘制箭头
   */
  drawArrow(x, y, size) {
    const ctx = this.ctx;

    ctx.fillStyle = this.colors.aimGuideAimLine;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size / 2, y - size);
    ctx.lineTo(x + size / 2, y - size);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 绘制接触区域
   */
  drawContactArea(x, y, radius, angle, aimingData) {
    const ctx = this.ctx;

    const cutPoint = aimingData.actualCutPoint || aimingData.cutPoint;
    const angleRad = angle * Math.PI / 180;

    // 计算接触区域的角度范围
    const contactAngle = Math.asin(Math.sin(angleRad));

    // 绘制接触区域（绿色半透明）
    ctx.fillStyle = this.colors.aimGuideContact;
    ctx.globalAlpha = 0.5;

    ctx.beginPath();
    ctx.arc(
      x,
      y,
      radius,
      Math.PI / 2 - contactAngle,
      Math.PI / 2 + contactAngle
    );
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1.0;

    // 绘制接触区域边界
    ctx.strokeStyle = '#00AA00';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(
      x,
      y,
      radius,
      Math.PI / 2 - contactAngle,
      Math.PI / 2 + contactAngle
    );
    ctx.stroke();

    // 绘制接触边界线
    const leftAngle = Math.PI / 2 - contactAngle;
    const rightAngle = Math.PI / 2 + contactAngle;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(leftAngle) * radius, y + Math.sin(leftAngle) * radius);
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(rightAngle) * radius, y + Math.sin(rightAngle) * radius);
    ctx.stroke();
  }

  /**
   * 绘制标注信息
   */
  drawLabels(angle, aimingData) {
    const ctx = this.ctx;
    const width = this.canvas.width;

    ctx.font = '11px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';

    // 顶部标注
    ctx.fillText(
      `角度: ${angle.toFixed(1)}° | 厚度: ${aimingData.thickness}`,
      width / 2,
      15
    );

    // 底部标注
    ctx.fillText(
      `接触比例: ${aimingData.contactRatio}`,
      width / 2,
      this.canvas.height - 10
    );
  }
}
