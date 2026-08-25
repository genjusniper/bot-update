
const fs = require('fs');
let code = fs.readFileSync('/data/data/com.termux/files/home/wa-bot-v10/index.js', 'utf8');

// Modifikasi cara mengirim pesan agar mendukung array chunks
const targetOld = "await sock.sendMessage(jid, { text: agentResult.text }, { quoted: msg });";
const targetNew = `if (Array.isArray(agentResult.chunks)) {
    for (const bubble of agentResult.chunks) {
        await sock.sendPresenceUpdate('composing', jid);
        const bDelay = Math.min(Math.max(bubble.length * 20, 500), 2000);
        await new Promise(r => setTimeout(r, bDelay));
        await sock.sendMessage(jid, { text: bubble });
    }
} else {
    await sock.sendMessage(jid, { text: agentResult.text }, { quoted: msg });
}`;

code = code.replace(targetOld, targetNew);
fs.writeFileSync('/data/data/com.termux/files/home/wa-bot-v10/index.js', code);
