
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

export function startAutoBackup(sock, ownerNumber) {
  console.log('💾 AutoBackup aktif. Jadwal: 02:00 AM setiap hari.');
  
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('💾 Memulai backup memori harian...');
      const memDir = './memory';
      if (!fs.existsSync(memDir)) return;

      const files = fs.readdirSync(memDir).filter(f => f.endsWith('.json'));
      if (files.length === 0) return;

      // Gabungkan semua memory jadi satu objek JSON besar
      const allMemory = {};
      for (const file of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(memDir, file), 'utf8'));
          allMemory[file] = data;
        } catch(e) {}
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const backupData = JSON.stringify(allMemory, null, 2);
      const backupPath = `./memory_backup_${timestamp}.json`;
      
      // Simpan lokal dulu
      fs.writeFileSync(backupPath, backupData);
      
      // Kirim ke nomor WA Bos sebagai dokumen
      const ownerJid = ownerNumber + '@s.whatsapp.net';
      await sock.sendMessage(ownerJid, {
        document: Buffer.from(backupData),
        mimetype: 'application/json',
        fileName: `memory_backup_${timestamp}.json`,
        caption: `💾 Backup memori harian ${timestamp}\n📊 ${files.length} kontak tersimpan.\n\nSimpan file ini. Kalau HP reset, minta aku restore dari file ini.`
      });
      
      // Hapus file backup lokal (sudah terkirim ke WA)
      fs.unlinkSync(backupPath);
      
      console.log(`✅ Backup ${files.length} file memori berhasil dikirim ke ${ownerNumber}!`);
    } catch (e) {
      console.log('❌ AutoBackup gagal:', e.message);
    }
  });
}
