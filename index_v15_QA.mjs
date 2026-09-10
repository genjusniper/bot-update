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
import { OwnerMentionResolver } from './src/security/copilot/OwnerMentionResolver.mjs';
import { NaturalTypoEditor } from './src/behavior/NaturalTypoEditor.mjs';
import { StorageAutoPruner } from './src/maintenance/StorageAutoPruner.mjs';
import { CanonicalMessage } from './src/core/ingress/CanonicalMessage.mjs';
import { PersistFirstIngress } from './src/core/ingress/PersistFirstIngress.mjs';
import { AuthorityManager } from './src/core/control/AuthorityManager.mjs';
import { CommandRouter } from './src/core/control/CommandRouter.mjs';
import { SystemControlPlane } from './src/core/control/SystemControlPlane.mjs';
import { GlobalCommandDetector } from './src/core/control/GlobalCommandDetector.mjs';
import { GlobalControlPlane } from './src/core/control/GlobalControlPlane.mjs';
import { arkaIntegrationHub } from './src/core/orchestration/ARKAIntegrationHub.mjs';
import { GracefulShutdownManager } from './src/core/control/GracefulShutdownManager.mjs';
import { FeatureFlags } from './src/core/control/FeatureFlags.mjs';
import { ExpenseTracker } from './src/core/tools/ExpenseTracker.mjs';
import { ReminderSchedulerLoop } from './src/core/autonomy/ReminderSchedulerLoop.mjs';
import { ImageGeneratorTool } from './src/core/tools/ImageGeneratorTool.mjs';
import { PsychologyLieDetector } from './src/core/tools/PsychologyLieDetector.mjs';
import { SalimCapabilityDiscovery } from './src/core/control/SalimCapabilityDiscovery.mjs';
import { SalimEvolutionEngine } from './src/core/learning/SalimEvolutionEngine.mjs';
import { ContactPolicyEngine } from './src/security/copilot/ContactPolicyEngine.mjs';

const OWNER_LID = '236322690191595@lid';

console.log('=============================================');
console.log('🤖 UNIVERSAL PERSONAL CO-PILOT OS (V15.1 — SALIM OS)');
console.log('=============================================');

// Start automated storage & log pruning (every 6h)
StorageAutoPruner.startCron(6);

const personalAI = new PersonalAIOS();
const waGateway = new WhatsAppGateway('auth-v5-test');

// V15.1: Inject AIGateway adapter into ARKAIntegrationHub
// AIGatewayObservable uses positional args: generate(prompt, contents, corrId, images, quotedCtx)
// ARKAIntegrationHub expects: generate(prompt, { systemPrompt, conversationId, history, images, audio })
// → buat adapter yang translate interface-nya
try {
    if (personalAI.gateway) {
        const arkaGatewayAdapter = {
            generate: async (prompt, opts = {}) => {
                const { systemPrompt, conversationId, history, images, audio } = opts;
                // Build contents array (same format as PersonalAIOS uses)
                const contents = [];
                if (systemPrompt) contents.push({ role: 'system', parts: [{ text: systemPrompt }] });
                if (Array.isArray(history)) {
                    for (const h of history) {
                        if (h.role && h.text) contents.push({ role: h.role, parts: [{ text: h.text }] });
                    }
                }
                // Call AIGatewayObservable with its actual signature
                const res = await personalAI.gateway.generate(
                    prompt,
                    contents,
                    conversationId || 'arka_hub',
                    images || [],
                    null // quotedContext
                );
                // Normalize to ARKAHub expected format: { ok, text, error }
                if (res && res.success) {
                    return { ok: true, text: res.text || '' };
                }
                return { ok: false, text: '', error: res?.error || 'gateway_failed' };
            }
        };
        arkaIntegrationHub.setAIGateway(arkaGatewayAdapter);
        console.log('[V15.1] ✅ ARKAIntegrationHub: AIGatewayAdapter injected (interface adapted)');
    }
} catch (_injectErr) {
    console.warn('[V15.1] ⚠️ AIGateway adapter injection failed (non-fatal):', _injectErr?.message);
}


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
    PersistFirstIngress.markEnqueued(eventId);
    FSMEventBus.emit('message.queued', {});
});

