export class ResponseEngine {
  static async generateReply(aiGateway, contextPrompt) {
    try {
      const result = await aiGateway.generate(contextPrompt, {
        temperature: 0.6, // Sedikit dinaikkan untuk naturalness Semarangan
        maxOutputTokens: 60
      });

      if (!result.ok) throw new Error(result.error);
      
      let rawReply = result.response || '';
      
      // Sapu bersih robot
      const robotPhrases = ['Tentu!', 'Siap!', 'Sebagai AI', 'Halo!', 'Tentu saja', 'Apakah ada hal lain', 'Ada yang bisa dibantu'];
      robotPhrases.forEach(phrase => {
        rawReply = rawReply.replace(new RegExp(phrase, 'gi'), '').trim();
      });

      // MESSAGE CHUNKER (Smart Bubble Splitting)
      // Memecah teks berdasarkan tanda pipa (|) atau newline asli dari AI
      let bubbles = rawReply.split(/\||\n/g).map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
      
      // Limit bubble agar tidak spam
      if (bubbles.length > 4) bubbles = bubbles.slice(0, 4);
      if (bubbles.length === 0) bubbles = ["👍"];

      // Hitung total delay
      const baseDelay = bubbles.reduce((acc, b) => acc + (b.length * 15), 0);
      const totalDelay = Math.min(Math.max(baseDelay, 500), 4000);
      
      return { ok: true, text: bubbles, delayMs: totalDelay, provider: result.provider };
    } catch (error) {
      console.error("[ResponseEngine] Error Stack:", error.stack || error);
      return { ok: false, text: ['error euy'], delayMs: 1000 };
    }
  }
}