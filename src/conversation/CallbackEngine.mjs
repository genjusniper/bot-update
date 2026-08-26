// src/conversation/CallbackEngine.mjs
// CallbackEngine: Determines if unresolved plans/open loops should be actively revived on a new conversation turn

export class CallbackEngine {
    static evaluate({ text, chatId, outcomeData = null }) {
        const lower = (text || '').trim().toLowerCase();

        // Only eligible for callback on brief greetings/pings after some hours of silence
        const isPing = Boolean(lower.match(/^(bro|p|oi|oy|he|mas|gus|halo|yok)$/i));

        if (isPing && outcomeData && outcomeData.status === 'UNRESOLVED') {
            const plan = outcomeData.planName || 'rencana kemarin';
            return {
                triggerCallback: true,
                directive: `- CALLBACK TRIGGERED: Hubungkan sapaan singkat user dengan rencana/janji gantung terakhir: "${plan}". Tanyakan kelanjutannya secara santai (contoh: "yo bro, rencana mancing kemarin jadi?", "yoi, piye sido panjat tebing ra?").`
            };
        }

        return { triggerCallback: false, directive: '' };
    }
}
