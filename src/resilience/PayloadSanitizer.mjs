// src/resilience/PayloadSanitizer.mjs — MULTI-IMAGE ALBUM & QUOTE READY

export class PayloadSanitizer {
    static sanitizeContents(rawContents, images = [], quotedContext = null) {
        if (!Array.isArray(rawContents) || rawContents.length === 0) {
            rawContents = [{ role: 'user', parts: [{ text: 'Halo' }] }];
        }

        const cleanContents = [];

        // Prepend Quoted Context if present on first turn or user turn
        const quotePrefix = quotedContext && quotedContext.text 
            ? `[MEMBALAS PESAN: "${quotedContext.text}" (Dari: ${quotedContext.sender || 'User'})]\n`
            : '';

        for (let i = 0; i < rawContents.length; i++) {
            const turn = rawContents[i];
            if (!turn || typeof turn !== 'object') continue;
            const role = turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user';
            const cleanParts = [];

            const isLastUserTurn = (i === rawContents.length - 1) && role === 'user';

            // If images array is provided on the last user turn, push all images
            if (isLastUserTurn && Array.isArray(images) && images.length > 0) {
                for (const img of images) {
                    if (img && img.base64) {
                        cleanParts.push({
                            inline_data: {
                                mime_type: (img.mimeType || 'image/jpeg').split(';')[0],
                                data: img.base64
                            }
                        });
                    }
                }
            }

            if (Array.isArray(turn.parts)) {
                for (const part of turn.parts) {
                    if (part && typeof part.text === 'string' && part.text.trim().length > 0) {
                        const txt = isLastUserTurn && quotePrefix ? `${quotePrefix}${part.text.trim()}` : part.text.trim();
                        cleanParts.push({ text: txt });
                    } else if (part && part.inline_data) {
                        cleanParts.push(part);
                    }
                }
            } else if (typeof turn.text === 'string' && turn.text.trim().length > 0) {
                const txt = isLastUserTurn && quotePrefix ? `${quotePrefix}${turn.text.trim()}` : turn.text.trim();
                cleanParts.push({ text: txt });
            }

            if (cleanParts.length > 0) {
                cleanContents.push({ role, parts: cleanParts });
            }
        }

        if (cleanContents.length === 0) {
            return [{ role: 'user', parts: [{ text: 'Halo' }] }];
        }

        return cleanContents;
    }

    static sanitizeSystemInstruction(rawInstruction) {
        if (!rawInstruction || typeof rawInstruction !== 'string') {
            return { parts: [{ text: 'Kamu adalah asisten pribadi WhatsApp yang sangat asik, cerdas, dan santai.' }] };
        }
        return { parts: [{ text: rawInstruction.trim() }] };
    }
}
