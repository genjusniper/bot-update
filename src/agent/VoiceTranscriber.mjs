import fs from 'fs';
import path from 'path';

export async function transcribeAudio(buffer, apiKey) {
  try {
    console.log('🎧 Memproses Voice Note (Groq Whisper)...');
    
    // Simpan buffer sementara
    const tempFile = path.join('/tmp', `vn_${Date.now()}.ogg`);
    fs.writeFileSync(tempFile, buffer);
    
    const fileStream = fs.createReadStream(tempFile);
    
    // Fallback ke native FormData (Node 18+)
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'audio/ogg' }), 'audio.ogg');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'text');
    formData.append('language', 'id');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    // Bersihkan file sementara
    try { fs.unlinkSync(tempFile); } catch(e) {}

    if (!response.ok) {
      const errText = await response.text();
      console.log('❌ Groq Whisper Error:', errText);
      return '[Gagal mentranskripsi pesan suara]';
    }

    const text = await response.text();
    console.log(`✅ Transkripsi VN berhasil: "${text.trim()}"`);
    return text.trim();
  } catch (e) {
    console.log('❌ Gagal transkripsi VN:', e.message);
    return '[Gagal mentranskripsi pesan suara]';
  }
}
