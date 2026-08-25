// src/telemetry/MessageLifecycleTracker.mjs
// End-to-End Message Lifecycle Tracker

import fs from 'fs/promises';
import path from 'path';

const lifecycleDir = path.resolve(process.cwd(), 'memory/lifecycle');

export class MessageLifecycleTracker {
    static async createLifecycle(chatId, rawMessageText) {
        await fs.mkdir(lifecycleDir, { recursive: true });
        const shortId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
        
        const initialRecord = {
            lifecycleId: shortId,
            chatId,
            startTime: Date.now(),
            inputText: rawMessageText?.slice(0, 100) || '',
            finalOutcome: 'PENDING',
            timeline: [
                { phase: 'RECEIVED', timestamp: Date.now(), details: { text: rawMessageText?.slice(0, 50) } }
            ]
        };

        const filePath = path.join(lifecycleDir, `${shortId}.json`);
        await fs.writeFile(filePath, JSON.stringify(initialRecord, null, 2), 'utf8');

        return shortId;
    }

    static async logPhase(lifecycleId, phase, details = {}) {
        if (!lifecycleId) return;
        const filePath = path.join(lifecycleDir, `${lifecycleId}.json`);

        try {
            const raw = await fs.readFile(filePath, 'utf8');
            const record = JSON.parse(raw);

            record.timeline.push({
                phase,
                timestamp: Date.now(),
                elapsedMs: Date.now() - record.startTime,
                details
            });

            if (['COMPLETED', 'FAILED_EXPLICITLY', 'DROPPED', 'DEFERRED'].includes(phase)) {
                record.finalOutcome = phase;
                record.totalLatencyMs = Date.now() - record.startTime;
            }

            await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
        } catch (e) {
            // Silently handle if file read error
        }
    }

    static async getLifecycle(lifecycleId) {
        const filePath = path.join(lifecycleDir, `${lifecycleId}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
}
