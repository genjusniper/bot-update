// src/evaluation/HumanConversationEvaluator.mjs
// HumanConversationEvaluator: Simulates 8 social scenarios and scores 10 vital conversational health metrics

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
            reply_fatigue: 100,            // Penalty for walls of text or overly wordy answers
            conversation_continuation: 100, // Balanced turn flow
            bot_overtalking: 100,          // Penalty for taking over conversation
            question_pressure: 100,        // Penalty for interrogating user
            repetition: 100,               // Penalty for pattern matching/template responses
            emotional_mismatch: 100,       // Penalty for inappropriate emotional transitions (e.g. laughing during curhat)
            unwanted_topic_switching: 100, // Penalty for switching topics unnecessarily
            unnecessary_replies: 100,      // Penalty for reply instead of reaction/silent
            context_accuracy: 100,
            naturalness: 100
        };

        let totalWords = 0;
        let totalQuestions = 0;
        let totalEmojis = 0;
        let totalBubbles = 0;
        let seenTexts = new Set();

        sessionLogs.forEach(turn => {
            if (!turn) return;
            const text = turn.agent || '';
            const userText = turn.user || '';

            // 1. Bot Overtalking & Reply Fatigue (Avg words check)
            const wordCount = text.split(/\s+/).length;
            totalWords += wordCount;
            if (wordCount > 25) {
                scores.bot_overtalking -= 20;
                scores.reply_fatigue -= 10;
            }

            // 2. Question Pressure
            const qCount = (text.match(/\?/g) || []).length;
            totalQuestions += qCount;
            if (qCount > 1) {
                scores.question_pressure -= 25;
            }

            // 3. Emotional Mismatch (e.g. laughing wkwk when user curhats/vents)
            const isUserVenting = Boolean(userText.match(/(pusing|lembur|pelit|resign|stress|mumet|capek)/i));
            if (isUserVenting && text.toLowerCase().includes('wkwk')) {
                scores.emotional_mismatch -= 30; // Roasting/laughing at venting user penalized!
            }

            // 4. Unnecessary Replies
            const isUserShort = Boolean(userText.match(/^(wkwk|oke|sip)$/i));
            if (isUserShort && text.length > 0) {
                scores.unnecessary_replies -= 20; // Should have been silent or reaction!
            }

            // 5. Repetition Check
            const normalized = text.toLowerCase().trim();
            if (seenTexts.has(normalized)) {
                scores.repetition -= 30;
            }
            seenTexts.add(normalized);
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
