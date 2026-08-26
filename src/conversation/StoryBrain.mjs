// src/conversation/StoryBrain.mjs
// Otak Alur Cerita (Story Brain) & Confidence Resolver for pronoun ambiguity, pending questions & topic resume

import { ConversationContinuityLock } from './ConversationContinuityLock.mjs';
import { StoryThreadTracker } from './StoryThreadTracker.mjs';

export class StoryBrain {
    static async evaluate({ text, chatId, pushName, history = [] }) {
        const lower = (text || '').trim().toLowerCase();
        const lock = await ConversationContinuityLock.getLock(chatId);
        const storyThreads = await StoryThreadTracker.getThreads(chatId);
        const activeStories = StoryThreadTracker.getActiveThreads(storyThreads);

        const directives = [];

        // 1. Confidence Resolver (Pencegah Salah Tebak Rujukan)
        // If there are multiple people/objects in context, and user uses ambiguous pronouns ("dia", "itu")
        const mentionsMultiplePeople = lower.match(/\b(dia|dianya|rekane|kancane)\b/i);
        const hasMultipleContextPeople = activeStories.length > 1 || (lock.lastMentionedPerson && lower.includes('dia') && activeStories.some(s => s.summary.includes('Melinda') || s.summary.includes('Ulfa')));
        
        if (mentionsMultiplePeople && hasMultipleContextPeople) {
            directives.push(`- CONFIDENCE RESOLVER (Resolusi Kebimbangan): Rujukan kata "dia" memiliki banyak kemungkinan orang dalam konteks. JANGAN asal menebak! Tanyakan dengan santai rujukan yang dimaksud (contoh: "dia sing Ulfa opo Melinda?", "sing mbok maksud kuwi sopo?").`);
        }

        // 2. Pending Question Memory & Matcher
        const isAnsweringPending = lock.unresolvedQuestion && !lower.includes('?') && lower.length < 30;
        if (isAnsweringPending) {
            directives.push(`- PENDING QUESTION MATCHING: User tampaknya sedang menjawab pertanyaan gantung sebelumnya yaitu: "${lock.unresolvedQuestion}". Hubungkan jawaban user dengan konteks pertanyaan tersebut.`);
        }

        // 3. Conversation Resume (Melanjutkan Obrolan Tertunda)
        const isResumeRequest = Boolean(lower.match(/\b(lanjut sing wingi|lanjut wingi|lanjutke|kelanjutane|terus pie|sing wingi kae|lanjut yang kemarin)\b/i));
        if (isResumeRequest && activeStories.length > 0) {
            directives.push(`- CONVERSATION RESUME (Melanjutkan Obrolan): User meminta melanjutkan obrolan kemarin/tadi. Sambung kembali alur cerita terakhir: "${activeStories[0].summary}" secara hangat lan takon kelanjutane (contoh: "ohh sing wingi soal kerjaan kuwi? lanjut, terus piye?").`);
        }

        // 4. Story State Compression Summary
        if (activeStories.length > 0) {
            const summaryParts = activeStories.map(s => `- ${s.summary}`).join('\n');
            directives.push(`=== STORY STATE SUMMARY ===\n${summaryParts}\n===========================`);
        }

        return `=== STORY BRAIN (CONVERSATION STATE MACHINE) ===
${directives.join('\n') || '- Status: Alur cerita berjalan linier.'}
================================================`;
    }
}
