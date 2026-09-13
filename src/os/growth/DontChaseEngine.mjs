// src/os/growth/DontChaseEngine.mjs
// ============================================================================
// SALIM OS - "DON'T CHASE" DIGNITY & ANTI-SPAM ENGINE
// Stops pursuing conversations immediately when user signals completion or low interest
// ============================================================================

export class DontChaseEngine {
    static PASSIVE_CLOSING_PATTERNS = [
        /^(?:oh|ooh|oke|ok|sip|siap|y|ya|iya|yo|yowis|mantap|noted|makasih|terima\s+kasih|suwun|maturnuwun|thanks|thx)(?:\s+(?:ya|mas|gus|kak|om|bro|infonya|makasih|terima\s+kasih|nih|deh|dulu))*[.!]?$/i,
        /^(?:gitu\s+ya|begitu\s+ya|yaudah|ya\s+udah)[.!]?$/i,
        /^(?:nanti\s+dikabari|kapan-kapan|liat\s+nanti)[.!]?$/i
    ];

    /**
     * Determines if conversation should cease commercial engagement
     */
    static shouldCeaseFollowUp(text = '') {
        const trimmed = text.trim();
        const matchesPassive = this.PASSIVE_CLOSING_PATTERNS.some(p => p.test(trimmed));

        if (matchesPassive) {
            return {
                cease: true,
                gracefulClosingText: 'Siap, santai aja. Kalau kapan-kapan tokomu butuh ngobrolin sistem ini lagi, pintu selalu terbuka ya!'
            };
        }

        return { cease: false };
    }
}
