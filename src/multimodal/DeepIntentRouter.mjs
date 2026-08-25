// src/multimodal/DeepIntentRouter.mjs
// Lightweight Rule & Regex Intent Classifier (1-5ms, Zero API cost)

export class DeepIntentRouter {
    static classify(message, attachments = {}) {
        const text = (message || '').trim().toLowerCase();

        // 1. Audio / Voice Note Intake
        if (attachments.hasAudio) {
            return {
                intent: 'VOICE_NOTE',
                requiresAI: true,
                priority: 'HIGH',
                targetRoute: 'AUDIO_MULTIMODAL'
            };
        }

        // 2. Photo / Image Intake
        if (attachments.hasImage) {
            // Check if it's a troubleshoot / error photo
            if (text.match(/(error|rusak|kenapa ini|bisa gak|mati|hang|layar|kabel)/i)) {
                return { intent: 'TROUBLESHOOT_VISION', requiresAI: true, targetRoute: 'VISION_MULTIMODAL' };
            }
            if (text.match(/(dimana|tempat|lokasi|daerah|pemandangan)/i)) {
                return { intent: 'PLACE_VISION', requiresAI: true, targetRoute: 'VISION_MULTIMODAL' };
            }
            if (text.match(/(bagus gak|rekomendasi|beli|harga|worth)/i)) {
                return { intent: 'PRODUCT_VISION', requiresAI: true, targetRoute: 'VISION_MULTIMODAL' };
            }
            return { intent: 'PHOTO_VISION', requiresAI: true, targetRoute: 'VISION_MULTIMODAL' };
        }

        // 3. Link / URL Intake
        const urlMatch = message && message.match(/https?:\/\/[^\s]+/i);
        if (urlMatch) {
            return {
                intent: 'LINK_ANALYSIS',
                url: urlMatch[0],
                requiresAI: true,
                targetRoute: 'LINK_INTELLIGENCE'
            };
        }

        // 4. Local Ultra-Fast Path (1-5ms, 0 Token)
        if (/^(p|oi|oy|halo|hai|wkwk|haha|ngakak|oke|sip|siap|gas|lah|anjir|yo|yoi|mantap)$/i.test(text)) {
            return {
                intent: 'LOCAL_FAST',
                requiresAI: false,
                targetRoute: 'LOCAL_FAST_PATH'
            };
        }

        // 5. Semantic Cacheable Queries (Food, Boredom, Routine checks)
        if (text.match(/^(makan apa|laper nih|rekomendasi makan|enak makan apa|lagi males|mager banget)$/i)) {
            return {
                intent: 'SEMANTIC_CACHE',
                requiresAI: false,
                targetRoute: 'SEMANTIC_CACHE_PATH'
            };
        }

        // 6. Default Conversational AI
        return {
            intent: 'GENERAL_CONVERSATION',
            requiresAI: true,
            targetRoute: 'AI_GATEWAY'
        };
    }
}
