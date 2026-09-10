// src/core/learning/OutcomeLearningLoop.mjs
// Context -> Decision -> Outcome -> Lesson tracking engine

export class OutcomeLearningLoop {
    static #lessons = [];

    /**
     * Evaluates user feedback following an interaction
     * @param {Object} params
     * @param {string} params.userReactionText - What user typed next
     * @param {Object} params.lastContract - The PersonalContextContract used for previous turn
     * @returns {Object|null} Learned lesson or null
     */
    static processOutcome({ userReactionText = '', lastContract = null }) {
        if (!userReactionText) return null;

        const lower = userReactionText.toLowerCase().trim();

        // 1. Explicit length correction
        if (/(terlalu panjang|panjang amat|panjang banget|kependekan|singkat aja)/i.test(lower)) {
            const isTooLong = /panjang/i.test(lower);
            const lesson = {
                lessonId: `lsn_${Date.now()}`,
                category: 'VERBOSITY',
                directive: isTooLong ? 'CLAMP_TO_ULTRA_SHORT' : 'PERMIT_EXPANDED',
                timestamp: Date.now()
            };
            this.#lessons.push(lesson);
            return lesson;
        }

        // 2. Explicit tone correction
        if (/(terlalu kaku|jangan formal|santai aja|jangan sok asik|biasa aja)/i.test(lower)) {
            const isTooFormal = /kaku|formal/i.test(lower);
            const lesson = {
                lessonId: `lsn_${Date.now()}`,
                category: 'TONE',
                directive: isTooFormal ? 'INCREASE_CASUAL_DIALECT' : 'INCREASE_PROFESSIONAL_RESPECT',
                timestamp: Date.now()
            };
            this.#lessons.push(lesson);
            return lesson;
        }

        // 3. Positive reinforcement
        if (/\b(sip|mantap|pas banget|bener|makasih|thanks|terima kasih|keren|bagus)\b/i.test(lower)) {
            const lesson = {
                lessonId: `lsn_${Date.now()}`,
                category: 'REINFORCEMENT',
                directive: 'REINFORCE_CURRENT_STRATEGY',
                timestamp: Date.now()
            };
            this.#lessons.push(lesson);
            return lesson;
        }

        return null;
    }

    /**
     * Lists all recorded lessons
     * @returns {Object[]}
     */
    static getLessons() {
        return [...this.#lessons];
    }

    /**
     * Resets lessons for testing
     */
    static reset() {
        this.#lessons = [];
    }
}
