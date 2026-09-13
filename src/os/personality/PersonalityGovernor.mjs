/**
 * PersonalityGovernor.mjs
 * 
 * Dynamic Personality and Emotion Governor.
 * Bridges:
 * - SeriousnessDetector
 * - FrustrationDetector
 * - ConversationEnergy
 * - HumorPermission Gate
 * 
 * Rules:
 * - High Seriousness (> 0.80) or Frustration -> Humor permission 0.0 (Strictly professional/factual)
 * - Low Seriousness (< 0.40) & High Energy -> Humor permission 0.7 (Friendly, witty banter permitted)
 * - Default -> Calm, grounded, dignified peer
 */

export class PersonalityGovernor {
    /**
     * Compute personality permissions and dynamic tone bounds
     */
    static govern({ emotionalTone, seriousness, energy = 0.5 }) {
        const isFrustrated = emotionalTone === 'FRUSTRATED';
        const isSkeptical = emotionalTone === 'SKEPTICAL';

        let humorPermission = 0.1; // Baseline small banter
        let sarcasmPermission = 0.0; // Strictly 0 by default

        // 1. High Seriousness or Frustration -> Completely disable humor
        if (seriousness >= 0.80 || isFrustrated || isSkeptical) {
            humorPermission = 0.0;
            return {
                mode: 'SERIOUS_BUSINESS',
                humorPermission: 0.0,
                sarcasmPermission: 0.0,
                allowedEmojis: ['🤝', '📋', '✅'],
                guidance: 'Fokus pada penyelesaian masalah, kejelasan fakta, dan empati tanpa guyonan.'
            };
        }

        // 2. Playful Casual Chat -> Controlled Banter
        if (emotionalTone === 'PLAYFUL' && seriousness < 0.40) {
            humorPermission = 0.65;
            sarcasmPermission = 0.20;
            return {
                mode: 'WITTY_PEER',
                humorPermission,
                sarcasmPermission,
                allowedEmojis: ['☕', '😎', '🧠'],
                guidance: 'Boleh sedikit bercanda santai dan cerdas, tetap berkelas dan tidak melecehkan.'
            };
        }

        // 3. Balanced Professional
        return {
            mode: 'CALM_OPERATOR',
            humorPermission: 0.20,
            sarcasmPermission: 0.0,
            allowedEmojis: ['💡', '👍', '🚀'],
            guidance: 'Santai, percaya diri, lugas, dan bersahabat.'
        };
    }
}
