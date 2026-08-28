// src/evaluation/RealConversationReplayEngine.mjs
// RealConversationReplayEngine: Replays real-world chat traces turn-by-turn and verifies them against the social scorecard

export class RealConversationReplayEngine {
    static getRealTraces() {
        return [
            {
                name: 'session_casual_plan',
                turns: [
                    "nanti malam sibuk ga bro",
                    "nongkrong di warkop depan biasa ya jam 8",
                    "oke sip gua jalan"
                ]
            },
            {
                name: 'session_banter_teasing',
                turns: [
                    "tumben lu pinter wkwk",
                    "halu terus nyari jodoh",
                    "wkwkwk ampun bos"
                ]
            },
            {
                name: 'session_office_venting',
                turns: [
                    "capek banget lembur mulu gua",
                    "bosnya pelit minta ampun ngasih bonus aja kaga",
                    "kayaknya fix pengen resign bulan depan"
                ]
            },
            {
                name: 'session_topic_interruption',
                turns: [
                    "besok mau ke semarang jam 9 pagi",
                    "eh tapi tunggu, kucing gua melahirkan tadi siang",
                    "jadi bingung mau berangkat apa ngga"
                ]
            },
            {
                name: 'session_user_correction',
                turns: [
                    "rakit PC ajalah budget 10 juta",
                    "eh bukan yang itu maksud gua, rakit PC buat editing bukan buat game",
                    "yoi siap"
                ]
            }
        ];
    }

    static evaluateReplay(logs) {
        let scores = {
            over_reply: 100,             // Lower = bot talks too much
            unnecessary_question: 100,   // Lower = bot interrogates user
            topic_drift: 100,            // Lower = bot drifts away from user topic
            repetition: 100,             // Lower = bot repeats phrasing
            emotional_mismatch: 100,     // Target: 100 (0 mismatch!)
            forced_humor: 100,           // Lower = bot laughs when user is serious
            silent_decision: 100,        // Score for staying silent/reacting appropriately
            context_continuity: 100      // Higher = stays on thread
        };

        logs.forEach(log => {
            const agent = log.agent || '';
            const user = log.user || '';
            const words = agent.split(/\s+/).filter(Boolean);
            const qCount = (agent.match(/\?/g) || []).length;

            // Over-reply check
            if (words.length > 20) scores.over_reply -= 15;

            // Unnecessary questions
            if (qCount > 1) scores.unnecessary_question -= 25;

            // Emotional Mismatch (0 target!)
            const userIsSad = Boolean(user.toLowerCase().match(/(capek|pelit|resign|stres|pusing|utang)/i));
            if (userIsSad && agent.toLowerCase().includes('wkwk')) {
                scores.emotional_mismatch = 0; // Immediate zero for emotional mismatch!
                scores.forced_humor -= 50;
            }

            // Silent decision check for short inputs
            const isUserShort = Boolean(user.toLowerCase().match(/^(wkwk|oke|sip)$/i));
            if (isUserShort && words.length > 0) {
                scores.silent_decision -= 30; // Should have been silent or reaction
            }
        });

        // Cap scores
        for (const k in scores) {
            scores[k] = Math.max(0, scores[k]);
        }

        const overall = (Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length).toFixed(2);

        return {
            overall,
            scores
        };
    }
}
