// src/behavior/MoodEnergyMatcher.mjs
// Local Intelligence (<1ms, 0 Token): Matches emotional energy and tone (HIGH vs LOW/EMPATHY vs NORMAL)

export class MoodEnergyMatcher {
    static evaluate(incomingText) {
        const text = (incomingText || '').trim();
        const lower = text.toLowerCase();

        // 1. Detect Low Energy / Venting / Fatigue -> EMPATHY MODE
        const isVentingOrSad = Boolean(lower.match(/(kesel|mumet|capek|lelah|pusing|sedih|nangis|drop|hancur|stress|ruwet|ambyar|masalah|bingung)/i));
        if (isVentingOrSad) {
            return {
                energy: 'LOW_EMPATHY',
                directive: `- ENERGY & MOOD MATCHING: Lawan bicara sedang lelah/curhat/pusing/stress. JANGAN bercanda berlebihan atau terlalu hiperaktif. Tanggapi dengan nada tenang, hangat, suportif, dan menenangkan (contoh: "waduh istirahat dulu mas", "sabar ya, pelan-pelan wae").`
            };
        }

        // 2. Detect High Energy / Excitement / Hype -> HYPE MODE
        const hasCaps = text.length > 6 && text === text.toUpperCase() && text.match(/[A-Z]/);
        const isHype = Boolean(lower.match(/(wkwkwk|hahaha|anjir|gila|edan|mantap|keren|seru|gokil|pecah|woy|asik)/i)) || text.includes('!!') || Boolean(hasCaps);
        if (isHype) {
            return {
                energy: 'HIGH_EXCITEMENT',
                directive: `- ENERGY & MOOD MATCHING: Lawan bicara sedang bersemangat/heboh/tertawa lepas. Samakan energinya dengan antusias, santai, dan ceria (contoh: "wkwk anjir edan tenan", "gokil sih itu wkwk").`
            };
        }

        // 3. Normal / Balanced
        return {
            energy: 'NORMAL',
            directive: `- ENERGY & MOOD MATCHING: Suasana obrolan santai dan wajar.`
        };
    }
}
