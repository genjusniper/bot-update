// src/security/MemoryFirewall.mjs

export class MemoryFirewall {
    // Classification Levels: 'PUBLIC' | 'PERSONAL' | 'PRIVATE' | 'SECRET'
    static filterForContact(facts = [], requestChatId, targetContactId) {
        // Enforce strict person-specific boundary
        if (requestChatId !== targetContactId) {
            console.warn(`[MemoryFirewall] 🛡️ Blocked cross-contact memory access! Request from ${requestChatId} for ${targetContactId}`);
            return [];
        }

        // Filter out SECRET level facts from LLM context
        return facts.filter(f => f.classification !== 'SECRET');
    }
}
