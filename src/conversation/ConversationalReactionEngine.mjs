// src/conversation/ConversationalReactionEngine.mjs
// Master Conversational Reaction Engine: 5-Layer Context, Emotion Momentum, Contradiction Detector & Reaction Matrix

import { EmotionalMomentumTracker } from './EmotionalMomentumTracker.mjs';

export class ConversationalReactionEngine {
    static evaluate({ text, chatId, pushName, history = [] }) {
        const input = (text || '').trim();
        const lower = input.toLowerCase();

        // 1. Calculate Incoming Emotional Signals
        const signals = {
            curiosity: 0.1,
            amusement: 0.1,
            surprise: 0.1,
            skepticism: 0.1
        };

        if (lower.match(/(wkwk|haha|ngakak|lucu|humor|canda|🤣|😂)/)) signals.amusement = 0.8;
        if (lower.match(/(critani|cerita|ngomong|rahasia|tau gak|ngerti ra|janji sek)/)) signals.curiosity = 0.85;
        if (lower.match(/(jarene|katanya|ciuman|selingkuh|ababe|mambu|aneh|buset|anjing|anjir)/)) signals.surprise = 0.75;
        if (lower.match(/(msok|masa|serius|tenan po|mosok|tenane)/)) signals.skepticism = 0.7;

        // 2. Update Emotion Momentum
        const momentum = EmotionalMomentumTracker.updateMomentum(chatId, signals);

        // 3. Detect Social Intent & Context Dynamics
        const directives = [];

        // A. Social Pressure / Reassurance Request
        if (lower.match(/^(janji sek|janji dulu|janji yo|ojo ngomong|ojo crito|rahasia ya)$/i) || lower.includes('janji sek')) {
            directives.push(`- SOCIAL PRESSURE (Permintaan Jaminan/Rahasia): Lawan bicara menahan cerita dan minta janji rahasia. Balas dengan jaminan suwer santai + dorongan kepo (contoh: "yo janji suwer ra bakal ngamok, ndang crito", "aman rahasia wkwk selak penasaran iki").`);
        }

        // B. Low-Information Skepticism / Shrug
        if (lower.match(/^(msok sih|masa sih|masa|mosok|tenane|serius po|ah masa)$/i)) {
            directives.push(`- LOW-INFORMATION RESPONSE (Respon Keraguan Singkat): Lawan bicara cuma bilang 'msok sih/masa'. JANGAN jelaskan panjang lebar! Balas santai/angkat bahu ala manusia (contoh: "lah iya 😭", "yo percaya ora percaya wkwk", "tenan njir, kowe kok malah luwih percoyo liyane wkwk").`);
        }

        // C. Contradiction & Teasing Defense (Bantahan Logika Kontradiksi)
        if (lower.match(/(pacaran|ciuman|cewek|mantan|gebetan|gaya|sok)/i) && (lower.includes('tau') || lower.includes('pernah') || lower.includes('jarene') || lower.includes('rk pernah'))) {
            directives.push(`- CONTRADICTION DETECTOR (Logika Kontradiksi): Gunakan fakta nyata untuk mematahkan klaim aneh lawan bicara (contoh: "nah kui ngerti, pacaran wae ora pernah kok iso-isone nggawe cerita ciuman wkwk ra masuk akal kan").`);
        }

        // D. Structure Directive: REACTION + STANCE + ANSWER
        directives.push(`- STRUKTUR BALASAN ALAMI: Gunakan pola (1. REAKSI EMOSI) + (2. SIKAP/STANCE) + (3. INTI JAWABAN/BANTAHAN) secara ringkas dalam 1-2 baris enter.`);

        // E. Reaction Matrix Guidance based on Momentum
        let dominantReaction = '';
        if (momentum.surprise > 0.5) {
            dominantReaction = `SURPRISE (Level: ${momentum.surprise > 0.7 ? 'HIGH' : 'MEDIUM'}): Tunjukkan kaget/membela diri alami (contoh: "anjir ngawur banget 😭", "lah kok iso?").`;
        } else if (momentum.amusement > 0.5) {
            dominantReaction = `AMUSEMENT (Level: ${momentum.amusement > 0.7 ? 'HIGH' : 'MEDIUM'}): Tunjukkan tawa lepas santai (contoh: "wkwk anjir", "lucu tenan wkwk").`;
        } else if (momentum.curiosity > 0.5) {
            dominantReaction = `CURIOSITY (Level: ${momentum.curiosity > 0.7 ? 'HIGH' : 'MEDIUM'}): Tunjukkan penasaran mendesak santai (contoh: "ndang crito selak penasaran iki wkwk", "opo emang ceritane?").`;
        }

        if (dominantReaction) {
            directives.push(`- REACTION MATRIX: ${dominantReaction}`);
        }

        // F. Human Imperfection Layer
        directives.push(`- HUMAN IMPERFECTION: Boleh gunakan partikel alami seperti "lah", "eh", "wkwk", "njir", atau pembetulan diri santai.`);

        return `=== CONVERSATIONAL REACTION ENGINE (OTAK SOSIAL & NALAR EMOSI) ===
${directives.join('\n')}
====================================================================`;
    }
}
