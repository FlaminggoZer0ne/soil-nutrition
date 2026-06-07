const { spawn } = require('child_process');
const path = require('path');

console.log('🌱 Starting Soil & Nutrition Monitoring Application...');

// 1. Spawn Backend (shell: false prevents path ampersand splitting on Windows)
const backend = spawn('node', [path.join(__dirname, 'backend/src/index.js')], {
  stdio: 'inherit',
  shell: false
});

// 2. Spawn Frontend
const viteBin = path.join(__dirname, 'frontend/node_modules/vite/bin/vite.js');
const frontend = spawn('node', [viteBin], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: false
});

// Handle termination safely
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});
