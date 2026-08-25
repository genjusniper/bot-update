// src/communication/PersonalityEngine.mjs

export class PersonalityEngine {
    static getProfile(chatId, relationship = {}) {
        // Dynamic baseline calibrated for personal, witty, natural Indonesian interaction
        let traits = {
            energy: 0.70,        // 0.0 (calm/chill) to 1.0 (hyped)
            humor: 0.75,         // 0.0 (serious) to 1.0 (playful/witty)
            curiosity: 0.65,     // 0.0 (passive) to 1.0 (inquisitive)
            talkativeness: 0.40, // 0.0 (concise/one-liner) to 1.0 (verbose)
            teasing: 0.55,       // 0.0 (gentle/formal) to 1.0 (playfully sarcastic)
            emoji: 0.25          // 0.0 (no emoji) to 1.0 (frequent emoji)
        };

        // Adapt traits based on relationship level
        if (relationship.familiarity === 'close_friend') {
            traits.humor = 0.85;
            traits.teasing = 0.70;
            traits.talkativeness = 0.35; // Close friends talk in punchy short bursts
            traits.energy = 0.75;
        } else if (relationship.familiarity === 'stranger' || relationship.formality === 'formal') {
            traits.humor = 0.30;
            traits.teasing = 0.10;
            traits.talkativeness = 0.60;
            traits.energy = 0.50;
        }

        return traits;
    }

    static compilePersonalityDirectives(traits) {
        let lines = [];
        
        // Humor & Teasing
        if (traits.humor > 0.6) {
            lines.push(`- Humor Level (${Math.round(traits.humor * 100)}%): Selipkan lelucon ringan, celetukan santai, atau punchline yang cerdas jika relevan.`);
        }
        if (traits.teasing > 0.5) {
            lines.push(`- Teasing Level (${Math.round(traits.teasing * 100)}%): Boleh sedikit meledek atau bercanda akrab seperti teman nongkrong, tapi tetap respek.`);
        }

        // Energy & Talkativeness
        if (traits.talkativeness < 0.5) {
            lines.push(`- Talkativeness (${Math.round(traits.talkativeness * 100)}%): Sangat efisien, hindari penjelasan bertele-tele, utamakan kalimat pendek yang ngena.`);
        } else {
            lines.push(`- Talkativeness (${Math.round(traits.talkativeness * 100)}%): Jelaskan dengan runtut dan informatif.`);
        }

        if (traits.emoji < 0.3) {
            lines.push(`- Emoji Habit: Minimalis. Gunakan maksimal 1 emoji sesekali (misal: 😭, 😂, 🗿, 🚀), jangan di setiap kalimat.`);
        }

        return lines.join('\n');
    }
}
