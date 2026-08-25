import dotenv from 'dotenv';
dotenv.config();

// index_v15_QA.mjs — PRODUCTION BOOTLOADER (V14.1 — STRICT OWNER ISOLATION & SILENT FAILURE)
process.on("unhandledRejection", (reason) => { console.error("[FATAL] Unhandled Rejection:", reason); });
process.on("uncaughtException", (error) => { console.error("[FATAL] Uncaught Exception:", error); });

import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { WhatsAppGateway } from './src/gateway/WhatsAppGateway.mjs';
import { EventBus } from './src/event/EventBus.mjs';
import { QueueWorker } from './src/queue/QueueWorker.mjs';
import { JobQueue } from './src/queue/JobQueue.mjs';
import { ConversationFSM, FSMEventBus } from './src/conversation/ConversationFSM.mjs';
import { ChatBurstAggregator } from './src/queue/ChatBurstAggregator.mjs';
import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { WebCockpit } from './src/server/WebCockpit.mjs';
import { OwnerPresenceEngine } from './src/security/copilot/OwnerPresenceEngine.mjs';

const OWNER_LID = '236322690191595@lid';

console.log('=============================================');
console.log('🤖 UNIVERSAL PERSONAL CO-PILOT OS (V14.1)');
console.log('=============================================');

const personalAI = new PersonalAIOS();
const waGateway = new WhatsAppGateway('auth-v5-test');

if (!EventBus.publish) {
    EventBus.publish = (event, payload) => EventBus.emit(event, payload);
}

// Group metadata cache: { groupId -> { subject, cachedAt } }
const groupMetaCache = new Map();
const GROUP_CACHE_TTL_MS = 5 * 60 * 1000;

async function getGroupSubject(chatId) {
    const cached = groupMetaCache.get(chatId);
    if (cached && Date.now() - cached.cachedAt < GROUP_CACHE_TTL_MS) {
        return cached.subject;
    }
    try {
        const meta = await waGateway.sock?.groupMetadata(chatId);
        const subject = meta?.subject || '';
        groupMetaCache.set(chatId, { subject, cachedAt: Date.now() });
        return subject;
    } catch (e) {
        return '';
    }
}

// 1. Initialize Chat Burst Aggregator (2.5s window) -> Feeds into Schema V1 JobQueue
const burstAggregator = new ChatBurstAggregator(2500, (aggregatedJob) => {
    const eventId = aggregatedJob.message?.id || `evt_${Date.now()}`;
    const correlationId = `burst_${aggregatedJob.chatId}_${Date.now()}`;

    const name = aggregatedJob.context?.pushName || aggregatedJob.pushName || 'User';
    const textPreview = (aggregatedJob.message?.text || aggregatedJob.text || '').slice(0, 40) || '[Media]';
    const imgCount = (aggregatedJob.media?.images || aggregatedJob.images || []).length;
    const audioTag = (aggregatedJob.media?.audio || aggregatedJob.audio) ? '🎵' : '';
    console.log(`[BurstAggregator] 📦 Flushed ${aggregatedJob.burstCount} items for ${aggregatedJob.chatId} (${name}): "${textPreview}" [Foto:${imgCount}${audioTag}] (${aggregatedJob.burstDurationMs}ms)`);

    // Enqueue standard Schema V1 payload
    JobQueue.enqueue(eventId, correlationId, aggregatedJob.chatId, aggregatedJob);
    JobQueue.markMessageProcessed(eventId, aggregatedJob.chatId);
    FSMEventBus.emit('message.queued', {});
});

function shouldQuoteMessage(text, chatId, hasAttachment = false) {
    if (hasAttachment) return true;
    if (!text) return false;
    if (chatId.endsWith('@g.us')) return true;

    const trimmed = text.trim();
    if (trimmed.length < 8) return false;
    if (/^(oi|halo|hai|p|lah|tes|wkwk|oke|sip|yo|iya|gak|nggak|ok|thx|thanks)$/i.test(trimmed)) return false;

    const isQuestion = trimmed.includes('?') || /^(apa|kenapa|gimana|siapa|kapan|dimana|kok|bisa|tau gak|menurutmu|menurut kowe|coba)/i.test(trimmed);
    if (isQuestion) return true;
    if (trimmed.length > 40) return true;

    return false;
}

