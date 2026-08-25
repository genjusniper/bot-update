// src/agent/background/ProactiveBrain.mjs
// V11.3 - Background Initiative Engine

export class ProactiveBrain {
  constructor(options = {}) {
    this.intervalMs = options.intervalMs || 3600000; // 1 Jam default
    this.idleThresholdMs = options.idleThresholdMs || 43200000; // 12 Jam default
    this.chanceToEngage = options.chanceToEngage || 0.20; // 20% chance
    this.timer = null;
  }

  start(sock, memoryDB, allowedContacts, getGenerateReplyFn) {
    if (this.timer) return;
    console.log("? ProactiveBrain: Dinyalakan (Interval:  menit)");
    this.timer = setInterval(async () => {
      await this.scanAndInitiate(sock, memoryDB, allowedContacts, getGenerateReplyFn);
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('? ProactiveBrain: Dimatikan');
    }
  }

  async scanAndInitiate(sock, memoryDB, allowedContacts, getGenerateReplyFn) {
    if (!sock || !memoryDB || typeof memoryDB !== 'object') {
        // Jangan paksa lanjut kalau memoryDB null (sedang dibaca/di-backup)
        return;
    }
    console.log("?? ProactiveBrain: Memindai kontak yang idle...");
    const now = Date.now();
    let initiatedCount = 0;

    for (const jid of allowedContacts) {
      const data = memoryDB[jid];
      if (!data || !data.shortTerm || data.shortTerm.length === 0) continue;

      const lastMsg = data.shortTerm[data.shortTerm.length - 1];
      const timeSinceLastMsg = now - (lastMsg.timestamp || now);

      if (timeSinceLastMsg < this.idleThresholdMs) continue;

      if (lastMsg.role === 'assistant') {
        console.log("?? ProactiveBrain: Skip  karena pesan terakhir dari kita (menunggu balasan).");
        continue;
      }

      const roll = Math.random();
      if (roll > this.chanceToEngage) {
        console.log("?? ProactiveBrain: Skip  (roll: , butuh <= )");
        continue;
      }

      console.log("?? ProactiveBrain: Memutuskan untuk inisiatif chat ke !");
      try {
        const contactName = data.pushName || 'Teman';
        const longTermFacts = Array.isArray(data.longTerm) ? data.longTerm.join(', ') : '';
        const systemMeta = `=== TUGAS KHUSUS ===\nKamu sedang memulai obrolan duluan secara acak karena sudah lama tidak ngobrol dengan ${contactName}. Buat SATU pesan pembuka yang natural, santai, dan nyambung dengan info orang ini: ${longTermFacts}. Jangan pakai salam kaku. Boleh nanya kabar, share hal random, atau bahas kerjaan.`;
        const reply = await getGenerateReplyFn(jid, '[Memulai Obrolan]', systemMeta);
        if (reply && reply !== '[SKIP]') {
          try { await sock.sendPresenceUpdate('composing', jid); } catch(e){}
          const typingDelay = Math.min(Math.max(reply.length * 40, 2000), 6000);
          await new Promise(r => setTimeout(r, typingDelay));
          try { await sock.sendPresenceUpdate('paused', jid); } catch(e){}
          await sock.sendMessage(jid, { text: reply });
          data.shortTerm.push({ role: 'assistant', text: reply, timestamp: Date.now() });
          console.log("? ProactiveBrain: Berhasil mengirim inisiatif ke  -> ");
          initiatedCount++;
        }
      } catch (err) { console.error("? ProactiveBrain Error untuk :", err.message); }
    }
    console.log("?? ProactiveBrain: Selesai memindai. Menginisiasi  obrolan baru.");
  }
}