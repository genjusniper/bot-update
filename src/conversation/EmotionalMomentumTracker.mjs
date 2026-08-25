// src/conversation/EmotionalMomentumTracker.mjs
// Tracks emotional continuity and momentum per chat so emotions evolve smoothly (not resetting every turn)

const momentumCache = new Map();

export class EmotionalMomentumTracker {
    static getMomentum(chatId) {
        let state = momentumCache.get(chatId);
        if (!state) {
            state = {
                curiosity: 0.2,
                amusement: 0.3,
                surprise: 0.1,
                skepticism: 0.1,
                lastUpdated: Date.now()
            };
            momentumCache.set(chatId, state);
        }
        return state;
    }

    static updateMomentum(chatId, signals = {}) {
        const current = this.getMomentum(chatId);

        // Exponential decay momentum: newEmotion = oldEmotion * 0.7 + currentSignal * 0.3
        const updateVal = (oldVal, signalVal) => {
            const s = typeof signalVal === 'number' ? signalVal : 0;
            return Math.min(1.0, Math.max(0.0, Number((oldVal * 0.7 + s * 0.3).toFixed(2))));
        };

        current.curiosity = updateVal(current.curiosity, signals.curiosity);
        current.amusement = updateVal(current.amusement, signals.amusement);
        current.surprise = updateVal(current.surprise, signals.surprise);
        current.skepticism = updateVal(current.skepticism, signals.skepticism);
        current.lastUpdated = Date.now();

        momentumCache.set(chatId, current);
        return current;
    }
}
