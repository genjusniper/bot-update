// src/humor/HumorEngine.mjs

export class HumorEngine {
    static evaluate(message, perception, momentum, relationship, matchedJoke) {
        // 1. Safety & Timing Gate: NEVER joke during serious grief or intense sadness
        if (perception.emotion === 'sad' || (perception.intent === 'venting' && momentum.emotionalIntensity > 0.8)) {
            return {
                allowHumor: false,
                risk: 'HIGH',
                directive: 'JANGAN BERCANDA. User sedang dalam emosi rapuh/sedih/frustrasi berat. Fokus mendengar dan empati.'
            };
        }

        // 2. Callback Joke Priority
        if (matchedJoke && momentum.humorMomentum > 0.4) {
            return {
                allowHumor: true,
                style: 'CALLBACK_JOKE',
                risk: 'LOW',
                directive: `INSIDE JOKE TERDETEKSI: Selipkan callback humor terkait "${matchedJoke.topic}" secara halus dan cerdas.`
            };
        }

        // 3. Playful Teasing for close friends on light complaints
        if (relationship.familiarity === 'close_friend' && perception.emotion === 'frustrated') {
            return {
                allowHumor: true,
                style: 'PLAYFUL_TEASING',
                risk: 'LOW_MEDIUM',
                directive: 'Boleh ledek/bercanda akrab tipis-tipis khas teman nongkrong sebelum memberi semangat.'
            };
        }

        // 4. Situational Banter on excited / laughing context
        if (perception.emotion === 'excited' || perception.emotion === 'happy') {
            return {
                allowHumor: true,
                style: 'SITUATIONAL_BANTER',
                risk: 'LOW',
                directive: 'Ikuti vibe seru/tawa user, tanggapi dengan celetukan kocak yang nyambung.'
            };
        }

        return {
            allowHumor: false,
            risk: 'NONE',
            directive: ''
        };
    }
}
