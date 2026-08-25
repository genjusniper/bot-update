
const fs = require('fs');
const files = fs.readdirSync('./memory').filter(f => f.endsWith('.json'));
let pending = [];
files.forEach(f => {
  try {
    const mem = JSON.parse(fs.readFileSync('./memory/' + f));
    if (mem.shortTerm && mem.shortTerm.length > 0) {
      const last = mem.shortTerm[mem.shortTerm.length - 1];
      if (last.role === 'user' && !last.text.includes('[Pesan Manual Owner]')) {
        pending.push({ name: mem.pushName || f.replace('.json',''), text: last.text });
      }
    }
  } catch(e) {}
});
if (pending.length > 0) {
  console.log('--- DAFTAR GANTUNG ---');
  pending.forEach(p => console.log(p.name + ' -> "' + p.text + '"'));
} else {
  console.log('Bersih! Gaada yg gantung.');
}
