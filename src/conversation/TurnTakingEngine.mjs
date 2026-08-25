// src/conversation/TurnTakingEngine.mjs
// Turn Taking Engine with Question Budget & Minimal Response Policy

export class TurnTakingEngine {
    static evaluateTurn(message, history = [], currentQuestionBudget = 1) {
        const text = (message || '').trim().toLowerCase();
        const words = text.split(/\s+/).length;

        // 1. Check recent AI questions to prevent interrogation feel
        const lastAiMessages = history.filter(m => m.role === 'assistant').slice(-3);
        const recentQuestionsCount = lastAiMessages.filter(m => m.text.includes('?')).length;
        const allowQuestion = recentQuestionsCount < currentQuestionBudget;

        // 2. Minimal / Reaction Only Policy
        // If user says something laughing or a brief reaction
        if (/^(wkwk|haha|njir|anjir|lol|astaga|lah)$/i.test(text) || (words <= 2 && /^(iya|oke|sip|yoi|mantap|siap)$/i.test(text))) {
            return {
                turnType: 'MINIMAL_REACTION',
                allowQuestion: false,
                maxWords: 8,
                directive: "KEBIJAKAN RESPON: Cukup berikan reaksi singkat atau tawa santai (contoh: 'wkwk', 'lah 😂', 'nah kan', 'gas'). JANGAN bertanya balik."
            };
        }

        // 3. User is venting / curhat
        if (text.match(/(capek|lelah|kesel|pusing|stres|drop|masalah)/i)) {
            return {
                turnType: 'SUPPORTIVE_LISTEN',
                allowQuestion: allowQuestion,
                maxWords: 30,
                directive: `KEBIJAKAN RESPON: Dengarkan dengan empati hangat. ${allowQuestion ? 'Boleh tanyakan 1 hal ringan jika relevan.' : 'Jangan bertanya lagi, cukup berikan respon menenangkan.'}`
            };
        }

        // 4. User is sharing a story
        if (text.match(/(tadi kan|jadi gini|kemarin tuh|waktu gue|pas lagi)/i) || words > 15) {
            return {
                turnType: 'ENGAGE_STORY',
                allowQuestion: allowQuestion,
                maxWords: 40,
                directive: "KEBIJAKAN RESPON: Tanggapi alur ceritanya dengan antusias layaknya teman menyimak."
            };
        }

        // 5. Standard Casual Chat
        return {
            turnType: 'CASUAL_FLOW',
            allowQuestion: allowQuestion,
            maxWords: 20,
            directive: `KEBIJAKAN RESPON: Respon santai dan mengalir alami. ${allowQuestion ? 'Boleh lempar pertanyaan santai jika nyambung.' : 'Fokus merespon tanpa menambah pertanyaan baru.'}`
        };
    }
}
