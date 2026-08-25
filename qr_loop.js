const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const qrTxtPath = path.resolve(__dirname, 'qr.txt');

// Reset qr.txt first
if (fs.existsSync(qrTxtPath)) {
  fs.unlinkSync(qrTxtPath);
}

async function run() {
  console.log('Starting QR loop watcher...');
  while (true) {
    if (fs.existsSync(qrTxtPath)) {
      const content = fs.readFileSync(qrTxtPath, 'utf8');
      if (content.trim() === 'CONNECTED') {
        console.log('Connection detected! Exiting loop.');
        break;
      }
    }
    console.log('Starting qr.js...');
    try {
      execSync('node qr.js', { stdio: 'inherit', timeout: 120000 });
    } catch (e) {
      console.log('qr.js execution ended. Code:', e.status);
    }
    
    if (fs.existsSync(qrTxtPath)) {
      const content = fs.readFileSync(qrTxtPath, 'utf8');
      if (content.trim() === 'CONNECTED') {
        console.log('Connection detected! Exiting loop.');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 3000));
  }
}
run();
