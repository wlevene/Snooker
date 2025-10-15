/**
 * 控制面板UI模块
 */

import { Geometry } from '../core/geometry.js';

export class Controls {
  constructor(state, aimGuideRenderer) {
    this.state = state;
    this.aimGuideRenderer = aimGuideRenderer;

    this.elements = {
      angleInfo: null,
      aimGuideCanvas: null,
      pocketButtons: [],
      scenarioButtons: [],
      toggleButtons: {}
    };

    this.setupUI();
    this.bindEvents();

    // 监听状态变化
    this.state.addListener(this.onStateChange.bind(this));
  }

  /**
   * 设置UI元素
   */
  setupUI() {
    // 角度信息面板
    this.elements.angleInfo = document.getElementById('angle-info');

    // 瞄准示意图Canvas
    this.elements.aimGuideCanvas = document.getElementById('aim-guide-canvas');
    if (this.elements.aimGuideCanvas) {
      this.aimGuideRenderer.setCanvas(this.elements.aimGuideCanvas);
    }

    // 袋口选择按钮
    this.state.config.table.pocketPositions.forEach(pocket => {
      const btn = document.getElementById(`pocket-${pocket.id}`);
      if (btn) {
        this.elements.pocketButtons.push({ id: pocket.id, element: btn });
      }
    });

    // 彩球选择按钮
    this.elements.ballButtons = {
      all: document.getElementById('ball-all'),
      red: document.getElementById('ball-red'),
      yellow: document.getElementById('ball-yellow'),
      green: document.getElementById('ball-green'),
      brown: document.getElementById('ball-brown'),
      blue: document.getElementById('ball-blue'),
      pink: document.getElementById('ball-pink'),
      black: document.getElementById('ball-black')
    };

    // 显示选项开关
    this.elements.toggleButtons = {
      aimingLine: document.getElementById('toggle-aiming-line'),
      pocketLine: document.getElementById('toggle-pocket-line'),
      angleLines: document.getElementById('toggle-angle-lines'),
      thicknessGuide: document.getElementById('toggle-thickness-guide'),
      guideLine: document.getElementById('toggle-guide-line'),
      grid: document.getElementById('toggle-grid'),
      positionCircle: document.getElementById('toggle-position-circle')
    };
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 袋口选择
    this.elements.pocketButtons.forEach(({ id, element }) => {
      if (element) {
        element.addEventListener('click', () => {
          this.state.setSelectedPocket(id);
        });
      }
    });

    // 彩球选择按钮事件
    Object.entries(this.elements.ballButtons).forEach(([ballType, button]) => {
      if (button) {
        button.addEventListener('click', () => {
          this.state.setSelectedColoredBalls(ballType);
          // 更新按钮状态
          this.updateBallButtons(ballType);
        });
      }
    });

    // 显示选项
    if (this.elements.toggleButtons.aimingLine) {
      this.elements.toggleButtons.aimingLine.addEventListener('change', (e) => {
        this.state.toggleShowAimingLine();
      });
    }

    if (this.elements.toggleButtons.pocketLine) {
      this.elements.toggleButtons.pocketLine.addEventListener('change', (e) => {
        this.state.toggleShowPocketLine();
      });
    }

    if (this.elements.toggleButtons.angleLines) {
      this.elements.toggleButtons.angleLines.addEventListener('change', (e) => {
        this.state.toggleShowAngleLines();
      });
    }

    if (this.elements.toggleButtons.thicknessGuide) {
      this.elements.toggleButtons.thicknessGuide.addEventListener('change', (e) => {
        this.state.toggleShowThicknessGuide();
      });
    }

    if (this.elements.toggleButtons.guideLine) {
      this.elements.toggleButtons.guideLine.addEventListener('change', (e) => {
        this.state.toggleShowGuideLine();
      });
    }

    if (this.elements.toggleButtons.grid) {
      this.elements.toggleButtons.grid.addEventListener('change', (e) => {
        this.state.toggleShowGrid();
      });
    }

    if (this.elements.toggleButtons.positionCircle) {
      this.elements.toggleButtons.positionCircle.addEventListener('change', (e) => {
        this.state.toggleShowPositionCircle();
      });
    }
  }

