
    const fs = require('fs');
    let code = fs.readFileSync('/data/data/com.termux/files/home/wa-bot-v10/index.js', 'utf8');
    
    // Ganti MemoryStore.addChat(jid, 'user', text) menjadi addWorkingMemory
    code = code.replace(/MemoryStore\.addChat/g, 'MemoryStore.addWorkingMemory');
    
    // Ganti operan memory
    code = code.replace(/shortTerm: recentHistory,\s*longTerm: loadMemory\(jid\) \|\| \{\}/g, '...MemoryStore.load(jid)');
    code = code.replace(/const memory = MemoryStore.load\(jid\);/g, 'const memory = MemoryStore.load(jid);'); // Normalisasi jika ada
    fs.writeFileSync('/data/data/com.termux/files/home/wa-bot-v10/index.js', code);
    