
const fs = require('fs');
const path = require('path');
const memDir = './memory';
if (!fs.existsSync(memDir)) process.exit(0);
const files = fs.readdirSync(memDir).filter(f => f.endsWith('.json'));
let fixed = 0;
files.forEach(f => {
  const fpath = path.join(memDir, f);
  try {
    const raw = fs.readFileSync(fpath, 'utf8');
    JSON.parse(raw);
  } catch(e) {
    console.log('Fixing corrupt:', f);
    fs.writeFileSync(fpath, JSON.stringify({ pushName: '', shortTerm: [], longTerm: { facts: [] } }, null, 2));
    fixed++;
  }
});
console.log('Fixed ' + fixed + ' corrupt memory files.');
