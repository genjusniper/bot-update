import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

export function startTheDreamer(aiGateway) {
  console.log('🌙 The Dreamer (Agen 5) siap. Jadwal: 03:00 AM setiap hari.');
  
  // Jalan jam 3 pagi: '0 3 * * *'
  // Untuk tes bisa diganti '* * * * *' (tiap menit) kalau mau
  cron.schedule('0 3 * * *', async () => {
    console.log('💤 The Dreamer mulai merekap ingatan (Long-Term Memory)...');
    const memDir = './memory';
    if (!fs.existsSync(memDir)) return;
    
    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const fpath = path.join(memDir, file);
      try {
        const stats = fs.statSync(fpath);
        const hoursSinceLastChat = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        
        const mem = JSON.parse(fs.readFileSync(fpath, 'utf8'));
        
        if (hoursSinceLastChat < 2) {
          console.log(`⏳ ${mem.pushName || file} masih chatan (begadang). The Dreamer mundur.`);
          continue;
        }

        // Hanya proses jika ada lebih dari 5 chat baru
        if (mem.shortTerm && mem.shortTerm.length > 5) {
          console.log(`🧠 Memproses ingatan: ${mem.pushName || file}`);
          
          const chatLog = mem.shortTerm.map(m => `${m.role === 'user' ? 'Teman' : 'Kamu'}: ${m.text}`).join('\n');
          
          const prompt = `Sebagai otak analisis ingatan, tugasmu adalah membaca log percakapan hari ini dan merangkum FAKTA PENTING untuk ingatan jangka panjang.
Log Obrolan:
${chatLog}

TUGAS:
Ekstrak 1-3 poin fakta penting tentang "Teman" (misal: "Sedang sedih karena X", "Baru saja pindah kerja", "Suka main game Y"). 
Abaikan obrolan basa-basi (seperti "halo", "lagi ngapain"). 
Balas HANYA dengan poin-poin (diawali tanda strip -). Jika tidak ada fakta penting, balas kosong.`;
          
          const result = await aiGateway.generate(prompt, { model: 'gemini-3.6-flash', temperature: 0.2 });
          
          if (result.ok && result.response && result.response.length > 5 && !result.response.toLowerCase().includes('kosong')) {
            if (!mem.longTerm) mem.longTerm = { facts: [] };
            if (!mem.longTerm.facts) mem.longTerm.facts = [];
            
            const newFacts = result.response.split('\n').filter(l => l.trim().length > 0 && l.trim().startsWith('-'));
            mem.longTerm.facts.push(...newFacts);
            
            // Limit maksimal 20 memori permanen agar tidak kepanjangan
            if (mem.longTerm.facts.length > 20) {
              mem.longTerm.facts = mem.longTerm.facts.slice(-20);
            }
            
            // Hapus ingatan pendek lama, sisakan 2 chat terakhir sebagai konteks sambungan
            mem.shortTerm = mem.shortTerm.slice(-2);
            
            fs.writeFileSync(fpath, JSON.stringify(mem, null, 2));
            console.log(`✅ Ingatan ${mem.pushName || file} diperbarui!`);
          } else {
            console.log(`⏩ Tidak ada fakta penting dari ${mem.pushName || file}, lewati.`);
          }
        }
      } catch (e) {
        console.log(`❌ Gagal memproses mimpi untuk ${file}: ${e.message}`);
      }
    }
    console.log('🌅 The Dreamer selesai merekap ingatan. Selamat pagi!');
  });
}
