// src/fleet/LightweightRouter.mjs
// Lightweight Deterministic Router for Instant Responses & Zero Quota Waste

export class LightweightRouter {
    static lookup = {
        'p': [
            'Oit, ngopo?',
            'Yo, ada apa bro?',
            'P juga, ada apa nih?',
            'Oyy, nyari siapa?'
        ],
        'oi': [
            'Oitt!',
            'Yo! Piye kabare?',
            'Oyy, ada apa nih?',
            'Yo bro, what\'s up?'
        ],
        'wkwk': [
            'Wkwkwk',
            'Malah ketawa lu 😂',
            'Wkwk ngakak beneran'
        ],
        'anjir': [
            'Wkwk parah emang',
            'Njir kaget gue 😂',
            'Bisa-bisanya wkwk'
        ],
        'lah': [
            'Lah ngopo to? Wkwk',
            'Lah kok gitu? 😂',
            'Lah kenapa emangnya?'
        ],
        'gas': [
            'Gasskeun!',
            'Gas polll! 🔥',
            'Gass, jangan kasih kendor!'
        ]
    };

    static route(message) {
        const clean = message.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (this.lookup[clean]) {
            const list = this.lookup[clean];
            const chosen = list[Math.floor(Math.random() * list.length)];
            return {
                handled: true,
                response: chosen,
                source: 'LIGHTWEIGHT_ROUTER'
            };
        }
        return { handled: false, response: null };
    }
}
