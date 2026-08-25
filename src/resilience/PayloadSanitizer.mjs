// src/resilience/PayloadSanitizer.mjs
// Strict Payload Validator & Repair to eliminate 'oneof field data' errors

export class PayloadSanitizer {
    static sanitizeContents(rawContents) {
        if (!Array.isArray(rawContents) || rawContents.length === 0) {
            return [{ role: 'user', parts: [{ text: 'Halo' }] }];
        }

        const cleanContents = [];

        for (const turn of rawContents) {
            if (!turn || typeof turn !== 'object') continue;
            const role = turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user';
            const cleanParts = [];

            if (Array.isArray(turn.parts)) {
                for (const part of turn.parts) {
                    if (part && typeof part.text === 'string' && part.text.trim().length > 0) {
                        cleanParts.push({ text: part.text.trim() });
                    }
                }
            } else if (typeof turn.text === 'string' && turn.text.trim().length > 0) {
                cleanParts.push({ text: turn.text.trim() });
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
            return { parts: [{ text: 'Kamu adalah teman ngobrol WhatsApp yang asik dan santai.' }] };
        }
        return { parts: [{ text: rawInstruction.trim() }] };
    }
}
