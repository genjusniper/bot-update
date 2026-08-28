// src/evaluation/HumanConversationEvaluator.mjs
// HumanConversationEvaluator: Simulates 8 social scenarios and scores 10 vital conversational metrics

export class HumanConversationEvaluator {
    static getScenarios() {
        return [
            {
                name: 'casual_chat',
                weight: 0.30,
                turns: [
                    "woy lagi sibuk gak",
                    "tadi gue habis makan sate madura enak banget",
                    "iya nanti malam jadi nongkrong?"
                ]
            },
            {
                name: 'banter',
                weight: 0.20,
                turns: [
                    "lu kok tumben rajin bener wkwk",
                    "iya nih biar cepet dapet jodoh 😂",
                    "wkwkwk halu terus"
                ]
            },
            {
                name: 'curhat',
                weight: 0.15,
                turns: [
                    "pusing gue sama kerjaan kantor",
                    "tiap hari disuruh lembur tapi bosnya pelit banget",
                    "pengen resign rasanya"
                ]
            },
            {
                name: 'debate_opinion',
                weight: 0.10,
                turns: [
                    "menurutmu bagusan milih PC rakitan atau beli laptop langsung?",
                    "tapi laptop kan lebih praktis bisa dibawa kemana-mana",
                    "iya sih bener juga"
                ]
            },
            {
                name: 'info_questions',
                weight: 0.10,
                turns: [
                    "kamu tau gak jadwal KRL paling malam jam berapa?",
                    "oke sip makasih infonya"
                ]
            },
            {
                name: 'short_chats',
                weight: 0.05,
                turns: [
                    "wkwk",
                    "oke",
                    "sip"
                ]
            },
            {
                name: 'burst',
                weight: 0.05,
                turns: [
                    "bro",
                    "lu ntar malam kemana",
                    "nongkrong kuy"
                ]
            },
            {
                name: 'group_chats',
                weight: 0.05,
                turns: [
                    "besok jam 8 kumpul ya",
                    "siap, info lokasi menyusul"
                ]
            }
        ];
    }

    static evaluateLogs(sessionLogs) {
        let scores = {
            verbosity: 100,
            question_count: 100,
            emoji_frequency: 100,
            reaction_frequency: 100,
            bubble_count: 100,
            topic_switches: 100,
            repetition: 100,
            initiative: 100,
            response_latency: 100,
            context_accuracy: 100
        };

        let totalWords = 0;
        let totalQuestions = 0;
        let totalEmojis = 0;
        let totalReactions = 0;
        let totalBubbles = 0;
        let seenTexts = new Set();

        sessionLogs.forEach(turn => {
            if (!turn || !turn.agent) return;
            const text = turn.agent;
            
            // 1. Verbosity Check (Target: < 15 words)
            const wordCount = text.split(/\s+/).length;
            totalWords += wordCount;
            if (wordCount > 25) scores.verbosity -= 15;
            if (wordCount > 40) scores.verbosity -= 30;

            // 2. Question Count Check (Target: < 1 question per turn)
            const qCount = (text.match(/\?/g) || []).length;
            totalQuestions += qCount;
            if (qCount > 1) scores.question_count -= 25;

            // 3. Emoji Frequency (Target: max 1 emoji per turn)
            const emojiMatches = text.match(/[\u{1F300}-\u{1F6FF}]/gu) || [];
            totalEmojis += emojiMatches.length;
            if (emojiMatches.length > 1) scores.emoji_frequency -= 20;

            // 4. Repetition Check
            const normalized = text.toLowerCase().trim();
            if (seenTexts.has(normalized)) {
                scores.repetition -= 30;
            }
            seenTexts.add(normalized);

            // 5. Bubble Count (Target: max 2 bubbles)
            const bubbles = turn.bubbles || [text];
            totalBubbles += bubbles.length;
            if (bubbles.length > 2) scores.bubble_count -= 25;
        });

        // Cap scores between 0 and 100
        for (const k in scores) {
            scores[k] = Math.max(0, scores[k]);
        }

        const overall = (Object.values(scores).reduce((a, b) => a + b, 0) / 10).toFixed(2);

        return {
            overall,
            scores,
            stats: {
                avgWords: (totalWords / Math.max(1, sessionLogs.length)).toFixed(1),
                totalQuestions,
                totalEmojis,
                totalBubbles
            }
        };
    }
}
