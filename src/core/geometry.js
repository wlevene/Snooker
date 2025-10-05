/**
 * 几何计算核心模块
 * 提供角度、距离、瞄准点等几何计算功能
 */

export class Geometry {
  /**
   * 计算两点之间的距离
   * @param {Object} p1 - 点1 {x, y}
   * @param {Object} p2 - 点2 {x, y}
   * @returns {number} 距离
   */
  static distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算从p1指向p2的角度（弧度）
   * @param {Object} p1 - 起点 {x, y}
   * @param {Object} p2 - 终点 {x, y}
   * @returns {number} 角度（弧度）
   */
  static angleRadians(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  /**
   * 计算从p1指向p2的角度（度数）
   * @param {Object} p1 - 起点 {x, y}
   * @param {Object} p2 - 终点 {x, y}
   * @returns {number} 角度（度数）
   */
  static angleDegrees(p1, p2) {
    return this.angleRadians(p1, p2) * 180 / Math.PI;
  }

  /**
   * 计算两个向量之间的夹角（度数）
   * @param {Object} origin - 原点 {x, y}
   * @param {Object} p1 - 点1 {x, y}
   * @param {Object} p2 - 点2 {x, y}
   * @returns {number} 夹角（度数，0-180）
   */
  static angleBetweenVectors(origin, p1, p2) {
    const angle1 = this.angleRadians(origin, p1);
    const angle2 = this.angleRadians(origin, p2);
    let diff = Math.abs(angle1 - angle2);

    // 确保角度在0-180度之间
    if (diff > Math.PI) {
      diff = 2 * Math.PI - diff;
    }

    return diff * 180 / Math.PI;
  }

  /**
   * 计算斯诺克瞄准角度
   * 以目标球为顶点，目标球到袋口的连线与穿球线（白球穿过目标球的方向）的夹角
   * @param {Object} cueBall - 白球位置 {x, y}
   * @param {Object} objectBall - 目标球位置 {x, y}
   * @param {Object} pocket - 袋口位置 {x, y}
   * @returns {number} 角度（度数）
   */
  static calculateAimingAngle(cueBall, objectBall, pocket) {
    // 目标球到袋口的角度
    const angle1 = this.angleRadians(objectBall, pocket);

    // 穿球线的方向：从白球到目标球的方向（即白球穿过目标球的方向）
    const angle2 = this.angleRadians(cueBall, objectBall);

    let diff = Math.abs(angle1 - angle2);

    // 确保角度在0-180度之间
    if (diff > Math.PI) {
      diff = 2 * Math.PI - diff;
    }

    return diff * 180 / Math.PI;
  }

  /**
   * 根据角度获取瞄准数据
   * @param {number} angle - 角度（度数）
   * @param {Array} angleData - 角度数据数组
   * @returns {Object} 瞄准数据
   */
  static getAimingDataByAngle(angle, angleData) {
    // 找到最接近的角度数据
    let closest = angleData[0];
    let minDiff = Math.abs(angle - closest.angle);

    for (const data of angleData) {
      const diff = Math.abs(angle - data.angle);
      if (diff < minDiff) {
        minDiff = diff;
        closest = data;
      }
    }

    // 插值计算更精确的cutPoint
    const cutPoint = Math.cos(angle * Math.PI / 180);

    return {
      ...closest,
      actualAngle: angle,
      actualCutPoint: cutPoint,
      interpolated: true
    };
  }

  /**
   * 计算瞄准点位置
   * @param {Object} cueBall - 白球位置 {x, y}
   * @param {Object} objectBall - 目标球位置 {x, y}
   * @param {Object} pocket - 袋口位置 {x, y}
   * @param {number} ballRadius - 球半径
   * @returns {Object} 瞄准点位置 {x, y}
   */
  static calculateAimingPoint(cueBall, objectBall, pocket, ballRadius) {
    // 计算袋口到目标球的角度
    const pocketAngle = this.angleRadians(objectBall, pocket);

    // 计算瞄准角度
    const aimAngle = this.calculateAimingAngle(cueBall, objectBall, pocket);
    const aimRadians = aimAngle * Math.PI / 180;

    // 计算cutPoint（接触比例）
    const cutPoint = Math.cos(aimRadians);

    // 计算假想球球心位置（白球应该到达的位置）
    const ghostBallX = objectBall.x - Math.cos(pocketAngle) * (ballRadius * 2);
    const ghostBallY = objectBall.y - Math.sin(pocketAngle) * (ballRadius * 2);

    return {
      x: ghostBallX,
      y: ghostBallY,
      cutPoint: cutPoint
    };
  }

  /**
   * 计算接触点位置（目标球上的接触点）
   * @param {Object} objectBall - 目标球位置 {x, y}
   * @param {Object} pocket - 袋口位置 {x, y}
   * @param {number} angle - 瞄准角度（度数）
   * @param {number} ballRadius - 球半径
   * @returns {Object} 接触点位置 {x, y, offsetAngle}
   */
  static calculateContactPoint(objectBall, pocket, angle, ballRadius) {
    // 袋口到目标球的角度
    const pocketAngle = this.angleRadians(objectBall, pocket);

    // 接触点相对于球心的偏移角度
    const offsetAngle = Math.asin(Math.sin(angle * Math.PI / 180));

    // 接触点在目标球上的位置
    const contactX = objectBall.x + Math.cos(pocketAngle + Math.PI + offsetAngle) * ballRadius;
    const contactY = objectBall.y + Math.sin(pocketAngle + Math.PI + offsetAngle) * ballRadius;

    return {
      x: contactX,
      y: contactY,
      offsetAngle: offsetAngle * 180 / Math.PI
    };
  }

  /**
   * 判断点是否在圆内
   * @param {Object} point - 点 {x, y}
   * @param {Object} circle - 圆心 {x, y}
   * @param {number} radius - 半径
   * @returns {boolean} 是否在圆内
   */
  static isPointInCircle(point, circle, radius) {
    return this.distance(point, circle) <= radius;
  }

  /**
   * 归一化角度到0-360度
   * @param {number} angle - 角度（度数）
   * @returns {number} 归一化后的角度
   */
  static normalizeAngle(angle) {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return angle;
  }

  /**
   * 计算瞄准线与目标球的交点
   * @param {Object} cueBall - 白球位置 {x, y}
   * @param {Object} objectBall - 目标球位置 {x, y}
   * @param {Object} aimPoint - 瞄准点 {x, y}
   * @param {number} ballRadius - 球半径
   * @returns {Object|null} 交点位置 {x, y} 或 null
   */
  static calculateAimLineIntersection(cueBall, objectBall, aimPoint, ballRadius) {
    // 简化：返回白球到瞄准点连线与目标球的交点
    const angle = this.angleRadians(cueBall, aimPoint);
    const dist = this.distance(cueBall, objectBall);

    // 计算交点（在目标球边缘）
    const intersectDist = dist - ballRadius;
    const x = cueBall.x + Math.cos(angle) * intersectDist;
    const y = cueBall.y + Math.sin(angle) * intersectDist;

    return { x, y };
  }
}
