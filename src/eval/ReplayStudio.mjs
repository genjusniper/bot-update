// src/eval/ReplayStudio.mjs
// Conversation Replay Studio & Observability Trace Inspector

import fs from 'fs/promises';
import path from 'path';

const studioDir = path.resolve(process.cwd(), 'memory/replay_studio');

export class ReplayStudio {
    static async recordTrace(correlationId, traceData) {
        if (!correlationId) return;
        await fs.mkdir(studioDir, { recursive: true });
        const filePath = path.join(studioDir, `${correlationId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        
        const fullTrace = {
            correlationId,
            timestamp: Date.now(),
            incomingMessage: traceData.message,
            routing: {
                tier: traceData.complexityTier,
                route: traceData.routeSelected,
                model: traceData.modelUsed || 'LOCAL'
            },
            cognitiveContext: {
                intent: traceData.intent,
                mode: traceData.mode,
                topic: traceData.topic,
                humorMode: traceData.humorMode
            },
            tokenMetrics: {
                budgetUsed: traceData.tokensEstimated || 0,
                latencyMs: traceData.latencyMs || 0
            },
            finalOutput: traceData.finalMessage,
            reasoning: traceData.reasoning || 'Executed standard conversational pipeline.'
        };

        await fs.writeFile(filePath, JSON.stringify(fullTrace, null, 2), 'utf8');
    }

    static async getTrace(correlationId) {
        const filePath = path.join(studioDir, `${correlationId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
}