async function start() {
    JobQueue.init();
    ConversationFSM.init();

    WebCockpit.start(3000);

    EventBus.subscribe('whatsapp.message.received', async (event) => {
        const data = event.payload || event;
        const { unifiedMsg, rawKey, rawMessage, eventId } = data;

        const fromMe = Boolean(rawKey?.fromMe);
        const pushName = rawMessage?.pushName || unifiedMsg?.pushName || '';
        const chatId = unifiedMsg?.chatId || rawKey?.remoteJid || '';

        // Extract full incoming text including image/video captions
        const incomingText = (
            unifiedMsg?.text ||
            rawMessage?.conversation ||
            rawMessage?.extendedTextMessage?.text ||
            rawMessage?.imageMessage?.caption ||
            rawMessage?.videoMessage?.caption ||
            rawMessage?.documentMessage?.caption ||
            ''
        ).trim();

        const ownerId = waGateway.sock?.user?.id || '';
        const ownerPhone = ownerId ? ownerId.split(':')[0].split('@')[0] : '';
        
        // STRICT SELF-CHAT: Only true if chatting with Owner's exact LID or Owner's phone
        const isSelfChat = Boolean(
            chatId === OWNER_LID || 
            (ownerPhone && chatId.replace(/\D/g, '').includes(ownerPhone))
        );

        // If the owner typed manually to ANOTHER person -> Record Human Takeover & NEVER let AI reply
        if (fromMe && !isSelfChat) {
            OwnerPresenceEngine.recordOwnerMessage(chatId);
            console.log(`[OwnerPresence] 👤 Owner typed manually to ${chatId}. AI standing down.`);
            return;
        }

        let imageBase64 = null;
        let audioBase64 = null;
        let mimeType = 'text/plain';
        let quotedContext = null;

        // 1. Extract Quoted Message Context (text + image captions)
        const contextInfo = rawMessage?.extendedTextMessage?.contextInfo ||
                            rawMessage?.imageMessage?.contextInfo ||
                            rawMessage?.videoMessage?.contextInfo ||
                            rawMessage?.audioMessage?.contextInfo;
        if (contextInfo?.quotedMessage) {
            const qMsg = contextInfo.quotedMessage;
            const qText = qMsg.conversation ||
                          qMsg.extendedTextMessage?.text ||
                          qMsg.imageMessage?.caption ||
                          qMsg.videoMessage?.caption ||
                          '[Media/Pesan Lain]';
            quotedContext = {
                text: qText,
                sender: contextInfo.participant || contextInfo.remoteJid || 'User'
            };
        }

        // 2. Download Image Media
        try {
            const isImage = Boolean(
                rawMessage?.imageMessage ||
                rawMessage?.viewOnceMessage?.message?.imageMessage ||
                rawMessage?.viewOnceMessageV2?.message?.imageMessage ||
                rawMessage?.viewOnceMessageV2Extension?.message?.imageMessage
            );
            if (isImage && waGateway.sock) {
                const buffer = await downloadMediaMessage(
                    { key: rawKey, message: rawMessage },
                    'buffer', {},
                    { logger: { level: 'silent', child: () => ({ error: ()=>{}, warn: ()=>{}, info: ()=>{}, debug: ()=>{} }) }, reuploadRequest: waGateway.sock.updateMediaMessage }
                );
                if (buffer) {
                    imageBase64 = buffer.toString('base64');
                    mimeType = rawMessage?.imageMessage?.mimetype || 'image/jpeg';
                    console.log(`[WA Vision] 📸 Downloaded image (${(buffer.length/1024).toFixed(1)} KB) from ${chatId}`);
                }
            }
        } catch (e) {
            console.warn('[WA Vision] ⚠️ Could not download image:', e.message);
        }

        // 3. Download Audio / Voice Note
        try {
            const isAudio = Boolean(rawMessage?.audioMessage);
            if (isAudio && waGateway.sock) {
                const buffer = await downloadMediaMessage(
                    { key: rawKey, message: rawMessage },
                    'buffer', {},
                    { logger: { level: 'silent', child: () => ({ error: ()=>{}, warn: ()=>{}, info: ()=>{}, debug: ()=>{} }) }, reuploadRequest: waGateway.sock.updateMediaMessage }
                );
                if (buffer) {
                    audioBase64 = buffer.toString('base64');
                    mimeType = rawMessage?.audioMessage?.mimetype || 'audio/ogg; codecs=opus';
                    console.log(`[WA Audio] 🎵 Downloaded voice note (${(buffer.length/1024).toFixed(1)} KB) from ${chatId}`);
                }
            }
        } catch (e) {
            console.warn('[WA Audio] ⚠️ Could not download audio:', e.message);
        }

        // Push to Chat Burst Aggregator
        burstAggregator.push(chatId, {
            eventId,
            text: incomingText,
            rawKey,
            rawMessage,
            fromMe,
            pushName,
            imageBase64,
            audioBase64,
            mimeType,
            quotedContext,
            ownerJid: waGateway.sock?.user?.id || null
        });
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

            // Resolve Group Subject (cached)
            let groupSubject = '';
            if (chatId.endsWith('@g.us') && waGateway.sock) {
                groupSubject = await getGroupSubject(chatId);
            }

            // Standardized extraction from Schema V1
            const msg = payload.message || payload;
            const media = payload.media || {};
            const ctx = payload.context || {};

            const incomingText = msg.text || payload.text || '';
            const images = media.images || payload.images || [];
            const audio = media.audio || payload.audio || null;
            const quotedContext = msg.quotedContext || payload.quotedContext || null;
            const fromMe = ctx.fromMe ?? payload.fromMe ?? false;
            const pushName = ctx.pushName || payload.pushName || '';
            const rawKey = msg.rawKey || payload.rawKey;
            const rawMessage = msg.rawMessage || payload.rawMessage;
            const ownerJid = ctx.ownerJid || payload.ownerJid || waGateway.sock?.user?.id || null;

            const mediaOptions = {
                images,
                audio,
                quotedContext,
                fromMe,
                pushName,
                groupSubject,
                rawMessage,
                ownerJid
            };

            const deliveryPlan = await personalAI.process(
                chatId,
                incomingText,
                `wa_${jobId}`,
                null,
                mediaOptions
            );

            // If deliveryPlan is null (Silent / Human in control / AI Failure), complete job silently
            if (!deliveryPlan || !deliveryPlan.text && !deliveryPlan.reactionEmoji && deliveryPlan.action !== 'REACT_ONLY') {
                if (jobId && claimToken) JobQueue.complete(jobId, claimToken);
                ConversationFSM.transition(chatId, 'IDLE');
                return;
            }

            if (deliveryPlan && ConversationFSM.transition(chatId, 'RESPONDING', {}, version)) {
                // 1. Send WhatsApp Reaction if planned
                if (deliveryPlan.reactionEmoji && waGateway.sock && rawKey) {
                    try {
                        await waGateway.sock.sendMessage(chatId, {
                            react: { text: deliveryPlan.reactionEmoji, key: rawKey }
                        });
                        console.log(`[HIPE Reaction] ${deliveryPlan.reactionEmoji} → ${chatId}`);
                    } catch (e) {
                        console.warn('[HIPE Reaction] ⚠️ Reaction failed:', e.message);
                    }
                }

                // 2. REACT_ONLY
                if (deliveryPlan.action === 'REACT_ONLY') {
                    if (jobId && claimToken) {
                        JobQueue.complete(jobId, claimToken);
                        console.log(`[JobQueue] ✅ Job ${jobId} (REACT_ONLY) marked COMPLETED.`);
                    }
                    ConversationFSM.transition(chatId, 'IDLE');
                    return;
                }

                // 3. Dispatch Bubbles with Adaptive Typing Delays
                const bubbles = deliveryPlan.bubbles || (deliveryPlan.text ? [deliveryPlan.text] : []);
                const delays = deliveryPlan.typingDelays || [300];

                for (let bIndex = 0; bIndex < bubbles.length; bIndex++) {
                    const bubble = bubbles[bIndex];
                    if (!bubble || !bubble.trim()) continue;
                    
                    const delayMs = delays[bIndex] || 300;

                    try { await waGateway.sendPresenceUpdate('composing', chatId); } catch(e){}
                    if (delayMs > 0) {
                        await new Promise(r => setTimeout(r, Math.min(1200, delayMs)));
                    }

                    const hasAttachment = Boolean(images.length > 0 || audio);
                    const isFirstBubble = bIndex === 0;
                    const isQuoted = isFirstBubble && shouldQuoteMessage(incomingText, chatId, hasAttachment);
                    const sendOptions = isQuoted && rawKey ? { quoted: { key: rawKey, message: rawMessage } } : {};

                    console.log(`[WA Bubble ${bIndex + 1}/${bubbles.length}] → ${chatId}: ${bubble.substring(0, 50)}...`);
                    await waGateway.sendMessage(chatId, bubble, sendOptions);
                }

                if (jobId && claimToken) {
                    JobQueue.complete(jobId, claimToken);
                    console.log(`[JobQueue] ✅ Job ${jobId} marked COMPLETED.`);
                }

                ConversationFSM.transition(chatId, 'IDLE');
            } else {
                if (jobId && claimToken) JobQueue.complete(jobId, claimToken);
                ConversationFSM.transition(chatId, 'IDLE');
            }
        } catch(e) {
            console.error(`[Engine Error]`, e);
            if (jobId && claimToken) JobQueue.complete(jobId, claimToken);
            ConversationFSM.recover(chatId, 'Engine Crash');
        }
    });

    await waGateway.connect();
    console.log('✅ [V14.1 Bootloader] Master Universal Co-Pilot (Strict Isolation) Online.');
}

process.on('SIGINT', () => {
    console.log('\n[V14.1 Bootloader] Received SIGINT. Flushing & Shutting down...');
    burstAggregator.flushAll();
    QueueWorker.stop();
    waGateway.shutdown();
    setTimeout(() => process.exit(0), 1000);
});

start();
