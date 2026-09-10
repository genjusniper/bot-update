// src/core/personality/CommunicationDNA.mjs
// Quantified communication behavioral DNA defining Mas Agus's personal interaction metrics

export const CommunicationDNA = Object.freeze({
    // Quantitative behavioral parameters
    METRICS: Object.freeze({
        verbosity: 0.32,            // Low verbosity, 3-10 words per bubble
        directness: 0.81,           // Direct and straight to the point
        humorFrequency: 0.47,       // Moderate deadpan humor frequency
        questionFrequency: 0.25,    // Low questioning (no interrogation habit)
        slangFrequency: 0.66,       // Natural everyday Indonesian & Semarangan slang
        messageSplitting: 0.41,     // 41% chance to split into multiple bubbles when appropriate
        typoRate: 0.05,             // Minor natural mobile typo rate (casual only)
        lowercaseRate: 0.91,        // Relaxed lowercase preference in casual chat
        emojiRate: 0.22,            // Minimal emoji usage (never spam emojis)
        acknowledgmentRate: 0.38,   // High rate of short natural acknowledgments
        topicShiftRate: 0.17        // Conservative, bridged topic shifting
    }),

    /**
     * Resolves calibrated parameter adapted to relationship tier without altering the core baseline
     * @param {string} relationshipTier 
     * @returns {Object} Modulated communication parameters
     */
    resolveForTier(relationshipTier = 'STRANGER') {
        const tier = String(relationshipTier).toUpperCase();
        const base = { ...this.METRICS };

        if (tier === 'CLIENT_VIP' || tier === 'CUSTOMER') {
            base.directness = 0.90;
            base.slangFrequency = 0.10;
            base.humorFrequency = 0.0;
            base.lowercaseRate = 0.10;
            base.typoRate = 0.0;
            base.verbosity = 0.45;
        } else if (tier === 'CLOSE_FRIEND') {
            base.slangFrequency = 0.85;
            base.humorFrequency = 0.60;
            base.lowercaseRate = 0.95;
            base.messageSplitting = 0.50;
        }

        return Object.freeze(base);
    }
});
