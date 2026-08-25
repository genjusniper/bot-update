// src/conversation/ConversationContinuityLock.mjs
// Conversation Continuity Lock maintaining deep multi-turn conversational context

import fs from 'fs/promises';
import path from 'path';

const lockDir = path.resolve(process.cwd(), 'memory/continuity_locks');

export class ConversationContinuityLock {
    static async getLock(chatId) {
        await fs.mkdir(lockDir, { recursive: true });
        const filePath = path.join(lockDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return {
                currentTopic: 'general',
                emotionalTone: 'CASUAL',
                unresolvedQuestion: null,
                lastMentionedPerson: null,
                activeStory: null,
                humorLevel: 0.5,
                conversationEnergy: 0.6,
                lastTurnTimestamp: Date.now()
            };
        }
    }

    static async updateLock(chatId, updateData = {}) {
        const lock = await this.getLock(chatId);
        Object.assign(lock, updateData, { lastTurnTimestamp: Date.now() });

        await fs.mkdir(lockDir, { recursive: true });
        const filePath = path.join(lockDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(lock, null, 2), 'utf8');

        return lock;
    }

    static formatDirectives(lock) {
        const parts = [];
        if (lock.currentTopic && lock.currentTopic !== 'general') {
            parts.push(`- Topik Terkunci: "${lock.currentTopic}" (Jaga kesinambungan alur topik ini)`);
        }
        if (lock.activeStory) {
            parts.push(`- Cerita Sedang Berjalan: "${lock.activeStory}"`);
        }
        if (lock.unresolvedQuestion) {
            parts.push(`- Poin Menunggu Tanggapan: "${lock.unresolvedQuestion}"`);
        }
        return parts.length > 0 ? `=== KESINAMBUNGAN PERCAKAPAN (CONTINUITY LOCK) ===\n${parts.join('\n')}` : '';
    }
}