  /**
   * 状态变化时更新UI
   */
  onStateChange(state) {
    this.updateAngleInfo(state);
    this.updatePocketSelection(state);
    this.updateToggles(state);
    this.updateBallButtons(state.selectedColoredBalls);
  }

  /**
   * 更新角度信息
   */
  updateAngleInfo(state) {
    // 计算当前角度
    const angle = Geometry.calculateAimingAngle(
      state.cueBall,
      state.objectBall,
      state.selectedPocket
    );

    // 获取瞄准数据
    const aimingData = Geometry.getAimingDataByAngle(
      angle,
      this.state.config.aimingMethod.angleData
    );

    // 更新文本信息
    if (this.elements.angleInfo) {
      const infoHTML = `
        <div class="info-item">
          <span class="label">夹角:</span>
          <span class="value">${angle.toFixed(1)}°</span>
        </div>
        <div class="info-item">
          <span class="label">瞄准点:</span>
          <span class="value">${aimingData.aimPosition}</span>
        </div>
        <div class="info-item">
          <span class="label">厚度:</span>
          <span class="value">${aimingData.thickness} (${aimingData.contactRatio})</span>
        </div>
        <div class="info-item">
          <span class="label">难度:</span>
          <span class="value">${this.getDifficultyStars(aimingData.difficulty)}</span>
        </div>
      `;
      this.elements.angleInfo.innerHTML = infoHTML;
    }

    // 更新瞄准示意图
    if (this.aimGuideRenderer && state.showAimGuide) {
      this.aimGuideRenderer.render(angle, aimingData, state.cueBall, state.objectBall, state.selectedPocket);
    }
  }

  /**
   * 获取难度星级
   */
  getDifficultyStars(difficulty) {
    const stars = {
      'easy': '★★☆☆☆',
      'medium': '★★★☆☆',
      'hard': '★★★★☆',
      'extreme': '★★★★★'
    };
    return stars[difficulty] || '★★★☆☆';
  }

  /**
   * 更新袋口选择
   */
  updatePocketSelection(state) {
    this.elements.pocketButtons.forEach(({ id, element }) => {
      if (element) {
        if (id === state.selectedPocket.id) {
          element.classList.add('active');
        } else {
          element.classList.remove('active');
        }
      }
    });
  }

  /**
   * 更新开关状态
   */
  updateToggles(state) {
    if (this.elements.toggleButtons.aimingLine) {
      this.elements.toggleButtons.aimingLine.checked = state.showAimingLine;
    }
    if (this.elements.toggleButtons.pocketLine) {
      this.elements.toggleButtons.pocketLine.checked = state.showPocketLine;
    }
    if (this.elements.toggleButtons.angleLines) {
      this.elements.toggleButtons.angleLines.checked = state.showAngleLines;
    }
    if (this.elements.toggleButtons.thicknessGuide) {
      this.elements.toggleButtons.thicknessGuide.checked = state.showThicknessGuide;
    }
    if (this.elements.toggleButtons.guideLine) {
      this.elements.toggleButtons.guideLine.checked = state.showGuideLine;
    }
    if (this.elements.toggleButtons.grid) {
      this.elements.toggleButtons.grid.checked = state.showGrid;
    }
    if (this.elements.toggleButtons.positionCircle) {
      this.elements.toggleButtons.positionCircle.checked = state.showPositionCircle;
    }
  }

  /**
   * 更新彩球选择按钮状态
   */
  updateBallButtons(selectedBall) {
    Object.entries(this.elements.ballButtons).forEach(([ballType, button]) => {
      if (button) {
        if (ballType === selectedBall) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      }
    });
  }
}
