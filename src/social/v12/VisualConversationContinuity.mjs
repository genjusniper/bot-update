// src/social/v12/VisualConversationContinuity.mjs
// Bridges sequential references ("yang ini gimana?") back to recent visual entities

export class VisualConversationContinuity {
    static recentVisualEntities = new Map(); // chatId -> latestVisualDescription

    static recordVisualObservation(chatId, observationSummary) {
        if (!observationSummary) return;
        this.recentVisualEntities.set(chatId, {
            summary: observationSummary,
            timestamp: Date.now()
        });
    }

    static getContinuityContext(chatId, message) {
        const text = (message || '').trim().toLowerCase();
        const visual = this.recentVisualEntities.get(chatId);

        if (!visual || (Date.now() - visual.timestamp > 15 * 60 * 1000)) {
            return ''; // Expired after 15 mins
        }

        if (text.match(/(yang ini|yang tadi|foto tadi|barang tadi|error tadi)/i)) {
            return `KONTEKS VISUAL SEBELUMNYA: User merujuk pada foto/visual yang baru saja dibahas: "${visual.summary}". Hubungkan langsung ke konteks visual tersebut!`;
        }

        return '';
    }
}
