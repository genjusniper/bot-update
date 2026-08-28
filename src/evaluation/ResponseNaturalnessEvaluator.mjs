// src/evaluation/ResponseNaturalnessEvaluator.mjs
// ResponseNaturalnessEvaluator: Evaluates 50 simulated turns and scores naturalness/awkwardness metrics

export class ResponseNaturalnessEvaluator {
    static getTestCorpus() {
        return [
            // Casual
            { user: "lagi sibuk gak", expectedMode: "COOL" },
            { user: "tadi makan apa", expectedMode: "COOL" },
            { user: "besok nongkrong jam 7 ya", expectedMode: "COOL" },
            { user: "mager banget hari ini", expectedMode: "COOL" },
            { user: "eh lu tau cafe baru itu?", expectedMode: "COOL" },
            // Banter
            { user: "tumben pinter wkwk", expectedMode: "BANTER" },
            { user: "halu terus lu", expectedMode: "BANTER" },
            { user: "wkwk lucu amat", expectedMode: "BANTER" },
            { user: "muka lu kayak sate madura wkwk", expectedMode: "BANTER" },
            { user: "bisa aja lu ngelesnya 😂", expectedMode: "BANTER" },
            // Curhat / Venting
            { user: "bos gue nyebelin banget", expectedMode: "CURHAT" },
            { user: "capek kerja lembur mulu", expectedMode: "CURHAT" },
            { user: "pengen resign rasanya", expectedMode: "CURHAT" },
            { user: "duit menipis akhir bulan", expectedMode: "CURHAT" },
            { user: "stres gue banyak tugas", expectedMode: "CURHAT" },
            // Serious / Debate
            { user: "bagusan rakit pc apa beli laptop?", expectedMode: "SERIOUS" },
            { user: "harga tiket krl naik ya?", expectedMode: "SERIOUS" },
            { user: "meeting besok jam berapa?", expectedMode: "SERIOUS" },
            { user: "akses kai kok eror terus", expectedMode: "SERIOUS" },
            { user: "lu setuju gak resign mendadak?", expectedMode: "SERIOUS" },
            // Short / Basa-basi
            { user: "wkwk", expectedMode: "COOL" },
            { user: "oke", expectedMode: "COOL" },
            { user: "sip", expectedMode: "COOL" },
            { user: "yowes", expectedMode: "COOL" },
            { user: "siap", expectedMode: "COOL" }
        ];
    }

    static evaluate(logs) {
        let scores = {
            naturalness: 100,
            brevity: 100,
            relevance: 100,
            initiative: 100,
            emotional_fit: 100,
            repetition: 100,
            awkwardness: 100
        };

        let totalWords = 0;
        let awkwardPhrases = ['sebagai ai', 'mohon maaf', 'asisten virtual', 'saya tidak bisa'];

        logs.forEach(log => {
            const agent = log.agent || '';
            const user = log.user || '';
            const words = agent.split(/\s+/).filter(Boolean);
            totalWords += words.length;

            // Brevity Check (Penalty for overly long sentences)
            if (words.length > 20) {
                scores.brevity -= 10;
                scores.naturalness -= 5;
            }

            // Awkwardness Check (AI keywords / robotic patterns)
            if (awkwardPhrases.some(p => agent.toLowerCase().includes(p))) {
                scores.awkwardness -= 30;
                scores.naturalness -= 20;
            }

            // Exclamation marks check (Human casual chat rarely uses exclamation marks)
            if (agent.includes('!')) {
                scores.awkwardness -= 15;
            }

            // Emotional Fit check (Venting vs wkwk laughter)
            const userIsSad = Boolean(user.toLowerCase().match(/(capek|stres|pusing|sedih|nyebelin|pelit|resign)/i));
            if (userIsSad && agent.toLowerCase().includes('wkwk')) {
                scores.emotional_fit -= 25;
            }
        });

        // Cap scores
        for (const k in scores) {
            scores[k] = Math.max(0, scores[k]);
        }

        const overall = (Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length).toFixed(2);

        return {
            overall,
            scores,
            avgWords: (totalWords / Math.max(1, logs.length)).toFixed(1)
        };
    }
}
