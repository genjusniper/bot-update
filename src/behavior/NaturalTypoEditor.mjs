// src/behavior/NaturalTypoEditor.mjs
// Rare human keyboard typo generator & native WhatsApp message editor (<1ms, 0 Token)
// Occasionally (5% chance on long text), introduces 1 minor nearby-key typo, sends it, then edits it after 1.5s via WhatsApp native edit!

export class NaturalTypoEditor {
    static KEYBOARD_NEIGHBORS = {
        'a': 's', 's': 'a', 'd': 's', 'f': 'd', 'g': 'h', 'h': 'g', 'j': 'k', 'k': 'j', 'l': 'k',
        'q': 'w', 'w': 'e', 'e': 'r', 'r': 't', 't': 'y', 'y': 'u', 'u': 'i', 'i': 'o', 'o': 'p', 'p': 'o',
        'z': 'x', 'x': 'z', 'c': 'v', 'v': 'c', 'b': 'n', 'n': 'm', 'm': 'n'
    };

    /**
     * Evaluates whether a text should get an occasional typo (5% probability on text > 8 words)
     */
    static shouldIntroduceTypo(text) {
        if (!text) return false;
        const words = text.trim().split(/\s+/);
        // Only on messages with 8 to 25 words, and strictly 5% random chance
        if (words.length < 8 || words.length > 25) return false;
        // Exclude links, commands, and numbers
        if (text.includes('http') || text.includes('08') || text.startsWith('.')) return false;

        return Math.random() < 0.05; // 5% chance
    }

    /**
     * Swaps 1 character with a realistic keyboard neighbor in a random non-essential word
     */
    static generateTypo(text) {
        const words = text.split(' ');
        if (words.length < 5) return { typoText: text, isTypo: false };

        // Pick a word in the middle (not first or last word)
        const targetWordIndex = Math.floor(Math.random() * (words.length - 2)) + 1;
        const targetWord = words[targetWordIndex];

        if (targetWord.length < 4 || targetWord.includes('http')) {
            return { typoText: text, isTypo: false };
        }

        // Pick a character in the target word to typo
        const charIdx = Math.floor(targetWord.length / 2);
        const char = targetWord[charIdx].toLowerCase();
        const neighbor = this.KEYBOARD_NEIGHBORS[char] || char;

        if (neighbor === char) {
            return { typoText: text, isTypo: false };
        }

        const typoWord = targetWord.substring(0, charIdx) + neighbor + targetWord.substring(charIdx + 1);
        words[targetWordIndex] = typoWord;

        return {
            typoText: words.join(' '),
            cleanText: text,
            isTypo: true
        };
    }
}