function shouldQuoteMessage(text, chatId, hasAttachment = false) {
    // 1. Only quote if media attachment requires context
    if (hasAttachment) return true;
    // 2. In groups, quote to make it clear who is being replied to
    if (chatId.endsWith('@g.us')) return true;
    // 3. In 1-on-1 private chat, NEVER quote/slide (send clean natural chat bubbles like a human)
    return false;
}

async function start() {
    JobQueue.init();
    ConversationFSM.init();
    PersistFirstIngress.init();

    // Check previous graceful shutdown snapshot
    const prevShutdown = GracefulShutdownManager.checkPreviousShutdown();
    if (prevShutdown) {
        console.log(`[Bootloader] 🔄 Clean recovery verified from: ${prevShutdown.reason} (PID ${prevShutdown.pid})`);
    }

    // Recover unprocessed ingress events if node restarted unexpectedly
    const unprocEvents = PersistFirstIngress.getUnprocessedEvents();
    if (unprocEvents && unprocEvents.length > 0) {
        console.log(`[Bootloader] ♻️ Replaying ${unprocEvents.length} unaggregated events from disk...`);
        for (const ev of unprocEvents) {
            try {
                const canonical = JSON.parse(ev.canonical_payload);
                burstAggregator.push(ev.chat_id, canonical);
                PersistFirstIngress.markEnqueued(ev.event_id);
            } catch (e) {}
        }
    }

    // Register system shutdown signals
    process.on('SIGINT', () => GracefulShutdownManager.shutdown({ reason: 'SIGINT', waGateway }));
    process.on('SIGTERM', () => GracefulShutdownManager.shutdown({ reason: 'SIGTERM', waGateway }));

    WebCockpit.start(3000);
    ReminderSchedulerLoop.start(waGateway);

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

        // 1. Convert to CanonicalMessage & Persist immediately (Persist-First: Zero Data Loss)
        const canonicalMsg = CanonicalMessage.fromBaileys(data, { ownerLid: OWNER_LID, ownerPhone });
        PersistFirstIngress.persist(canonicalMsg);

        // 2. Global Command & Control Plane (Deterministic Operational System Actions)
        const cmdDetect = GlobalCommandDetector.detect(canonicalMsg.text || incomingText);
        if (cmdDetect.isControlCommand) {
            console.log(`[GlobalControlPlane] ⚡ Intercepted command "${cmdDetect.intent}" from ${canonicalMsg.senderId} in ${canonicalMsg.chatId}`);
            const controlResult = await GlobalControlPlane.execute({
                action: cmdDetect.intent,
                args: cmdDetect.args,
                senderId: canonicalMsg.senderId,
                chatId: canonicalMsg.chatId,
                waGateway
            });
            if (controlResult.output && waGateway.sock) {
                try {
                    await waGateway.sendMessage(canonicalMsg.chatId, controlResult.output);
                    console.log(`[GlobalControlPlane] ✅ Dispatched response for "${cmdDetect.intent}" to ${canonicalMsg.chatId}`);
                } catch (e) {
                    console.error('[GlobalControlPlane] ❌ Failed to send command output:', e.message);
                    await waGateway.sock.sendMessage(canonicalMsg.chatId, { text: controlResult.output }).catch(() => {});
                }
            }
            PersistFirstIngress.markCompleted(canonicalMsg.id);
            return;
        }

        // If the owner typed manually to ANOTHER person -> Record Human Takeover & NEVER let AI reply
        if (fromMe && !isSelfChat) {
            OwnerPresenceEngine.recordOwnerMessage(chatId);
            console.log(`[OwnerPresence] 👤 Owner typed manually to ${chatId}. AI standing down.`);
            return;
        }

        // ====================================================
        // SALES PIPELINE ADMIN INTERCEPTOR (/leads, /approve)
        // ====================================================
        const isOwner = Boolean(chatId === OWNER_LID || isSelfChat || chatId.includes('236322690191595'));
        const lcmd = incomingText.toLowerCase();
        if (isOwner && (lcmd.startsWith('/leads') || lcmd.startsWith('/approve') || lcmd.startsWith('/pdf') || lcmd.startsWith('/portfolio') || lcmd.includes('kirim pdf') || lcmd.includes('kirimkan ke waku') || lcmd.includes('minta pdf'))) {
            console.log(`[SalesAdmin] 🎯 Intercepted Admin Command: "${incomingText}" from ${chatId}`);
            try {
                const { SalesIntegrator } = await import('./SalesIntegrator.mjs');
                await SalesIntegrator.handleAdminCommand(waGateway.sock, chatId, incomingText);
            } catch (err) {
                console.error('[SalesAdmin] ❌ Execution Error:', err);
                if (waGateway.sock) {
                    await waGateway.sock.sendMessage(chatId, { text: `❌ Error Sales Admin: ${err.message}` });
                }
            }
            return;
        }

        // ====================================================
        // TITIP CHAT OUTBOUND RELAY (!chat <nama/nomor> <pesan>)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!chat') || lcmd.startsWith('/chat'))) {
            const parts = incomingText.trim().split(/\s+/);
            if (parts.length < 3) {
                await waGateway.sock?.sendMessage(chatId, {
                    text: '⚠️ Format salah. Gunakan:\n`!chat <Nama/Nomor> <Pesan>`\n\nContoh:\n`!chat Hanif Masuk shift apa hari ini?`\n`!chat Cindy Nanti sore ada acara gak?`'
                });
                return;
            }

            const targetQuery = parts[1].toLowerCase();
            const messageToSend = parts.slice(2).join(' ');
            let targetName = parts[1];

            try {
                const fs = await import('fs');
                const path = await import('path');
                const policyPath = path.resolve(process.cwd(), 'config', 'personal_contact_policy.json');
                const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
                const contacts = policy.contacts || {};

                let targetJid = null;

                // 1. If target is pure numbers
                const rawDigits = targetQuery.replace(/\D/g, '');
                if (rawDigits.length >= 9) {
                    let formatted = rawDigits;
                    if (formatted.startsWith('08')) formatted = '628' + formatted.slice(2);
                    targetJid = `${formatted}@s.whatsapp.net`;
                    targetName = formatted;
                } else {
                    // 2. Search in policy contacts by name
                    for (const [jid, cdata] of Object.entries(contacts)) {
                        const cname = (cdata.name || '').toLowerCase();
                        if (cname.includes(targetQuery) || targetQuery.includes(cname)) {
                            targetJid = jid;
                            targetName = cdata.name;
                            break;
                        }
                    }
                }

                if (!targetJid) {
                    await waGateway.sock?.sendMessage(chatId, {
                        text: `❌ Kontak *"${targetQuery}"* tidak ditemukan di daftar VIP.\n\nGunakan nama terdaftar (contoh: Hanif, Cindy, Novita, Ayu, Aziz, Vio, Bunga) atau masukkan nomor HP langsung (contoh: 08123456789).`
                    });
                    return;
                }

                console.log(`[!chat Relay] 📤 Owner dispatching message to ${targetName} (${targetJid}): "${messageToSend}"`);
                await waGateway.sock?.sendMessage(targetJid, { text: messageToSend });

                await waGateway.sock?.sendMessage(chatId, {
                    text: `✅ *PESAN BERHASIL TERKIRIM!*\n` +
                          `👤 *Tujuan:* ${targetName}\n` +
                          `📱 *JID:* \`${targetJid}\`\n` +
                          `💬 *Pesan:*\n"${messageToSend}"`
                });
            } catch (err) {
                console.error('[!chat Relay] ❌ Failed to send:', err);
                await waGateway.sock?.sendMessage(chatId, {
                    text: `❌ Gagal mengirim pesan ke ${targetName}: ${err.message}`
                });
            }
            return;
        }

        // ====================================================
        // CONTACT & GROUP WHITELIST POLICY (WEB COCKPIT & !whitelist)
        // Owner selalu diizinkan, kontak/grup lain harus diizinkan via Checklist/Command
        // ====================================================
        const isGroupMsg = chatId.endsWith('@g.us');
        
        // Record seen so contact or group appears in Web Cockpit checklist
        await ContactPolicyEngine.recordSeen(chatId, pushName, isGroupMsg);

        const isAllowedChat = isOwner || await ContactPolicyEngine.isAllowed(chatId, isGroupMsg);
        if (!isAllowedChat) {
            return; // Drop total pesan jika belum diizinkan oleh Owner
        }

        // ====================================================
        // GROUP MENTION GUARD — Hanya balas jika di-mention / reply ke bot
        // ====================================================
        if (isGroupMsg && !isOwner) {
            const botJid   = waGateway.sock?.user?.id || '';
            const botNumber = botJid.split(':')[0].split('@')[0]; // e.g. "6285600596826"

            // 1. @mention langsung
            const mentionedJids = rawMessage?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const botMentioned  = botNumber && mentionedJids.some(j => j.includes(botNumber));

            // 2. Reply ke pesan bot
            const quotedParticipant = rawMessage?.extendedTextMessage?.contextInfo?.participant || '';
            const repliedToBot = botNumber && quotedParticipant.includes(botNumber);

            // 3. Sebut "salim" di teks
            const textMentionsArka = /\bsalim\b/i.test(incomingText);

            if (!botMentioned && !repliedToBot && !textMentionsArka) {
                // Bukan untuk bot — skip
                return;
            }
        }

        let imageBase64 = null;

        let audioBase64 = null;
        let mimeType = 'text/plain';
        let quotedContext = null;

        // 1. Extract Quoted Message Context (text + image captions)
        const contextInfo = OwnerMentionResolver.extractContextInfo(rawMessage);
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

                    // Transcribe VN automatically via Groq Whisper
                    const groqKey = process.env.GROQ_API_KEY;
                    if (groqKey) {
                        try {
                            const { transcribeAudio } = await import('./src/agent/VoiceTranscriber.mjs');
                            const transcript = await transcribeAudio(buffer, groqKey);
                            if (transcript && !transcript.includes('Gagal')) {
                                incomingText = incomingText 
                                    ? `${incomingText}\n[Pesan Suara / Voice Note]: "${transcript}"`
                                    : `[Pesan Suara / Voice Note]: "${transcript}"`;
                                console.log(`[WA Audio] 📝 Transcribed VN: "${transcript}"`);
                            }
                        } catch (tErr) {
                            console.warn('[WA Audio] ⚠️ Whisper transcribe warning:', tErr.message);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[WA Audio] ⚠️ Could not download audio:', e.message);
        }

        // 4. Download Document Media (PDF, TXT, DOCX, CSV)
        let docBase64 = null;
        let docFileName = '';
        try {
            const isDoc = Boolean(rawMessage?.documentMessage);
            if (isDoc && waGateway.sock) {
                docFileName = rawMessage.documentMessage.fileName || 'document.pdf';
                const buffer = await downloadMediaMessage(
                    { key: rawKey, message: rawMessage },
                    'buffer', {},
                    { logger: { level: 'silent', child: () => ({ error: ()=>{}, warn: ()=>{}, info: ()=>{}, debug: ()=>{} }) }, reuploadRequest: waGateway.sock.updateMediaMessage }
                );
                if (buffer) {
                    docBase64 = buffer.toString('base64');
                    mimeType = rawMessage.documentMessage.mimetype || 'application/pdf';
                    console.log(`[WA Doc] 📄 Downloaded document "${docFileName}" (${(buffer.length/1024).toFixed(1)} KB) from ${chatId}`);

                    if (docFileName.endsWith('.txt') || docFileName.endsWith('.csv') || docFileName.endsWith('.json') || docFileName.endsWith('.md')) {
                        const snippet = buffer.toString('utf8').slice(0, 4000);
                        incomingText = incomingText ? `${incomingText}\n[Isi Dokumen "${docFileName}"]:\n${snippet}` : `[Isi Dokumen "${docFileName}"]:\n${snippet}`;
                    } else {
                        incomingText = incomingText ? `${incomingText}\n[Lampiran Dokumen]: "${docFileName}"` : `[Lampiran Dokumen]: "${docFileName}" (Tolong baca dan buatkan ringkasan isi dokumen ini)`;
                    }
                }
            }
        } catch (e) {
            console.warn('[WA Doc] ⚠️ Could not download document:', e.message);
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
            docBase64,
            docFileName,
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
            const isGroup = chatId.endsWith('@g.us');
            let groupSubject = '';
            if (isGroup && waGateway.sock) {
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
            const ownerPhone = ownerJid ? ownerJid.split(':')[0].split('@')[0] : '';
            const isSelfChat = Boolean(
                chatId === OWNER_LID || 
                (ownerPhone && chatId.replace(/\D/g, '').includes(ownerPhone))
            );
            const isOwner = Boolean(chatId === OWNER_LID || isSelfChat || chatId.includes('236322690191595'));

            const mediaOptions = {
                images,
                audio,
                quotedContext,
                fromMe,
                pushName,
                groupSubject,
                rawMessage,
                ownerJid,
                isOwner,
                isSelfChat
            };

            // Record contact or group so it appears in the Web Cockpit checklist
            await ContactPolicyEngine.recordSeen(chatId, pushName || groupSubject, isGroup);

            // ── FAST INTERCEPTOR: Owner Whitelist & Permission Control (!whitelist, !izinkan, !mute) ──
            let deliveryPlan = null;
            if (isOwner) {
                const cmdRes = await ContactPolicyEngine.handleOwnerCommand(incomingText, chatId, isGroup, groupSubject);
                if (cmdRes.handled) {
                    deliveryPlan = {
                        text: cmdRes.response,
                        bubbles: [cmdRes.response],
                        typingDelays: [800],
                        reactionEmoji: '🛡️',
                        action: 'REPLY'
                    };
                }
            }

            // DYNAMIC WHITELIST GATE: Only Owner and Checked Contacts/Groups are processed
            const isAllowed = isOwner || await ContactPolicyEngine.isAllowed(chatId, isGroup);
            if (!isAllowed) {
                console.log(`[ContactPolicy] 🛡️ Ignored thinking execution for ${chatId} (Not in Whitelist).`);
                ConversationFSM.transition(chatId, 'IDLE');
                return;
            }

            // ── FAST INTERCEPTOR: Smart Natural Reminder (Owner Only) ──
            if (!deliveryPlan && isOwner) {
                const reminderRes = ReminderSchedulerLoop.parseAndSchedule(incomingText, chatId);
                if (reminderRes.handled && reminderRes.response) {
                    deliveryPlan = {
                        text: reminderRes.response,
                        bubbles: [reminderRes.response],
                        typingDelays: [800],
                        reactionEmoji: '⏰',
                        action: 'REPLY'
                    };
                }
            }

            // ── FAST INTERCEPTOR: Daily Expense Tracker (Owner Only) ──
            if (!deliveryPlan && isOwner) {
                const expenseRes = ExpenseTracker.processText(incomingText, chatId);
                if (expenseRes.handled && expenseRes.response) {
                    deliveryPlan = {
                        text: expenseRes.response,
                        bubbles: [expenseRes.response],
                        typingDelays: [800],
                        reactionEmoji: '💰',
                        action: 'REPLY'
                    };
                }
            }

            // ── FAST INTERCEPTOR: AI Image Generation (FLUX 4K) (Owner Only) ──
            if (!deliveryPlan && isOwner && ImageGeneratorTool.isImageRequest(incomingText)) {
                const prompt = ImageGeneratorTool.extractPrompt(incomingText);
                if (prompt && waGateway.sock) {
                    await waGateway.sock.sendMessage(chatId, { text: `🎨 Sedang membuat gambar AI untuk: "${prompt}"... (tunggu sebentar ya Gus)` }).catch(() => {});
                    const genRes = await ImageGeneratorTool.generate(prompt);
                    if (genRes.success && genRes.buffer) {
                        await waGateway.sock.sendMessage(chatId, {
                            image: genRes.buffer,
                            caption: `✨ *AI Image Generated (FLUX Engine)*\n📌 *Prompt:* "${prompt}"`
                        });
                        if (jobId && claimToken) JobQueue.complete(jobId, claimToken);
                        ConversationFSM.transition(chatId, 'IDLE');
                        return;
                    } else {
                        deliveryPlan = {
                            text: '⚠️ Maaf Gus, gagal membuat gambar: ' + (genRes.error || 'Server sibuk'),
                            bubbles: ['⚠️ Maaf Gus, gagal membuat gambar: ' + (genRes.error || 'Server sibuk')],
                            action: 'REPLY'
                        };
                    }
                }
            }

            // ── FAST INTERCEPTOR: Psychology & Lie Detector (Owner Only) ──
            if (!deliveryPlan && isOwner && PsychologyLieDetector.isAnalysisRequest(incomingText, quotedContext)) {
                const targetText = quotedContext?.text || incomingText.replace(/^(?:salim\s+)?(?:tolong\s+)?(?:analisis|cek kebohongan|deteksi emosi)\s*(?:chat|pesan)?\s*(?:ini|itu)?\s*:?\s*/i, '').trim();
                if (targetText && personalAI.gateway) {
                    const prompt = PsychologyLieDetector.buildAnalysisPrompt(targetText);
                    const aiRes = await personalAI.gateway.generate(prompt, [], 'psychology_analysis');
                    if (aiRes && aiRes.success && aiRes.text) {
                        deliveryPlan = {
                            text: aiRes.text,
                            bubbles: [aiRes.text],
                            typingDelays: [1200],
                            reactionEmoji: '🕵️‍♂️',
                            action: 'REPLY'
                        };
                    }
                }
            }

            // ── FAST INTERCEPTOR: Capability Discovery (Self-Awareness) (Owner Only) ──
            if (!deliveryPlan && isOwner && SalimCapabilityDiscovery.isDiscoveryQuery(incomingText)) {
                const card = SalimCapabilityDiscovery.getMasterCapabilityCard();
                deliveryPlan = {
                    text: card,
                    bubbles: [card],
                    typingDelays: [800],
                    reactionEmoji: '🧠',
                    action: 'REPLY'
                };
            }

            // ── FAST INTERCEPTOR: Self-Introspection & Evolution Report (Owner Only) ──
            if (!deliveryPlan && isOwner && SalimEvolutionEngine.isIntrospectionQuery(incomingText)) {
                const report = SalimEvolutionEngine.formatIntrospectionReport();
                deliveryPlan = {
                    text: report,
                    bubbles: [report],
                    typingDelays: [800],
                    reactionEmoji: '🪞',
                    action: 'REPLY'
                };
            }

            // ── FAST INTERCEPTOR: Auto-Feedback & Lesson Learning (Owner Only) ──
            if (!deliveryPlan && isOwner) {
                const fbRes = SalimEvolutionEngine.processFeedback(incomingText, chatId);
                if (fbRes.handled && fbRes.response) {
                    deliveryPlan = {
                        text: fbRes.response,
                        bubbles: [fbRes.response],
                        typingDelays: [800],
                        reactionEmoji: '🧬',
                        action: 'REPLY'
                    };
                }
            }



            // ── PRIMARY PIPELINE: Full 30-Stage PersonalAIOS Master Brain ──
            if (!deliveryPlan) {
                try {
                    deliveryPlan = await personalAI.process(
                        chatId,
                        incomingText,
                        `wa_${jobId}`,
                        null,
                        mediaOptions
                    );
                    if (deliveryPlan) {
                        console.log(`[PersonalAIOS] 🧠 Master Brain generated deliveryPlan for ${chatId} (Bubbles: ${deliveryPlan.bubbles?.length || 0})`);
                    }
                } catch (pErr) {
                    console.warn('[PersonalAIOS] ⚠️ Primary pipeline error, falling back to SalimHub:', pErr.message);
                }
            }


            // ── Secondary Fallback: SalimHub ──
            if (!deliveryPlan && incomingText) {
                try {
                    const hubRes = await arkaIntegrationHub.processIncomingMessage({
                        text: incomingText,
                        senderJid: chatId,
                        senderName: pushName || '',
                        chatId,
                        isGroup: chatId.endsWith('@g.us'),
                        isOwner: isOwner,
                        userTier: isOwner ? 'OWNER' : (chatId.endsWith('@g.us') ? 'GROUP' : 'NORMAL'),
                        systemPrompt: chatId === OWNER_LID || isSelfChat
                            ? `Kamu adalah Personal Co-Pilot & Asisten AI pribadi cerdas milik Bos (Agus Salim / Agus / Gus). Bantu Bos dengan sigap, santai, dan cerdas. Jawab singkat, padat, Jaksel casual.`
                            : `IDENTITAS MUTLAK: Kamu adalah AGUS (panggilan akrab: Agus / Mas Agus). Kamu adalah pemilik asli nomor WhatsApp ini.
- Bicaralah selalu sebagai AGUS (orang pertama: aku / gue), BUKAN asisten, BUKAN bot, BUKAN AI.
- JANGAN PERNAH menyebut kata 'bot', 'AI', 'asisten', atau 'sistem'. Kalau ada yang tanya, tolak santai.
- Karakter: santai, deadpan, cool, tidak lebay. Adaptasi gaya lawan bicara.
- Dengan teman cowok: bahasa Jawa Semarangan santai (lha piye to, santai wae, rasah neko-neko).
- Dengan cewek: bahasa Indonesia santai, ramah, wajar.
- Format: SUPER SINGKAT (3-10 kata/kalimat). Tanpa tanda seru atau titik di akhir. Multi-bubble pakai newline.
- DILARANG kata kotor. DILARANG lebay/sok asik. Maksimal 1x tawa (wkwk) jika relevan.`,
                        history: [],
                        images: images || [],
                        audio: audio || null,
                        quotedContext,
                        waGateway,
                        metadata: { jobId, ownerJid }
                    });

                    if (hubRes && hubRes.handled && hubRes.bubbles?.length > 0) {
                        deliveryPlan = {
                            text: hubRes.finalText || hubRes.response || '',
                            bubbles: hubRes.bubbles || [],
                            typingDelays: hubRes.bubbles?.map(() => Math.max(1000, Math.min(5000, hubRes.typingDelayMs || 1500))) || [1500],
                            reactionEmoji: hubRes.reaction || null,
                            action: null
                        };
                        console.log(`[SalimHub] ⚡ Handled Stage ${hubRes.stage} (${hubRes.status}) for ${chatId}`);
                    }
                } catch (_hErr) {
                    console.warn('[SalimHub] ⚠️ Fallback error:', _hErr.message);
                }
            }


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
                    
                    const delayMs = delays[bIndex] || 1500;

                    try { await waGateway.sendPresenceUpdate('composing', chatId); } catch(e){}
                    if (delayMs > 0) {
                        await new Promise(r => setTimeout(r, Math.min(5000, Math.max(1000, delayMs))));
                    }

                    const hasAttachment = Boolean(images.length > 0 || audio);
                    const isFirstBubble = bIndex === 0;
                    const isQuoted = isFirstBubble && shouldQuoteMessage(incomingText, chatId, hasAttachment);
                    const sendOptions = isQuoted && rawKey ? { quoted: { key: rawKey, message: rawMessage } } : {};

                    console.log(`[WA Bubble ${bIndex + 1}/${bubbles.length}] → ${chatId}: ${bubble.substring(0, 50)}...`);

                    if (NaturalTypoEditor.shouldIntroduceTypo(bubble) && waGateway.sock) {
                        const { typoText, cleanText, isTypo } = NaturalTypoEditor.generateTypo(bubble);
                        if (isTypo) {
                            console.log(`[NaturalTypo] ✏️ Sending typo first: "${typoText.slice(0, 40)}..."`);
                            const sentMsg = await waGateway.sendMessage(chatId, typoText, sendOptions);
                            if (sentMsg?.key) {
                                await new Promise(r => setTimeout(r, 1400 + Math.random() * 800));
                                await waGateway.sock.sendMessage(chatId, { text: cleanText, edit: sentMsg.key });
                                console.log(`[NaturalTypo] ✅ Auto-edited message on WhatsApp to clean text!`);
                            }
                        } else {
                            await waGateway.sendMessage(chatId, bubble, sendOptions);
                        }
                    } else {
                        await waGateway.sendMessage(chatId, bubble, sendOptions);
                    }
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

    // Auto-dispatch Portfolio PDF to owner on startup
    setTimeout(async () => {
        try {
            const fs = await import('fs');
            const pdfPath = './Agus_Salim_AI_Automation_Portfolio.pdf';
            if (fs.existsSync(pdfPath) && waGateway.sock) {
                console.log('[Portfolio] 🚀 Dispatching Portfolio PDF to Owner...');
                await waGateway.sock.sendMessage(OWNER_LID, {
                    document: fs.readFileSync(pdfPath),
                    mimetype: 'application/pdf',
                    fileName: 'Agus_Salim_AI_Automation_Portfolio.pdf',
                    caption: '📄 *Portofolio Profesional AI Automation & Agentic Systems*\n👤 *Agus Salim*\n\nBerikut dokumen portofolio resmi Anda, siap dilampirkan untuk melamar kerja remote & freelance internasional!'
                });
                console.log('[Portfolio] ✅ Portfolio PDF successfully sent to Owner WhatsApp!');
            }
        } catch (err) {
            console.warn('[Portfolio] Could not auto-send PDF:', err.message);
        }
    }, 4000);
}

process.on('SIGINT', () => {
    console.log('\n[V14.1 Bootloader] Received SIGINT. Flushing & Shutting down...');
    burstAggregator.flushAll();
    QueueWorker.stop();
    waGateway.shutdown();
    setTimeout(() => process.exit(0), 1000);
});

start();
