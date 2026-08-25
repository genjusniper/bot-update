// src/conversation/ConversationStateEngine.mjs
// Multi-Dimensional Conversation State & Phase Engine

export class ConversationStateEngine {
    static PHASES = [
        'GREETING',
        'SMALL_TALK',
        'JOKING',
        'SHARING_STORY',
        'CURHAT_VENTING',
        'DEEP_TALK',
        'TOPIC_SWITCH',
        'CLOSING'
    ];

    static evaluateState(message, previousState = null) {
        const text = (message || '').toLowerCase();
        
        let phase = 'SMALL_TALK';
        let energy = 0.6;
        let seriousness = 0.3;
        let humorLevel = 0.5;
        let socialMomentum = 0.5;

        // 1. Phase Determination
        if (/^(p|oi|halo|hai|pagi|siang|malam|yo)$/i.test(text)) {
            phase = 'GREETING';
            energy = 0.5;
            seriousness = 0.1;
            humorLevel = 0.4;
        } else if (text.match(/(capek|lelah|kesel|pusing|pengen nyerah|masalah|stres|drop)/i)) {
            phase = 'CURHAT_VENTING';
            energy = 0.3;
            seriousness = 0.85;
            humorLevel = 0.1; // Drop humor in serious curhat
            socialMomentum = 0.7;
        } else if (text.match(/(wkwk|haha|canda|ngakak|lawak|lol|njir)/i)) {
            phase = 'JOKING';
            energy = 0.85;
            seriousness = 0.1;
            humorLevel = 0.9;
            socialMomentum = 0.8;
        } else if (text.match(/(tadi kan|jadi gini|kemarin tuh|waktu gue)/i) || text.length > 70) {
            phase = 'SHARING_STORY';
            energy = 0.7;
            seriousness = 0.4;
            humorLevel = 0.5;
            socialMomentum = 0.75;
        } else if (text.match(/(menurutmu|kenapa ya|arti|tujuan|hidup|masa depan)/i)) {
            phase = 'DEEP_TALK';
            energy = 0.5;
            seriousness = 0.8;
            humorLevel = 0.2;
            socialMomentum = 0.6;
        } else if (text.match(/(bye|duluan|tidur dulu|besok lagi|cabut)/i)) {
            phase = 'CLOSING';
            energy = 0.4;
            seriousness = 0.2;
            humorLevel = 0.3;
            socialMomentum = 0.2;
        }

        const isQuestion = text.includes('?') || /^(apa|kenapa|gimana|siapa|kapan|dimana|kok|bisa|tau gak)/i.test(text);

        return {
            phase,
            energy,
            seriousness,
            humorLevel,
            socialMomentum,
            isQuestion,
            directive: `=== STATUS PERCAKAPAN (CONVERSATION STATE) ===
- Fase: ${phase} | Energi: ${Math.round(energy * 100)}% | Keseriusan: ${Math.round(seriousness * 100)}% | Tingkat Humor: ${Math.round(humorLevel * 100)}%
- Panduan Mood: ${seriousness > 0.6 ? 'Jaga nada bicara tetap empati dan perhatian. Jangan bercanda berlebihan.' : (humorLevel > 0.7 ? 'Bercanda akrab dan santai dipersilakan.' : 'Santai dan mengalir alami.')}`
        };
    }
}
