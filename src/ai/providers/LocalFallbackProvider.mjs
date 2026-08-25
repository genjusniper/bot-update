// src/ai/providers/LocalFallbackProvider.mjs
// V11.2 — Improved Local Fallback: Lebih natural, tidak kaku

export class LocalFallbackProvider {
  constructor() {
    this.name = 'local-fallback';
  }

  async generate(prompt, options = {}) {
    const startTime = Date.now();
    // Support being called as generate(prompt, options) OR generate({incomingText, purpose})
    const incomingText = options.incomingText || (typeof prompt === 'string' ? prompt : '') || '';
    const purpose = options.purpose || 'chat';

    console.warn(`⚠️⚠️ PERINGATAN: LocalFallback aktif! Semua AI provider gagal. Cek koneksi dan API Key!`);

    const text = String(incomingText).trim().toLowerCase();

    let response = '';

    if (purpose === 'memory') {
      response = '[SKIP]';
    } else if (!text) {
      // Variasi agar tidak selalu sama
      const variants = [
        'Hm, ada apa?',
        'Eh iya, ngomong dong',
        'Aku di sini, ada apa?',
        'Hmm? Lanjut aja'
      ];
      response = variants[Math.floor(Math.random() * variants.length)];

    } else if (/^(p|ping|tes|test|halo|hi|hay)$/i.test(text)) {
      const variants = ['Hadir wkwk', 'Iya ada 🙋', 'Sini sini, ada apa?', 'Iya, apa?'];
      response = variants[Math.floor(Math.random() * variants.length)];

    } else if (/^(iya|ya|yo|oke|ok|sip|siap)$/i.test(text)) {
      const variants = ['Sip!', 'Oke deh', 'Hehe iya', 'Gas lah'];
      response = variants[Math.floor(Math.random() * variants.length)];

    } else if (/capek|lelah|mumet|pusing|stres|sedih|bingung|galau/i.test(text)) {
      const variants = [
        'Pelan-pelan aja ya, aku temenin.',
        'Istirahat dulu deh, gapapa.',
        'Sabar ya, ntar juga baikan.',
        'Hmm, cerita aja dulu kalau mau.'
      ];
      response = variants[Math.floor(Math.random() * variants.length)];

    } else if (/lama|kok|gak dibales|lelet|slow/i.test(text)) {
      const variants = [
        'Sabar ya, agak lemot nih jaringanku wkwk',
        'Maaf, bentar ya masih loading...',
        'Iya iya, sebentar lagi!'
      ];
      response = variants[Math.floor(Math.random() * variants.length)];

    } else if (text.endsWith('?')) {
      const variants = [
        'Hmm, bentar aku pikirin dulu...',
        'Wah pertanyaan bagus, tapi aku lagi agak lemot nih',
        'Menarik, bentar ya aku cari tau dulu'
      ];
      response = variants[Math.floor(Math.random() * variants.length)];

    } else if (/makasih|thanks|terima kasih|tq/i.test(text)) {
      const variants = ['Sama-sama!', 'Santai aja~', 'No problem wkwk', 'Siap, kapan aja!'];
      response = variants[Math.floor(Math.random() * variants.length)];

    } else {
      const variants = [
        'Eh, gimana maksudnya?',
        'Oh gitu, lanjut cerita dong',
        'Hmm, aku kurang nangkep. Ulangi?',
        'Nah iya, terus?',
        'Wah, menarik tuh'
      ];
      response = variants[Math.floor(Math.random() * variants.length)];
    }

    return {
      ok: true,
      response,
      provider: this.name,
      latencyMs: Date.now() - startTime,
      quotaExhausted: false,
      error: null
    };
  }
}
