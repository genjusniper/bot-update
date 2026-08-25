// src/behavior/ConversationEndingDetector.mjs
// Detects conversation closures and generates natural, concise sign-offs

export class ConversationEndingDetector {
    static isEnding(message) {
        const text = (message || '').trim().toLowerCase();
        return Boolean(
            text.match(/^(oke makasih|makasih bro|suwun ya|tengkyu|maturnuwun|makasih banyak)/i) ||
            text.match(/^(sip otw|otw dulu|cabut dulu|pamit dulu|jalan dulu)/i) ||
            text.match(/^(tidur dulu|ngantuk mau tidur|bobok dulu|sleep dulu)/i) ||
            text.match(/^(nanti gue kabari|nanti chat lagi|ntar lanjut lagi)/i)
        );
    }

    static getSignOff(message) {
        const text = (message || '').trim().toLowerCase();

        if (text.match(/tidur|ngantuk|bobok/i)) {
            const replies = [
                "siap, istirahat gih bro 👍",
                "yoi, selamat tidur bro 😴",
                "tidur sek bro, ben sesuk seger 👍"
            ];
            return {
                handled: true,
                reply: replies[Math.floor(Math.random() * replies.length)],
                reactionEmoji: '😴'
            };
        }

        if (text.match(/otw|cabut|jalan|pamit/i)) {
            const replies = [
                "siap, hati-hati di jalan bro! 🛵",
                "yoi, safety first bro 👍",
                "oke, kabari nek wis tekan ya 👍"
            ];
            return {
                handled: true,
                reply: replies[Math.floor(Math.random() * replies.length)],
                reactionEmoji: '🛵'
            };
        }

        // General thank you / wrap-up
        const generalReplies = [
            "siap bro 👍",
            "yoi, sama-sama santai aja bro!",
            "aman bro, santai wae 👍",
            "yoi bro! 👍"
        ];

        return {
            handled: true,
            reply: generalReplies[Math.floor(Math.random() * generalReplies.length)],
            reactionEmoji: '👍'
        };
    }
}
