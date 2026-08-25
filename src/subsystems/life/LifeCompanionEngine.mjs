// src/subsystems/life/LifeCompanionEngine.mjs
// Life Companion: Mood Tracker, Proactive Idea Generator & Open Loop Hunter

import { LifeBrain } from './LifeBrain.mjs';

export class LifeCompanionEngine {
    static detectMood(message) {
        const text = (message || '').trim().toLowerCase();

        if (text.match(/(capek|lelah|down|sedih|berat|kecewa|mumet)/i) && !text.includes('wkwk')) {
            return 'CURHAT';
        }
        if (text.match(/(wkwk|haha|ngakak|gila|lucu)/i)) {
            return 'JOKING';
        }
        if (text.match(/(bosen|gabut|mager|males)/i)) {
            return 'TIRED_BORED';
        }
        if (text.match(/(error|bug|server|koding|ram|cpu|vga|kabel)/i)) {
            return 'TECHNICAL';
        }
        if (text.match(/(makasih|tengkyu|otw|tidur dulu|cabut)/i)) {
            return 'ENDING';
        }
        return 'CASUAL';
    }

    static async generateProactiveIdea(chatId, message) {
        const text = (message || '').trim().toLowerCase();

        if (text.match(/^(lagi bosen|gabut nih|enaknya ngapain ya|males banget|bosen poll)/i)) {
            const lifeData = await LifeBrain.load(chatId);
            const activeLoops = (lifeData.openLoops || []).filter(l => l.status === 'OPEN');

            if (activeLoops.length > 0) {
                const targetLoop = activeLoops[0].text;
                return {
                    handled: true,
                    response: `wkwk daripada gabut scroll sosmed terus, mending lanjutin rencana lu yang "${targetLoop}" bro. Atau mau nyoba utak-atik ide fitur baru? 😂`
                };
            }

            return {
                handled: true,
                response: "wkwk nek lagi bosen, mending ngopi santai sek karo nonton YouTube / anime bro, ben otak rada seger! Mau ngobrolin topik apa nih?"
            };
        }

        return { handled: false };
    }
}
