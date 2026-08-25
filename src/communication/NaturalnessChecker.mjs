// src/communication/NaturalnessChecker.mjs

export class NaturalnessChecker {
    static checkAndSanitize(candidateText, strategy) {
        let text = (candidateText || '').trim();

        // 1. Remove robotic AI openers
        const roboticOpeners = [
            /^halo[!,.]?\s*(ada yang bisa saya bantu|tentu saja|senang bisa membantu|apakah ada hal lain)[!.,]?\s*/i,
            /^(tentu saja|pasti|baiklah|tentu)[!,.]?\s*/i,
            /^sebagai (asisten ai|model bahasa|ai)[!.,]?\s*/i
        ];

        for (const pattern of roboticOpeners) {
            text = text.replace(pattern, '');
        }

        // 2. Remove unsolicited bullet points if short/medium strategy
        if (strategy.target_length === 'short' && text.includes('\n* ')) {
            text = text.replace(/\n\*\s+/g, ', ').replace(/^\*\s+/, '');
        }

        // 3. Length Enforcer for Short Acknowledge
        if (strategy.mode === 'SHORT_ACKNOWLEDGE') {
            const words = text.split(/\s+/);
            if (words.length > 8) {
                text = words.slice(0, 6).join(' ') + '..';
            }
        }

        // 4. Clean trailing robotic sign-offs
        text = text.replace(/(semoga membantu ya[!.]?|ada yang mau ditanyakan lagi\?|kabari jika butuh bantuan[!.]?)$/i, '').trim();

        return text;
    }
}
