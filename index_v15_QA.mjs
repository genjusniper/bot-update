import dotenv from 'dotenv';
dotenv.config();

// index_v15_QA.mjs — PERMANENT COMPLETION FIX
process.on("unhandledRejection", (reason, promise) => { console.error("[FATAL] Unhandled Rejection:", reason); });
process.on("uncaughtException", (error) => { console.error("[FATAL] Uncaught Exception:", error); });

import { WhatsAppGateway } from './src/gateway/WhatsAppGateway.mjs';
import { AIGateway } from './src/gateway/AIGateway.mjs';
import { EventBus } from './src/event/EventBus.mjs';
import { QueueWorker } from './src/queue/QueueWorker.mjs';
import { JobQueue } from './src/queue/JobQueue.mjs';
import { ConversationFSM, FSMEventBus } from './src/conversation/ConversationFSM.mjs';
import { OSKernel } from './src/os/SelfTrainingKernel.mjs';
import { NaturalConversationEngine } from './src/agent/NaturalConversationEngine.mjs';
import { WebCockpit } from './src/server/WebCockpit.mjs';

console.log('=============================================');
console.log('🤖 UNIVERSAL AGENT RUNTIME - WA CONNECTED');
console.log('=============================================');

const aiGateway = new AIGateway();
const nce = new NaturalConversationEngine(aiGateway);
const waGateway = new WhatsAppGateway('auth-v5-test');

if (!EventBus.publish) {
    EventBus.publish = (event, payload) => EventBus.emit(event, payload);
}

function shouldQuoteMessage(text, chatId) {
    if (!text) return false;
    if (chatId.endsWith('@g.us')) return true;

    const trimmed = text.trim();
    if (trimmed.length < 8) return false;
    if (/^(oi|halo|hai|p|lah|tes|wkwk|oke|sip|yo|iya|gak|nggak)$/i.test(trimmed)) return false;

    const isQuestion = trimmed.includes('?') || /^(apa|kenapa|gimana|siapa|kapan|dimana|kok|bisa|tau gak|menurutmu|menurut kowe|coba)/i.test(trimmed);
    if (isQuestion) return true;

    if (trimmed.length > 40) return true;

    return false;
}

async function start() {
    JobQueue.init();
    ConversationFSM.init();
    
    OSKernel.start(aiGateway, nce);
    WebCockpit.start(3000);
    
    EventBus.subscribe('whatsapp.message.received', (event) => {
        const data = event.payload || event;
        const { unifiedMsg, rawKey, rawMessage, correlationId, eventId } = data;
        
        JobQueue.enqueue(eventId, correlationId, unifiedMsg.chatId, {
            unifiedMsg, rawKey, rawMessage
        });
        FSMEventBus.emit('message.queued', {});
    });

    QueueWorker.start(async (job) => {
        console.log(`[QueueWorker] Processing job ${job.id} for ${job.chatId}`);
        ConversationFSM.transition(job.chatId, 'THINKING', { 
            payload: job.payload,
            jobId: job.id,
            claimToken: job.claimToken
        });
    });
    
    FSMEventBus.on('state.thinking', async ({ chatId, payload, jobId, claimToken, version }) => {
        try {
            const currentState = ConversationFSM.getState(chatId);
            if (currentState.version !== version) return;
            
            try { await waGateway.sendPresenceUpdate('composing', chatId); } catch(e){}
            
            const responseText = await nce.process(chatId, payload.unifiedMsg.text, {});
            
            if (ConversationFSM.transition(chatId, 'RESPONDING', {}, version)) {
                console.log(`[WA Send] ${chatId}: ${responseText.substring(0, 50)}...`);
                
                const isQuoted = shouldQuoteMessage(payload.unifiedMsg.text, chatId);
                const sendOptions = isQuoted ? { quoted: { key: payload.rawKey, message: payload.rawMessage } } : {};

                await waGateway.sendMessage(chatId, responseText, sendOptions);
                
                // CRITICAL: Complete job immediately!
                if (jobId && claimToken) {
                    JobQueue.complete(jobId, claimToken);
                    console.log(`[JobQueue] ✅ Job ${jobId} marked COMPLETED.`);
                }
                
                ConversationFSM.transition(chatId, 'IDLE');
            }
        } catch(e) {
            console.error(`[Engine Error]`, e);
            if (jobId && claimToken) {
                JobQueue.complete(jobId, claimToken); // Complete on error too to prevent infinite loop!
            }
            ConversationFSM.recover(chatId, 'Engine Crash');
        }
    });

    await waGateway.connect();
    console.log('✅ [V16 Bootloader] Systems Nominal. Engine & WA Online.');
}

process.on('SIGINT', () => {
    console.log('\n[V16 Bootloader] Received SIGINT. Shutting down...');
    QueueWorker.stop();
    OSKernel.stop();
    waGateway.shutdown();
    setTimeout(() => process.exit(0), 1000);
});

start();
