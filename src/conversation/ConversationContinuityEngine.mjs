// src/conversation/ConversationContinuityEngine.mjs
// Unifies ConversationContinuityLock, StoryThreadTracker, and TopicGraph to resolve references ("itu", "yang tadi", "dia")

import { ConversationContinuityLock } from './ConversationContinuityLock.mjs';
import { StoryThreadTracker } from './StoryThreadTracker.mjs';

export class ConversationContinuityEngine {
    static async evaluate({ text, chatId, outcomeTrackerData = null }) {
        const lower = (text || '').trim().toLowerCase();
        const lock = await ConversationContinuityLock.getLock(chatId);
        const storyThreads = await StoryThreadTracker.getThreads(chatId);
        const activeStories = StoryThreadTracker.getActiveThreads(storyThreads);

        const directives = [];

        // 1. Reference Resolver ("dia", "itu", "yang tadi", "yang kemarin")
        let referenceDirective = '';
        if (lower.match(/\b(dia|dianya|rekane|kancane)\b/i) && lock.lastMentionedPerson) {
            referenceDirective = `- RESOLUSI REFERENSI ("dia"): Rujukan kata "dia/dianya" kemungkinan besar merujuk kepada orang terakhir yang dibahas: "${lock.lastMentionedPerson}".`;
        } else if (lower.match(/\b(itu|itunya|barang kuwi|kuwi)\b/i) && lock.currentTopic && lock.currentTopic !== 'general') {
            referenceDirective = `- RESOLUSI REFERENSI ("itu"): Rujukan kata "itu/kuwi" kemungkinan besar merujuk kepada objek/topik aktif terakhir: "${lock.currentTopic}".`;
        } else if (lower.match(/\b(yang tadi|sing mau|tadi gimana|sing ketoke)\b/i) && activeStories.length > 0) {
            referenceDirective = `- RESOLUSI REFERENSI ("yang tadi"): Rujukan kata "yang tadi" kemungkinan besar merujuk kepada cerita aktif: "${activeStories[0].summary}".`;
        } else if (lower.match(/\b(yang kemarin|sing wingi|wingi)\b/i) && outcomeTrackerData) {
            referenceDirective = `- RESOLUSI REFERENSI ("yang kemarin"): Rujukan kata "yang kemarin" kemungkinan besar merujuk rencana/janji yang belum selesai: "${outcomeTrackerData.planSummary || 'rencana kemarin'}".`;
        }

        if (referenceDirective) {
            directives.push(referenceDirective);
        }

        // 2. Thread State & Topic Resume
        if (lock.currentTopic && lock.currentTopic !== 'general') {
            directives.push(`- STATUS ALUR (ACTIVE THREAD): "${lock.currentTopic}". Jawab dengan menyambung alur topik ini secara langsung tanpa perlu mengulang penjelasan dari awal.`);
        }
        if (lock.activeStory) {
            directives.push(`- CERITA AKTIF (STORY THREAD): "${lock.activeStory}".`);
        }

        // 3. Open Loops & Unresolved Tasks
        if (lock.unresolvedQuestion) {
            directives.push(`- POIN MENUNGGU RESPONS: "${lock.unresolvedQuestion}".`);
        }

        return `=== ENGINES: CONVERSATION CONTINUITY & REFERENCE RESOLUTION ===
${directives.join('\n') || '- Status: Aliran obrolan mengalir wajar.'}
================================================================`;
    }
}
