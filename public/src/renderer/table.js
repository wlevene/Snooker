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
  render(showGrid = false, selectedColoredBalls = 'all') {
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

    // 绘制彩球
    if (selectedColoredBalls) {
      this.drawColoredBalls(selectedColoredBalls);
    }
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
   * 绘制网格辅助线（纵向8等分 × 横向4等分）
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

    // 纵向线（横向8等分）- 分成8份，需要7条线
    const horizontalSegments = 8;
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
   * 绘制彩球在置球点位置
   * @param {string} selectedBalls - 'all' 或具体颜色
   */
  drawColoredBalls(selectedBalls = 'all') {
    const ctx = this.ctx;
    const spots = this.config.spotPositions;
    const ballRadius = this.config.ball.radius * this.scale;

    // 定义每个彩球的颜色
    const ballColors = {
      yellow: this.config.balls.yellow.color,
      green: this.config.balls.green.color,
      brown: this.config.balls.brown.color,
      blue: this.config.balls.blue.color,
      pink: this.config.balls.pink.color,
      black: this.config.balls.black.color
    };

    // 绘制每个彩球
    Object.entries(spots).forEach(([ballType, spot]) => {
      // 如果选择了特定彩球（不是all），则不在置球点绘制该球
      // 因为目标球已经在那个位置了
      if (selectedBalls !== 'all') {
        // 特定彩球模式：不绘制任何置球点上的球
        return;
      }

      // 显示全部模式：绘制所有彩球
      if (selectedBalls === 'all') {
        const { x, y } = this.toCanvasCoord(spot.x, spot.y);
        const color = ballColors[ballType];

        // 绘制球体
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // 绘制球体边框
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 添加高光效果
        const gradient = ctx.createRadialGradient(
          x - ballRadius * 0.3,
          y - ballRadius * 0.3,
          ballRadius * 0.1,
          x,
          y,
          ballRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    });
  }

  /**
   * 绘制袋口标记（用于选择）和编号
   */
  drawPocketMarkers(selectedPocketId) {
    const ctx = this.ctx;
    const pockets = this.config.table.pocketPositions;

    // 袋口编号映射
    const pocketLabels = {
      'top-left': 'A',
      'middle-top': 'B',
      'top-right': 'C',
      'bottom-right': 'D',
      'middle-bottom': 'E',
      'bottom-left': 'F'
    };

    ctx.save();

    pockets.forEach(pocket => {
      const { x, y } = this.toCanvasCoord(pocket.x, pocket.y);
      const isSelected = pocket.id === selectedPocketId;

      // 根据袋口位置调整文字位置
      let offsetX = 0, offsetY = 0;
      if (pocket.id === 'top-left') {
        offsetX = 35;
        offsetY = 25;
      } else if (pocket.id === 'middle-top') {
        offsetX = 0;
        offsetY = 30;
      } else if (pocket.id === 'top-right') {
        offsetX = -35;
        offsetY = 25;
      } else if (pocket.id === 'bottom-right') {
        offsetX = -35;
        offsetY = -25;
      } else if (pocket.id === 'middle-bottom') {
        offsetX = 0;
        offsetY = -30;
      } else if (pocket.id === 'bottom-left') {
        offsetX = 35;
        offsetY = -25;
      }

      const label = pocketLabels[pocket.id];

      // 绘制袋口编号
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 描边（黑色）
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(label, x + offsetX, y + offsetY);

      // 填充（白色或金色）
      ctx.fillStyle = isSelected ? '#FFD700' : '#FFFFFF';
      ctx.fillText(label, x + offsetX, y + offsetY);

      // 绘制选中标记
      if (isSelected) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 15 * this.scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.restore();
  }
}
