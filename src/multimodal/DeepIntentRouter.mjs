// src/multimodal/DeepIntentRouter.mjs
// V13.7 — Expanded: share.google, youtu.be, shopee, tokopedia, broader LOCAL_FAST

export class DeepIntentRouter {
    static classify(message, attachments = {}) {
        const text = (message || '').trim().toLowerCase();

        // 1. Audio / Voice Note
        if (attachments.hasAudio) {
            return { intent: 'VOICE_NOTE', requiresAI: true, priority: 'HIGH', targetRoute: 'AUDIO_MULTIMODAL' };
        }

        // 2. Photo / Image (all subtypes route to VISION_MULTIMODAL)
        if (attachments.hasImage || (attachments.imageCount && attachments.imageCount > 0)) {
            if (text.match(/(error|rusak|kenapa ini|bisa gak|mati|hang|layar|kabel|benerin|servis)/i)) {
                return { intent: 'TROUBLESHOOT_VISION', requiresAI: true, targetRoute: 'VISION_MULTIMODAL' };
            }
            if (text.match(/(dimana|tempat|lokasi|daerah|pemandangan|ini dimana|di mana ini|spot)/i)) {
                return { intent: 'PLACE_VISION', requiresAI: true, targetRoute: 'VISION_MULTIMODAL' };
            }
            if (text.match(/(bagus gak|rekomendasi|beli|harga|worth|cocok|berapa|murah|mahal|review)/i)) {
                return { intent: 'PRODUCT_VISION', requiresAI: true, targetRoute: 'VISION_MULTIMODAL' };
            }
            return { intent: 'PHOTO_VISION', requiresAI: true, targetRoute: 'VISION_MULTIMODAL' };
        }

        // 3. Link / URL — Full Social Media + Marketplace detection
        const urlMatch = message && message.match(/(https?:\/\/[^\s]+|maps\.app\.goo\.gl\/[^\s]+|goo\.gl\/maps\/[^\s]+|share\.google\/[^\s]+)/i);
        if (urlMatch) {
            const rawUrl = urlMatch[0];
            const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
            return {
                intent: 'LINK_ANALYSIS',
                url: fullUrl,
                requiresAI: true,
                targetRoute: 'LINK_INTELLIGENCE'
            };
        }

        // 4. Local Ultra-Fast Path (0 Token, <1ms) — expanded Jawa/Indo casual responses
        if (/^(p|oi|oy|halo|hai|wkwk|haha|ngakak|oke|sip|siap|gas|lah|anjir|yo|yoi|mantap|sipp|ok|otw|lol|wkwkwk|hehe|tos|gaskeun|nggih|monggo|yaudah|makasih|thanks|thx|noted|aman|siipp)$/i.test(text)) {
            return { intent: 'LOCAL_FAST', requiresAI: false, targetRoute: 'LOCAL_FAST_PATH' };
        }

        // 5. Semantic Cache Path (frequent casual questions)
        if (/^(makan apa|laper nih|rekomendasi makan|enak makan apa|lagi males|mager banget|bosen nih|gabut|ngantuk|mau ngapain|ngapain sekarang)$/i.test(text)) {
            return { intent: 'SEMANTIC_CACHE', requiresAI: false, targetRoute: 'SEMANTIC_CACHE_PATH' };
        }

        // 6. Default: Full Gemini Conversation
        return { intent: 'GENERAL_CONVERSATION', requiresAI: true, targetRoute: 'AI_GATEWAY' };
    }
}
