# 斯诺克角度瞄准法工具

一个交互式的斯诺克角度瞄准法学习工具，帮助玩家理解和掌握角度瞄准技巧。

## 功能特点

### 核心功能
- **实时角度计算**：自动计算白球、目标球和袋口之间的角度
- **可视化瞄准示意图**：显示目标球俯视图和精确瞄准点位置
- **拖拽交互**：通过鼠标拖拽调整球的位置
- **多种辅助线**：瞄准线、袋口线、角度标注等

### 预设场景
- 黑球水平线
- 咖啡球固定，白球在绿球位
- 粉球置球点
- 蓝球中点
- 黄球D区
- 标准30°角
- 标准45°角
- 标准60°角

### 显示选项
- 显示/隐藏瞄准线
- 显示/隐藏袋口线
- 显示/隐藏角度标注
- 显示/隐藏厚度示意

## 项目结构

```
snooker/
├── index.html          # 主页面
├── data/
│   └── config.json     # 配置数据（球桌尺寸、角度数据等）
├── src/
│   ├── core/
│   │   ├── geometry.js # 几何计算模块
│   │   └── state.js    # 状态管理模块
│   ├── renderer/
│   │   ├── table.js    # 球桌渲染
│   │   ├── balls.js    # 球渲染
│   │   ├── lines.js    # 辅助线渲染
│   │   └── aimGuide.js # 瞄准示意图渲染
│   ├── ui/
│   │   ├── controls.js # 控制面板
│   │   └── interaction.js # 拖拽交互
│   └── main.js         # 主入口
├── styles/
│   └── main.css        # 样式文件
└── README.md
```

## 使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 启动应用

```bash
npm start
```

### 3. 访问应用

打开浏览器访问：`http://localhost:3000`

### 其他启动方式

**使用 npx（无需安装依赖）**
```bash
npx serve
```

**使用 Python**
```bash
python -m http.server 8000
```

**使用 VS Code Live Server**
安装 "Live Server" 插件，右键点击 `index.html` 选择 "Open with Live Server"

## 操作说明

- **拖动球**：用鼠标拖动白球或目标球调整位置
- **选择袋口**：点击右侧面板的袋口按钮选择目标袋口
- **加载场景**：点击预设场景按钮快速加载标准练习场景
- **切换显示**：勾选/取消勾选显示选项来控制辅助线的显示

## 技术栈

- 纯HTML5 + CSS3 + JavaScript (ES6+)
- Canvas 2D API
- 模块化设计
- 响应式布局

## 核心算法

### 角度计算
使用向量夹角公式计算袋口-目标球-白球的角度：
```javascript
angle = arccos((v1 · v2) / (|v1| × |v2|))
```

### 瞄准点计算
根据角度计算假想球（Ghost Ball）位置：
```javascript
cutPoint = cos(angle)
ghostBall = objectBall - direction × (2 × ballRadius)
```

## 数据配置

所有球桌尺寸、球的参数、角度数据都在 `data/config.json` 中配置，方便修改和扩展。

### 关键数据
- 球桌尺寸：3569mm × 1778mm（标准全尺寸）
- 球直径：52.5mm
- 袋口尺寸：角袋87.5mm，中袋83mm
- 角度数据：0°, 15°, 20°, 30°, 45°, 60°, 72°, 90°

## 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 未来计划

- [ ] 添加更多预设场景
- [ ] 支持自定义场景保存
- [ ] 添加练习模式（随机出球）
- [ ] 支持多球练习
- [ ] 添加走位预测
- [ ] 导出/分享场景

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
