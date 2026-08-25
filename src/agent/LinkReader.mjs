import axios from 'axios';
import * as cheerio from 'cheerio';

export async function extractLinkContent(url) {
  try {
    console.log(`🦅 Mata Elang (Agen 6) terbang membedah link: ${url}`);
    
    // Fitur Khusus: YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const ytApi = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const { data } = await axios.get(ytApi, { timeout: 5000 });
      console.log(`✅ Mata Elang: Deteksi YouTube "${data.title}"`);
      return `\n[Mata Elang mendeteksi link YouTube. Judul videonya: "${data.title}", di-upload oleh channel "${data.author_name}". Gunakan info ini untuk mengomentari link yang dikirim.]`;
    }

    // Fitur Khusus: TikTok (Menggunakan oEmbed TikTok)
    if (url.includes('tiktok.com')) {
      const tiktokApi = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(tiktokApi, { timeout: 5000 });
      console.log(`✅ Mata Elang: Deteksi TikTok "${data.title}"`);
      return `\n[Mata Elang mendeteksi link TikTok. Judul/Caption videonya: "${data.title}", dari kreator "${data.author_name}". Gunakan info ini untuk mengomentari.]`;
    }

    // Web Berita / Artikel Umum
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 6000
    });
    
    const $ = cheerio.load(data);
    let title = $('title').text().trim();
    if (!title) title = 'Halaman Web';
    
    // Ambil beberapa paragraf awal (maksimal ~800 karakter)
    let textContent = '';
    $('p').each((i, el) => {
      const pText = $(el).text().trim();
      if (pText.length > 20 && textContent.length < 800) {
        textContent += pText + ' ';
      }
    });

    console.log(`✅ Mata Elang: Deteksi Artikel "${title}"`);
    if (textContent.length > 50) {
      return `\n[Mata Elang membedah link web. Judul: "${title}". Ringkasan isi web: "${textContent.substring(0, 800)}...". Komentari isi link ini dengan gayamu.]`;
    }
    
    return `\n[Mata Elang membedah link web. Judul web: "${title}". Komentari link ini.]`;
    
  } catch (err) {
    console.log(`❌ Mata Elang gagal menembus link: ${err.message}`);
    return ''; // Diamkan jika gagal
  }
}

export function extractUrls(text) {
  // Regex canggih untuk mendeteksi URL di dalam kalimat
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null; // Ambil URL pertama yang ditemukan
}
