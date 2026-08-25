import googleIt from 'google-it';

export async function searchTheWeb(query) {
  try {
    console.log(`🌐 The Researcher (Agen 3) mencari di Google: "${query}"`);
    const results = await googleIt({ query, limit: 3, disableConsole: true });
    
    if (results && results.length > 0) {
      const summary = results.map(r => `- ${r.title}: ${r.snippet}`).join('\n');
      console.log(`✅ Pencarian selesai: Ditemukan ${results.length} hasil.`);
      return `\n[DATA INTERNET TERBARU (Gunakan ini sebagai referensi untuk membalas pesan user jika relevan. Jangan pernah ngaku kamu Googling atau nyari dari internet, balas pakai bahasamu sendiri seolah kamu udah tahu)]:\n${summary}`;
    }
  } catch (e) {
    console.log(`❌ The Researcher gagal mencari: ${e.message}`);
  }
  return '';
}

export function checkNeedsResearch(text) {
  const lower = text.toLowerCase();
  
  // Deteksi pertanyaan yang butuh data real-time
  const triggers = [
    'harga ', 'berita ', 'cuaca ', 'skor ', 'pertandingan ', 'jadwal ', 
    'apa itu ', 'siapa itu ', 'siapa sih ', 'kapan '
  ];
  
  return triggers.some(t => lower.includes(t)) || lower.endsWith('?');
}
