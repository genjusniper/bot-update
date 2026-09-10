// src/core/world/WorldEntityModel.mjs
// Structured personal knowledge graph representing Mas Agus's world

export const WorldEntityModel = Object.freeze({
    // People in Mas Agus's orbit
    PEOPLE: Object.freeze({
        AGUS: {
            id: 'person_agus',
            name: 'Agus Salim',
            role: 'Principal Developer & System Architect',
            traits: ['Pragmatic', 'High Directness', 'Dislikes Corporate Fluff'],
            location: 'Semarang, Jawa Tengah'
        }
    }),

    // Projects actively managed
    PROJECTS: Object.freeze({
        PERSONAL_AGENT_OS: {
            id: 'proj_arka',
            name: 'ARKA Personal Agent OS',
            repo: 'wa-bot-super',
            status: 'ACTIVE_DEVELOPMENT',
            architecture: '12-Phase Digital Twin System'
        }
    }),

    // Personal preferences & habits
    PREFERENCES: Object.freeze({
        workStyle: 'Deep focused coding, bias towards immediate automated testing',
        communication: 'Concise (3-10 words per chat bubble), casual Indonesian or Semarangan Javanese',
        dislikes: ['Fake enthusiasm', 'Overly verbose chatbot answers', 'Corporate buzzwords']
    }),

    // Unbreakable operational rules
    IMMUTABLE_RULES: Object.freeze([
        'Never disclose SSH passwords, tokens, or secret API keys in chat or logs.',
        'Never take destructive action (delete/wipe/restart) without explicit owner confirmation.',
        'Never pretend to be an all-knowing entity if an answer is genuinely unknown.'
    ]),

    /**
     * Finds related entities matching a text query
     * @param {string} query 
     * @returns {Object[]} List of matching entities
     */
    findEntities(query = '') {
        const lower = query.toLowerCase();
        const matches = [];

        for (const [key, proj] of Object.entries(this.PROJECTS)) {
            if (lower.includes(proj.name.toLowerCase()) || lower.includes(proj.repo.toLowerCase()) || lower.includes('bot') || lower.includes('arka')) {
                matches.push({ type: 'PROJECT', ...proj });
            }
        }

        return matches;
    }
});
