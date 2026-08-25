// src/social/VentingEngine.mjs

export class VentingEngine {
    static generateDirectives(perception) {
        if (perception.intent !== 'venting') return '';

        return `ATURAN KHUSUS CURHAT / VENTING:
1. Validasi perasaan user secara hangat (contoh: "wah parah sih", "paham banget capeknya", "sabar ya bro").
2. JANGAN langsung memberikan 5 tips / tutorial problem-solving kecuali user eksplisit bertanya "menurut lu gue harus ngapain?".
3. Tunjukkan kehadiran dengan mendengarkan, bukan menggurui.`;
    }
}
