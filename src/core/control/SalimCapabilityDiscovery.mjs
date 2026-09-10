// src/core/control/SalimCapabilityDiscovery.mjs
// Dynamic Capability Discovery & Self-Awareness Engine for SALIM OS

export class SalimCapabilityDiscovery {
    /**
     * Checks if user is asking about bot's capabilities
     * Examples: "salim lo bisa ngapain", "bisa apa aja", "fitur apa aja", "menu"
     * @param {string} text 
     * @returns {boolean}
     */
    static isDiscoveryQuery(text = '') {
        const lower = (text || '').trim().toLowerCase();
        return Boolean(
            lower.match(/^(?:salim\s+)?(?:lo|lu|kamu|bot)?\s*(?:bisa|ngapain|fitur|kemampuan)\s*(?:ngapain|apa\s*aja|gimana|apaan|bisa\s*apa)\b/i) ||
            lower.match(/^(?:salim\s+)?(?:lo\s+bisa\s+ngapain|kamu\s+bisa\s+apa|fitur\s+kamu|fitur\s+salim|capability|capabilities|help|menu|bantuan)\b/i) ||
            lower === 'bisa apa aja' ||
            lower === 'lo bisa apa' ||
            lower === 'fitur'
        );
    }

    /**
     * Formats the master capability card with live actionable examples
     * @returns {string}
     */
    static getMasterCapabilityCard() {
        return `🧠 *SALIM OS — MASTER CAPABILITY MATRIX*
──────────────────────────────
Gue asisten pribadi AI WhatsApp lo yang serba bisa. Lo gak perlu ribet, tinggal suruh pakai bahasa sehari-hari:

👁️ *1. MATA AI & VISION*
• Kirim foto barang/motor/mesin: *"Ini apanya yang rusak?"*
• Kirim screenshot error/coding: *"Bantu perbaiki error ini"*
• Kirim struk belanja: Otomatis membaca nominal & item

🎙️ *2. SUARA & VOICE NOTE (VN)*
• Kirim pesan suara / VN apapun: Gue langsung dengar, transkrip ke teks, dan balas isinya.

🎨 *3. AI IMAGE GENERATOR (FLUX 4K)*
• *"gambarin kucing garong naik motor rx king"*
• *"bikinin gambar pemandangan cyberpunk malam hari"*

🌐 *4. LIVE WEB SEARCH & RESEARCH*
• *"carikan harga tiket kereta semarang tawang ke pasar senen"*
• *"cek info cuaca jogja hari ini"*
• *"riset perbandingan laptop 10 jutaan terbaik"*

⏰ *5. SMART NATURAL REMINDER*
• *"ingatkan 15 menit lagi matikan air"*
• *"ingatkan jam 14.30 meeting zoom"*
• Gue bakal nge-chat WA lo otomatis pas waktunya!

💰 *6. CATAT PENGELUARAN (EXPENSE TRACKER)*
• *"catat bensin 50rb"* / *"catat makan siang 35k"*
• Ketik */rekap* buat lihat total pengeluaran hari ini & bulan ini.

🕵️‍♂️ *7. ANALISIS PSIKOLOGI CHAT*
• Quote chat orang lain + ketik: *"analisis chat ini"*
• Gue bedah tingkat kejujuran, nada emosi terselubung, & saran balasan skakmat.

✍️ *8. GHOSTWRITER & DRAFT PESAN*
• *"bikinin draft izin gak masuk kerja karena demam"*
• *"buatkan kalimat penawaran harga yang sopan ke klien"*

📱 *9. KONTROL & RELAY PESAN*
• !chat <Nama/Nomor> <Pesan> (titip kirim chat ke orang lain)
• /status (cek kesehatan sistem, RAM, & koneksi WA)
• /doctor (diagnosa lengkap 8 pilar sistem)


──────────────────────────────
_Lo mau coba yang mana dulu sekarang, Gus? Tinggal gas!_ 🔥`;
    }
}
