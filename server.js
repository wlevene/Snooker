const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 设置静态文件目录
app.use(express.static(__dirname));

// 所有路由返回 index.html（SPA应用）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('');
  console.log('🎱 斯诺克角度瞄准法工具已启动！');
  console.log('');
  console.log(`   本地访问: http://localhost:${PORT}`);
  console.log('');
  console.log('   按 Ctrl+C 停止服务器');
  console.log('');
});
