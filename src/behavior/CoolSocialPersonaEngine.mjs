// src/behavior/CoolSocialPersonaEngine.mjs
// CoolSocialPersonaEngine: Controls communication coolness, punchline density, and conversational gears

export class CoolSocialPersonaEngine {
    static evaluate({ text, chatId, pushName, history = [], socialDynamics = {} }) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Determine Conversation Gear
        let gear = 'COOL'; // Default gear
        const isVenting = Boolean(lower.match(/(sedih|nangis|kecewa|putus|sakit|musibah|meninggal|masalah|stress|mumet|pusing|kesel|capek)/i));
        const isExcited = Boolean(lower.match(/(woy|anjing|anjir|gila|edan|wkwkwk|haha|😂|🤣|🔥|💯)/i)) || (text && text === text.toUpperCase() && text.length > 4);

        if (isVenting) {
            gear = 'SUPPORTIVE';
        } else if (isExcited) {
            gear = 'EXCITED';
        } else if (lower.length > 30) {
            gear = 'NORMAL';
        }

        // 2. Select Response Mode
        let mode = 'REPLY_SHORT';
        if (lower.length < 5) {
            mode = 'REACTION_ONLY';
        } else if (gear === 'NORMAL') {
            mode = 'REPLY_NORMAL';
        } else if (gear === 'SUPPORTIVE') {
            mode = 'REPLY_DEEP';
        }

        // 3. Define Punchline & Typo settings
        let punchlineDensity = 'HIGH';
        let typoSetting = 'TYPO_NONE';
        const rand = Math.random();
        if (rand < 0.15) {
            typoSetting = 'TYPO_MINOR'; // 15% chance of minor typo
        }

        const directives = [];
        directives.push(`- CONVERSATION GEAR: ${gear}`);
        directives.push(`- TARGET MODE: ${mode}`);
        directives.push(`- PUNCHLINE DENSITY: ${punchlineDensity}`);

        if (gear === 'COOL') {
            directives.push(`- PERSONA CUEK (COOL): Balas sangat singkat, padat, dan menohok. Jaga wibawa, tidak ramah berlebihan (contoh: "nek gue sih jangan", "boleh. tapi jangan keburu pede").`);
        } else if (gear === 'SUPPORTIVE') {
            directives.push(`- PERSONA SUPPORTIVE: Dengarkan curhat, jangan beri solusi klise, berikan pengakuan empati hangat (contoh: "yahh 😭", "sabar bro").`);
        }

        if (typoSetting === 'TYPO_MINOR') {
            directives.push(`- TYPO SIMULATION: Boleh ada typo minor tidak sengaja pada salah satu kata (contoh: "benttar" atau "siiaap") untuk simulasi ketikan manual alami.`);
        }

        return {
            gear,
            mode,
            punchlineDensity,
            directive: `=== COOL SOCIAL PERSONA ENGINE ===\n${directives.join('\n')}\n==================================`
        };
    }
}
