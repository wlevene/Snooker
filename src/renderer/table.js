/**
 * 球桌渲染模块
 */

export class TableRenderer {
  constructor(ctx, config, scale = 1) {
    this.ctx = ctx;
    this.config = config;
    this.scale = scale;
    this.colors = config.visualization.colors;
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
   * 渲染整个球桌
   */
  render(showGrid = false) {
    const ctx = this.ctx;
    const table = this.config.table;

    // 清空画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制台面
    this.drawTableSurface();

    // 绘制网格（如果启用）
    if (showGrid) {
      this.drawGrid();
    }

    // 绘制库边
    this.drawCushions();

    // 绘制袋口
    this.drawPockets();

    // 绘制开球线和D区
    this.drawBaulkLineAndD();
  }

  /**
   * 绘制台面
   */
  drawTableSurface() {
    const ctx = this.ctx;
    const table = this.config.table;

    // 修正：length是横向(宽)，width是纵向(高)
    const width = table.playingArea.length * this.scale;
    const height = table.playingArea.width * this.scale;

    // 台面背景
    ctx.fillStyle = this.colors.table;
    ctx.fillRect(0, 0, width, height);

    // 台面边框
    ctx.strokeStyle = this.colors.tableBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  }

  /**
   * 绘制库边
   */
  drawCushions() {
    const ctx = this.ctx;
    const table = this.config.table;
    const cushionHeight = table.cushion.height * this.scale;

    ctx.strokeStyle = this.colors.cushion;
    ctx.lineWidth = cushionHeight;

    const width = table.playingArea.length * this.scale;
    const height = table.playingArea.width * this.scale;

    // 绘制库边（在台面边缘内侧）
    const offset = cushionHeight / 2;
    ctx.strokeRect(offset, offset, width - cushionHeight, height - cushionHeight);
  }

  /**
   * 绘制袋口
   */
  drawPockets() {
    const ctx = this.ctx;
    const pockets = this.config.table.pocketPositions;

    ctx.fillStyle = this.colors.pocket;

    pockets.forEach(pocket => {
      const { x, y } = this.toCanvasCoord(pocket.x, pocket.y);
      const radius = (pocket.id.includes('middle') ?
        this.config.table.pockets.middle.width :
        this.config.table.pockets.corner.width) * this.scale / 2;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * 绘制开球线和D区
   */
  drawBaulkLineAndD() {
    const ctx = this.ctx;
    const table = this.config.table;
    const baulkLineDistFromLeft = table.baulkLine.distanceFromBottom; // 实际是距离左边的距离
    const dRadius = table.dArea.radius;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;

    // 绘制开球线（竖线）- 距离左库737mm
    const tableHeight = table.playingArea.width * this.scale;
    const baulkX = baulkLineDistFromLeft * this.scale;

    ctx.beginPath();
    ctx.moveTo(baulkX, 0);
    ctx.lineTo(baulkX, tableHeight);
    ctx.stroke();

    // 绘制D区（半圆）- 中心在开球线上，球桌中心高度
    const dCenterX = baulkX;
    const dCenterY = (table.playingArea.width / 2) * this.scale;
    const scaledRadius = dRadius * this.scale;

    ctx.beginPath();
    // 半圆朝左（圆弧靠近左边底库），从下到上（逆时针）
    ctx.arc(dCenterX, dCenterY, scaledRadius, Math.PI/2, -Math.PI/2);
    ctx.stroke();

    // 绘制置球点
    this.drawSpots();
  }

  /**
   * 绘制网格辅助线（纵向7等分 × 横向4等分）
   */
  drawGrid() {
    const ctx = this.ctx;
    const table = this.config.table;
    const tableLength = table.playingArea.length * this.scale; // 横向（宽）
    const tableWidth = table.playingArea.width * this.scale;   // 纵向（高）

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // 半透明白色
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // 虚线

    // 纵向线（横向7等分）- 分成7份，需要6条线
    const horizontalSegments = 7;
    const horizontalStep = tableLength / horizontalSegments;

    for (let i = 1; i < horizontalSegments; i++) {
      const x = horizontalStep * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, tableWidth);
      ctx.stroke();
    }

    // 横向线（纵向4等分）- 分成4份，需要3条线
    const verticalSegments = 4;
    const verticalStep = tableWidth / verticalSegments;

    for (let i = 1; i < verticalSegments; i++) {
      const y = verticalStep * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(tableLength, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 绘制置球点
   */
  drawSpots() {
    const ctx = this.ctx;
    const spots = this.config.spotPositions;

    ctx.fillStyle = '#FFFFFF';

    Object.values(spots).forEach(spot => {
      const { x, y } = this.toCanvasCoord(spot.x, spot.y);
      const spotRadius = 2;

      ctx.beginPath();
      ctx.arc(x, y, spotRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * 绘制袋口标记（用于选择）
   */
  drawPocketMarkers(selectedPocketId) {
    const ctx = this.ctx;
    const pockets = this.config.table.pocketPositions;

    pockets.forEach(pocket => {
      const { x, y } = this.toCanvasCoord(pocket.x, pocket.y);
      const isSelected = pocket.id === selectedPocketId;

      // 绘制袋口名称
      ctx.font = '12px Arial';
      ctx.fillStyle = isSelected ? '#FFD700' : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 根据袋口位置调整文字位置
      let offsetX = 0, offsetY = 0;
      if (pocket.id.includes('top')) offsetY = -20;
      if (pocket.id.includes('bottom')) offsetY = 20;
      if (pocket.id.includes('left')) offsetX = 20;
      if (pocket.id.includes('right')) offsetX = -20;

      // 绘制选中标记
      if (isSelected) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 15 * this.scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }
}
