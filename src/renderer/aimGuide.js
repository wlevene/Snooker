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

    // 球的中心位置和半径
    const centerX = width / 2;
    const centerY = height * 0.5; // 稍微往上一点，给瞄准线留空间
    const radius = Math.min(width, height) * 0.28;

    // 绘制目标球（俯视图）
    this.drawTargetBall(centerX, centerY, radius);

    // 绘制接触区域
    this.drawContactArea(centerX, centerY, radius, angle, aimingData);

    // 绘制瞄准线（最后绘制，确保在最上层）
    this.drawAimLine(centerX, centerY, radius, angle, aimingData);
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
   * 绘制瞄准线（红色竖线）和辅助瞄准线
   *
   * 原理：
   * - 假设袋口在正上方（12点方向）
   * - 白球从下方某个角度打来
   * - 需要计算假想球（ghost ball）的球心位置
   * - 假想球球心 = 目标球球心 - 袋口方向 * (2 * 球半径)
   * - 然后根据角度偏移假想球位置
   */
  drawAimLine(x, y, radius, angle, aimingData) {
    const ctx = this.ctx;

    // 袋口在正上方（角度为90度，即-π/2弧度）
    const pocketAngle = -Math.PI / 2;

    // 角度转弧度
    const angleRad = angle * Math.PI / 180;

    // 计算假想球球心位置
    // 假想球在袋口反方向，距离为2倍球半径
    const ghostX = x - Math.cos(pocketAngle) * (2 * radius);
    const ghostY = y - Math.sin(pocketAngle) * (2 * radius);

    // 根据角度，假想球需要偏移
    // 使用正弦定理：瞄准点偏移 = 球半径 * sin(角度)
    const aimOffset = 2 * radius * Math.sin(angleRad);

    // 瞄准点x坐标（向右偏移）
    const aimX = x + aimOffset;

    const lineTop = 20;
    const lineBottom = this.canvas.height - 20;

    // 球的直径（用于辅助线间距）
    const ballDiameter = radius * 2;

    // 绘制左侧辅助线（虚线）
    const leftAuxX = aimX - ballDiameter;
    ctx.strokeStyle = '#FF6B6B'; // 稍浅的红色
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // 虚线

    ctx.beginPath();
    ctx.moveTo(leftAuxX, lineTop);
    ctx.lineTo(leftAuxX, lineBottom);
    ctx.stroke();

    // 绘制右侧辅助线（虚线）
    const rightAuxX = aimX + ballDiameter;
    ctx.beginPath();
    ctx.moveTo(rightAuxX, lineTop);
    ctx.lineTo(rightAuxX, lineBottom);
    ctx.stroke();

    // 绘制主瞄准线（红色实线）
    ctx.strokeStyle = this.colors.aimGuideAimLine;
    ctx.lineWidth = 3;
    ctx.setLineDash([]); // 实线

    ctx.beginPath();
    ctx.moveTo(aimX, lineTop);
    ctx.lineTo(aimX, lineBottom);
    ctx.stroke();

    // 绘制瞄准点标记（箭头）
    this.drawArrow(aimX, lineTop - 5, 12);

    // 绘制文本标注
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = this.colors.aimGuideAimLine;
    ctx.textAlign = 'center';
    ctx.fillText('瞄准点', aimX, lineBottom + 15);
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
