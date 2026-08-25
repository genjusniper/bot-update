// src/subsystems/social/SocialBrain.mjs
// Social Brain: Curhat Hierarchy, Opinion Engine, Conversation Energy & Slang Adaptation

export class SocialBrain {
    static evaluateSocialDynamics(message) {
        const text = (message || '').trim().toLowerCase();

        // 1. Detect Conversation Energy (0.1 to 0.9)
        let energy = 0.5; // Default Chill
        if (text.match(/wkwk|haha|ngakak|gila|anjir|wkwkwk|parah/i)) {
            energy = 0.85; // Hype / Playful
        } else if (text.match(/capek|lelah|sedih|down|kecewa|mumet|pusing/i)) {
            energy = 0.3; // Low / Empathy
        } else if (text.length < 6) {
            energy = 0.4; // Concise
        }

        // 2. Curhat & Social Mode Hierarchy
        let mode = 'CASUAL';
        let directive = '';

        if (text.match(/(curhat|capek banget|lagi down|sedih banget|berat banget)/i) && !text.includes('wkwk')) {
            mode = 'VENT_LISTEN';
            directive = `MODE CURHAT (DENGARKAN): User sedang meluapkan perasaan/lelah. Jangan langsung memberi daftar 10 solusi! Berikan empati tulus, dengarkan, dan tenangkan hatinya dulu secara hangat.`;
        } else if (text.match(/(menurutmu|menurut kowe|mending mana|bagusan mana|worth gak|saran dong)/i)) {
            mode = 'OPINION_ADVISOR';
            directive = `MODE PENDAPAT (OPINION ENGINE): User meminta opini/pendapatmu. Jangan cuma jawab 'tergantung kebutuhan'! Berikan sudut pandang tegas, jelaskan trade-off kelebihan dan kekurangannya, lalu pilih opsi terbaik menurutmu.`;
        } else if (text.match(/(resign aja wkwk|kabur aja wkwk|gila kali ya wkwk)/i)) {
            mode = 'PLAYFUL_BANTER';
            directive = `MODE BERCANDA: User sedang bercanda santai. Balas dengan humor dan tawa santai, jangan ditanggapi terlalu serius/kaku.`;
        } else {
            mode = 'CHILL_CONVERSATION';
            directive = `MODE CHILL: Jawab dengan santai, akrab, dan mengalir natural layaknya teman dekat.`;
        }

        return {
            energy,
            mode,
            directive
        };
    }
}
