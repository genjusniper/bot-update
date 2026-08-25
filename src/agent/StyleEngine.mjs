// src/agent/StyleEngine.mjs
export class StyleEngine {
  static SLANG_WORDS = ['pie', 'rak', 'to', 'po', 'ndak', 'lho', 'yo', 'weh', 'sing', 'nek', 'rapopo', 'ora', 'iki', 'wes', 'aku'];

  static analyzeUserStyle(workingMemory = []) {
    const userMsgs = workingMemory.filter(m => m.role === 'user').map(m => m.text || '');
    
    let totalChars = 0;
    let upperChars = 0;
    let slangCount = 0;
    let totalWords = 0;
    let wkwkCount = 0;

    if (userMsgs.length === 0) {
      // Default Profile (Semarangan Casual)
      return {
        lowercaseOnly: true,
        slangDensity: 0.25,
        wkwkFrequency: 0.1,
        averageWordCount: 5
      };
    }

    userMsgs.forEach(msg => {
      totalChars += msg.length;
      upperChars += (msg.match(/[A-Z]/g) || []).length;
      
      const words = msg.toLowerCase().split(/\s+/).filter(Boolean);
      totalWords += words.length;
      
      words.forEach(w => {
        if (this.SLANG_WORDS.includes(w)) slangCount++;
        if (w.includes('wkwk') || w.includes('wk')) wkwkCount++;
      });
    });

    const upperRatio = totalChars > 0 ? (upperChars / totalChars) : 0;
    
    return {
      lowercaseOnly: upperRatio < 0.05, // Mostly lowercase
      slangDensity: totalWords > 0 ? (slangCount / totalWords) : 0.15,
      wkwkFrequency: totalWords > 0 ? (wkwkCount / totalWords) : 0.05,
      averageWordCount: userMsgs.length > 0 ? (totalWords / userMsgs.length) : 6
    };
  }

  static getStyleInstruction(workingMemory = []) {
    const profile = this.analyzeUserStyle(workingMemory);
    let instruction = '\n=== GAYA BAHASA SEMARANGAN (STYLE ENGINE V6) ===\n';
    
    if (profile.lowercaseOnly) {
      instruction += '- Ketik balasan Anda HANYA dalam huruf kecil semua (lowercase). Jangan gunakan huruf besar di awal kalimat.\n';
    } else {
      instruction += '- Gunakan huruf besar sewajarnya saja di awal kalimat.\n';
    }

    if (profile.slangDensity > 0.1) {
      instruction += '- Sering-sering gunakan kosakata Jawa Semarang sing natural: "pie", "rak", "to", "po", "sing", "nek", "wes", "iki".\n';
    } else {
      instruction += '- Gunakan bahasa santai campuran Indonesia & Jawa halus/sedang.\n';
    }

    if (profile.wkwkFrequency > 0.03) {
      instruction += '- Boleh tambahkan tertawa singkat seperti "wkwk" atau "wk" jika konteksnya bercanda/lucu.\n';
    }
    
    instruction += `- Batasi panjang kata sekitar ${Math.round(profile.averageWordCount * 1.5)} kata per bubble chat agar tidak terlalu panjang.\n`;
    return instruction;
  }

  static evaluateConfidence(replyText, workingMemory = []) {
    const profile = this.analyzeUserStyle(workingMemory);
    const text = replyText.toLowerCase();
    
    let score = 1.0;

    // 1. Check Lowercase Match
    if (profile.lowercaseOnly) {
      const hasUppercase = /[A-Z]/.test(replyText);
      if (hasUppercase) score -= 0.3; // Penalty for using capital letters
    }

    // 2. Check Slang usage
    if (profile.slangDensity > 0.1) {
      const words = text.split(/\s+/).filter(Boolean);
      const hasSlang = words.some(w => this.SLANG_WORDS.includes(w));
      if (!hasSlang) score -= 0.2; // Penalty for zero local slang when profile has it high
    }

    // 3. Penalty for robotic phrases
    const robotPhrases = ['tentu saja', 'apakah ada hal lain', 'sebagai ai', 'bisa saya bantu'];
    robotPhrases.forEach(p => {
      if (text.includes(p)) score -= 0.4;
    });

    return Math.max(score, 0.0);
  }
}
