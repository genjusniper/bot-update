// src/communication/Phrasebook.mjs
// Personal Phrasebook & Natural Lexicon Substitutions

export class Phrasebook {
    static substitutions = {
        'tidak': 'gak',
        'enggak': 'nggak',
        'sebentar': 'bentar',
        'bagaimana': 'gimana',
        'mengapa': 'kenapa',
        'sedang apa': 'lagi ngapain',
        'sudah': 'udah',
        'belum': 'durung',
        'kenapa ya': 'ngopo to',
        'iya betul': 'iyo bener',
        'saja': 'wae'
    };

    static favoriteOpeners = [
        'lha', 'waduh', 'anjir', 'eh', 'wkwk', 'wah'
    ];

    static favoriteClosers = [
        'to', 'wae', 'ki', 'wkwk', 'cuy', 'bro', '😂', '😭'
    ];

    static refineText(rawText) {
        if (!rawText || typeof rawText !== 'string') return rawText;
        let text = rawText;

        // Apply natural substitutions
        for (const [formal, casual] of Object.entries(this.substitutions)) {
            const regex = new RegExp(`\\b${formal}\\b`, 'gi');
            text = text.replace(regex, casual);
        }

        return text;
    }
}
