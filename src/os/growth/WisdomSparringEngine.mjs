// src/os/growth/WisdomSparringEngine.mjs
// Cognitive Wisdom, Mental Models & Psychological Sparring Engine for Salim OS
// Empowers Bos Agus to grow smarter, emotionally resilient, and strategic

export class WisdomSparringEngine {
    static MICRO_WISDOMS = [
        {
            topic: 'Dikotomi Kendali (Stoikisme)',
            insight: 'Fokus energi 100% cuma ke hal yang bisa kamu kontrol (responmu, etos kerjamu, caramu bersikap). Sikap orang lain dan hasil akhir itu di luar kendalimu, jadi jangan buang emosi untuk hal itu.'
        },
        {
            topic: 'Prinsip Pareto (80/20 Rule)',
            insight: 'Dalam setiap masalah ruwet, biasanya cuma ada 20% penyebab utama yang memicu 80% kekacauan. Cari 1 akar masalah itu dan bereskan, sisanya bakal selesai sendiri.'
        },
        {
            topic: 'Teknik Inversi (Membalik Masalah)',
            insight: 'Kalau bingung cara sukses mencapai suatu target, balik pertanyaannya: "Apa hal bodoh yang pasti bikin rencana ini hancur total?" Lalu pastikan kamu tidak melakukan hal-hal itu.'
        },
        {
            topic: 'Second-Order Thinking (Akibat dari Akibat)',
            insight: 'Orang biasa cuma mikir akibat langsung: "Kalau aku lakuin ini sekarang, rasanya enak". Orang cerdas mikir langkah kedua: "Tapi apa dampaknya 3 bulan ke depan?"'
        },
        {
            topic: 'Psikologi Negosiasi & Komunikasi',
            insight: 'Saat orang lain defensif atau ngegas, jangan dilawan pakai argumen langsung. Dengarkan sampai dia selesai, akui sudut pandangnya dulu ("Aku paham maksudmu"), baru sodorkan solusimu dengan data dingin.'
        },
        {
            topic: 'Regret Minimization Framework',
            insight: 'Saat ragu mengambil keputusan penting, bayangkan dirimu di usia 70 tahun melihat ke belakang: apakah kamu bakal lebih menyesal karena mencoba lalu gagal, atau menyesal seumur hidup karena tidak pernah berani mencoba?'
        },
        {
            topic: 'Hukum Parkinson & Energi Fokus',
            insight: 'Pekerjaan akan menyita waktu sebanyak yang kamu sediakan. Beri batas waktu sempit (misal 30 menit fokus penuh tanpa sentuh HP), maka otakmu akan menemukan jalan tercepat untuk menuntaskannya.'
        },
        {
            topic: 'Ego vs Pembelajaran',
            insight: 'Orang yang merasa selalu benar tidak akan pernah bertambah pintar. Merasa bodoh di awal itu tanda bagus, artinya otakmu sedang memperluas wilayah pemahaman baru.'
        }
    ];

    /**
     * Gets a fresh Micro-Wisdom for today's briefing
     */
    static getDailyWisdom() {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const index = dayOfYear % this.MICRO_WISDOMS.length;
        return this.MICRO_WISDOMS[index];
    }

    /**
     * Builds system prompt extension for Deep Sparring & Problem Solving
     */
    static getSparringSystemPrompt() {
        return `
KERANGKA BERPIKIR & IDENTITAS PARTNER TUMBUH BERSAMA (SALIM OS):
1. PERAN: Kamu adalah Sahabat Cerdas, Dewasa, Realistis, dan Humoris milik Bos Agus Salim.
2. TONE & GAYA:
   - Santai, asik, berbobot, ceplas-ceplos tapi hormat dan tidak merendahkan.
   - Gunakan gaya bahasa tongkrongan cerdas (Jaksel / Semarangan santai, campur istilah lugas).
   - ANTI-PENJILAT (No Yes-Man): Jika ide Bos punya celah atau berisiko, katakan sejujurnya dengan alasan logis dan solusi alternatif.
3. KETIKA MEMECAHKAN MASALAH:
   - Langkah 1: Akui dan validasi emosinya (tanpa toxic positivity klise).
   - Langkah 2: Bedah inti masalah sebenarnya (First Principles: apa fakta riil vs apa yang cuma asumsi/ketakutan).
   - Langkah 3: Beri aksi nyata 1-2-3 yang realistis dan bisa dieksekusi detik ini.
   - Langkah 4: Tanamkan mindset kedewasaan (Stoikisme: pisahkan apa yang dalam kendali vs luar kendali).
4. MEMPERMUDAH URUSAN:
   - Jika Bos butuh komunikasi dengan orang lain (atasan, rekan, vendor), langsung siapkan draf kalimat siap copy-paste!
`;
    }

    /**
     * Handles explicit !curhat or !evaluasi command
     */
    static formatDeepTalkPrompt(userTopic) {
        const wisdom = this.getDailyWisdom();
        return (
            `💡 *MODE DEEP TALK & KONSULTASI SALIM OS*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `Bos Agus, sini cerita santai. Masalah apa yang lagi bikin kamu kepikiran atau butuh sudut pandang kedua?\n\n` +
            `🧠 *Lensa Berpikir Hari Ini (${wisdom.topic}):*\n` +
            `_${wisdom.insight}_\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Ketik langsung unek-unek atau situasimu, Salim OS siap bedah solusinya secara realistis!_`
        );
    }
}
