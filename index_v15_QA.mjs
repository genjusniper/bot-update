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
import { PersonalLifeGraphEngine } from './src/cognitive/PersonalLifeGraphEngine.mjs';
import { SituationAwarenessEngine } from './src/cognitive/SituationAwarenessEngine.mjs';
import { PatternWatcherAndStopMeEngine } from './src/cognitive/PatternWatcherAndStopMeEngine.mjs';
import { MissionDAGTracker } from './src/cognitive/MissionDAGTracker.mjs';
import { VoiceSynthesizer } from './src/multimodal/VoiceSynthesizer.mjs';
import { NaturalReminderEngine } from './src/os/reminders/NaturalReminderEngine.mjs';
import { ShiftWorkTracker } from './src/os/shift/ShiftWorkTracker.mjs';
import { GroupChatSummarizer } from './src/os/intel/GroupChatSummarizer.mjs';
import { DailyLifeBriefing } from './src/os/briefing/DailyLifeBriefing.mjs';
import { WisdomSparringEngine } from './src/os/growth/WisdomSparringEngine.mjs';
import { MountainCopilot } from './src/os/outdoor/MountainCopilot.mjs';
import { SmartBudgetGuard } from './src/os/finance/SmartBudgetGuard.mjs';
import { TermuxDeviceBridge } from './src/os/device/TermuxDeviceBridge.mjs';
import { LiveWebSearch } from './src/os/search/LiveWebSearch.mjs';
import { AggressiveAlarmEngine } from './src/os/reminders/AggressiveAlarmEngine.mjs';
import { AntiScamGuard } from './src/security/AntiScamGuard.mjs';
import { PeopleMemoryCRM } from './src/os/crm/PeopleMemoryCRM.mjs';
import { ReceiptScannerOCR } from './src/os/finance/ReceiptScannerOCR.mjs';
import { TwoWayVoiceDirector } from './src/os/voice/TwoWayVoiceDirector.mjs';
import { HabitTrackerEngine } from './src/os/habits/HabitTrackerEngine.mjs';
import { PersonalJournalEngine } from './src/os/journal/PersonalJournalEngine.mjs';
import { SplitBillCalculator } from './src/os/finance/SplitBillCalculator.mjs';
import { EmailSentinelEngine } from './src/os/bridges/EmailSentinelEngine.mjs';
import { SteamRadarEngine } from './src/os/bridges/SteamRadarEngine.mjs';
import { CourierTrackerEngine } from './src/os/bridges/CourierTrackerEngine.mjs';
import { TelegramMirrorGateway } from './src/os/bridges/TelegramMirrorGateway.mjs';
import { DeviceHardwareSentinel } from './src/os/utility/DeviceHardwareSentinel.mjs';
import { UniversalMediaDownloader } from './src/os/utility/UniversalMediaDownloader.mjs';
import { WeatherOutdoorRadar } from './src/os/utility/WeatherOutdoorRadar.mjs';
import { TenantContextIsolation } from './src/platform/tenant/TenantContextIsolation.mjs';
import { ActionPermissionEngine } from './src/platform/policy/ActionPermissionEngine.mjs';
import { DecisionAuditTrail } from './src/platform/audit/DecisionAuditTrail.mjs';
import { UsageMeteringBilling } from './src/platform/billing/UsageMeteringBilling.mjs';
import { UniversalRequestEngine } from './src/platform/core/UniversalRequestEngine.mjs';
import { ConversationOpportunityDetector } from './src/os/growth/ConversationOpportunityDetector.mjs';
import { DontChaseEngine } from './src/os/growth/DontChaseEngine.mjs';
import { HumanHandoffEngine } from './src/os/growth/HumanHandoffEngine.mjs';
import { CollaborationDetector } from './src/os/growth/CollaborationDetector.mjs';
import { ObjectionHandler } from './src/os/growth/ObjectionHandler.mjs';
import { CustomSolutionEngine } from './src/os/growth/CustomSolutionEngine.mjs';
import { LeadQualificationEngine } from './src/os/growth/LeadQualificationEngine.mjs';
import { PromptInjectionFirewall } from './src/security/PromptInjectionFirewall.mjs';
import { AgentPermissionFirewall } from './src/security/AgentPermissionFirewall.mjs';
import { ConversationIntelligenceEngine } from './src/os/intelligence/ConversationIntelligenceEngine.mjs';
import { NextBestActionEngine } from './src/os/intelligence/NextBestActionEngine.mjs';
import { TruthEvidenceEngine } from './src/os/truth/TruthEvidenceEngine.mjs';
import { ConversationEvaluationEngine } from './src/os/evaluation/ConversationEvaluationEngine.mjs';
import { ConversationMemoryGraph } from './src/memory/ConversationMemoryGraph.mjs';
import { ConversionIntelligenceEngine } from './src/os/conversion/ConversionIntelligenceEngine.mjs';
import { LeadDNAEngine } from './src/os/conversion/LeadDNAEngine.mjs';
import { AIObservabilityEngine } from './src/os/observability/AIObservabilityEngine.mjs';
import { CostIntelligenceEngine } from './src/os/cost/CostIntelligenceEngine.mjs';
import { PersonalizationEngine } from './src/os/personalization/PersonalizationEngine.mjs';
import { NaturalConversationEngine } from './src/os/natural/NaturalConversationEngine.mjs';
import { PersonalityGovernor } from './src/os/personality/PersonalityGovernor.mjs';
import { LearningLoopEngine } from './src/os/learning/LearningLoopEngine.mjs';
import { BusinessOperatingSystemOrchestrator } from './src/os/core/BusinessOperatingSystemOrchestrator.mjs';

const OWNER_LID = '236322690191595@lid';

// Global Business OS Singletons
const globalMemoryGraph = new ConversationMemoryGraph();
const globalConversionIntelligence = new ConversionIntelligenceEngine();
const globalObservability = new AIObservabilityEngine();
const globalCostIntelligence = new CostIntelligenceEngine();
const globalLearningLoop = new LearningLoopEngine();
const businessOS = new BusinessOperatingSystemOrchestrator();

console.log('=============================================');
console.log('🤖 UNIVERSAL PERSONAL CO-PILOT OS (V16.0 — COGNITIVE SALIM)');
console.log('=============================================');

// Initialize Cognitive & Situational Engines
PersonalLifeGraphEngine.init();
PatternWatcherAndStopMeEngine.init();
MissionDAGTracker.init();

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

    EventBus.subscribe('whatsapp.connected', async () => {
        try {
            if (waGateway.sock?.groupFetchAllParticipating) {
                console.log('[ContactPolicy] 🔄 Syncing all participating WhatsApp groups...');
                const groups = await waGateway.sock.groupFetchAllParticipating();
                let syncCount = 0;
                for (const [gid, gdata] of Object.entries(groups)) {
                    const subject = gdata.subject || 'Grup WhatsApp';
                    await ContactPolicyEngine.recordSeen(gid, subject, true);
                    syncCount++;
                }
                console.log(`[ContactPolicy] ✅ Synced ${syncCount} WhatsApp groups into policy!`);
            }
        } catch (e) {
            console.warn('[ContactPolicy] ⚠️ Group sync warning:', e.message);
        }
    });

    EventBus.subscribe('whatsapp.message.received', async (event) => {
        const data = event.payload || event;
        const { unifiedMsg, rawKey, rawMessage, eventId } = data;

        const fromMe = Boolean(rawKey?.fromMe);
        const pushName = rawMessage?.pushName || unifiedMsg?.pushName || '';
        const chatId = unifiedMsg?.chatId || rawKey?.remoteJid || '';

        // Extract full incoming text including image/video captions
        let incomingText = (
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

        // 1.5. Anti-Scam & Malware APK Shield (Auto scan documents & phishing lures)
        try {
            const scamCheck = AntiScamGuard.inspect({ message: rawMessage }, canonicalMsg.senderId, chatId, incomingText);
            if (scamCheck.isScam) {
                console.warn(`[AntiScamGuard] 🚨 Detected ${scamCheck.threatType} (${scamCheck.modus}) from ${canonicalMsg.senderId} in ${chatId}`);
                if (waGateway.sock) {
                    await waGateway.sock.sendMessage(chatId, { text: scamCheck.warningText }).catch(() => {});
                    if (chatId.endsWith('@g.us')) {
                        await waGateway.sock.sendMessage(OWNER_LID, {
                            text: `🚨 *SECURITY DISPATCH: POTENSI MALWARE DI GRUP!*\n━━━━━━━━━━━━━━━━━━\n👥 *Grup:* \`${chatId}\`\n👤 *Pengirim:* \`${canonicalMsg.senderId}\`\n🎯 *Modus:* *${scamCheck.modus}*\n📁 *File:* \`${scamCheck.fileName || '-'}\`\n━━━━━━━━━━━━━━━━━━\n_Peringatan keamanan telah dikirim ke grup._`
                        }).catch(() => {});
                    }
                }
            }
        } catch (scamErr) {
            console.warn('[AntiScamGuard] ⚠️ Scan error:', scamErr.message);
        }

        // 1.6. Stop Password Interceptor for Aggressive Alarm
        try {
            const stopAlarm = AggressiveAlarmEngine.checkStopPassword(incomingText, chatId);
            if (stopAlarm) {
                console.log(`[AggressiveAlarm] 🔕 Alarm stopped by ${canonicalMsg.senderId}`);
                if (waGateway.sock) {
                    await waGateway.sock.sendMessage(chatId, { text: stopAlarm.message }).catch(() => {});
                    if (stopAlarm.wasFiring) {
                        try {
                            const cheerBuf = await VoiceSynthesizer.synthesizeVoiceNote("Mantap Bos Agus Salim, alarm sudah dimatikan total. Segera cuci muka dulu biar segar dan melek ya! Semangat menjalani hari!");
                            if (cheerBuf) {
                                await waGateway.sock.sendMessage(chatId, {
                                    audio: cheerBuf,
                                    mimetype: 'audio/mp4',
                                    ptt: true
                                });
                            }
                        } catch (vnErr) {}
                    }
                }
                PersistFirstIngress.markCompleted(canonicalMsg.id);
                return;
            }
        } catch (alarmErr) {
            console.warn('[AggressiveAlarm] ⚠️ Stop check error:', alarmErr.message);
        }

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

        // If the owner typed manually to ANOTHER person/group -> Record Human Takeover UNLESS explicitly summoning bot
        if (fromMe && !isSelfChat) {
            const isExplicitBotCall = /^(?:!ai|!tanya|\/ai|\/tanya)\b/i.test(incomingText) || /\b(salim|arka)\b/i.test(incomingText);
            if (!isExplicitBotCall) {
                OwnerPresenceEngine.recordOwnerMessage(chatId);
                console.log(`[OwnerPresence] 👤 Owner typed manually to ${chatId}. AI standing down.`);
                return;
            }
            console.log(`[OwnerPresence] 👑 Owner explicitly summoned bot in ${chatId}: "${incomingText.slice(0, 40)}"`);
        }

        // ====================================================
        // SALES PIPELINE ADMIN INTERCEPTOR (/leads, /approve)
        // ====================================================
        const isOwner = Boolean(chatId === OWNER_LID || isSelfChat || chatId.includes('236322690191595'));
        const lcmd = incomingText.toLowerCase();
        if (isOwner && (
            lcmd.startsWith('/leads') || lcmd.startsWith('!leads') || lcmd.startsWith('!caripelanggan') || lcmd.startsWith('cari pelanggan') ||
            lcmd.startsWith('/approve') || lcmd.startsWith('!approve') ||
            lcmd.startsWith('/pdf') || lcmd.startsWith('/portfolio') || lcmd.includes('kirim pdf') || lcmd.includes('kirimkan ke waku') || lcmd.includes('minta pdf')
        )) {
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
        // VOICE SYNTHESIS DIRECT COMMAND (!vn <teks>)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!vn ') || lcmd.startsWith('/vn '))) {
            const textToSpeak = incomingText.replace(/^[!/](?:vn)\s+/i, '').trim();
            if (textToSpeak && waGateway.sock) {
                try {
                    const audioBuffer = await VoiceSynthesizer.synthesize(textToSpeak, 'id');
                    await waGateway.sock.sendMessage(chatId, {
                        audio: audioBuffer,
                        mimetype: 'audio/mp4',
                        ptt: true
                    });
                    console.log(`[WA Voice] 🎙️ Sent Voice Note to ${chatId} (${(audioBuffer.length/1024).toFixed(1)} KB)`);
                } catch (vErr) {
                    console.error('[WA Voice] ❌ Failed to synthesize voice note:', vErr.message);
                    await waGateway.sock.sendMessage(chatId, { text: `❌ Gagal membuat pesan suara: ${vErr.message}` });
                }
            }
            return;
        }

        // ====================================================
        // NATURAL LANGUAGE REMINDER & ALARM ENGINE
        // (!ingatkan, "ingatkan aku...", !jadwal, !hapusjadwal)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!jadwal') || lcmd.startsWith('!reminders') || lcmd.startsWith('/jadwal'))) {
            const activeList = NaturalReminderEngine.listActiveReminders(chatId);
            if (!activeList || activeList.length === 0) {
                await waGateway.sock?.sendMessage(chatId, {
                    text: '📅 *DAFTAR PENGINGAT AKTIF*\n━━━━━━━━━━━━━━━━━━\nBelum ada jadwal pengingat yang aktif saat ini.\n\n_Contoh membuat pengingat baru:_\n`ingatkan aku 10 menit lagi angkat jemuran`\n`ingatkan jam 15:30 nelpon Hanif`\n`ingatkan besok jam 04:30 bangun pagi`'
                });
            } else {
                let msg = `📅 *DAFTAR PENGINGAT AKTIF (${activeList.length})*\n━━━━━━━━━━━━━━━━━━\n`;
                for (const item of activeList) {
                    const timeStr = new Date(item.target_timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit', minute: '2-digit', hour12: false
                    }) + ' WIB';
                    const dateStr = new Date(item.target_timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short'
                    });
                    msg += `🔹 *[#${item.id}]* ${item.reminder_text}\n   ⏰ ${dateStr} • ${timeStr}\n\n`;
                }
                msg += `_Ketik \`!hapusjadwal <ID>\` untuk membatalkan pengingat._`;
                await waGateway.sock?.sendMessage(chatId, { text: msg });
            }
            return;
        }

        if (isOwner && (lcmd.startsWith('!hapusjadwal ') || lcmd.startsWith('!cancelreminder '))) {
            const targetId = parseInt(incomingText.replace(/^[!/](?:hapusjadwal|cancelreminder)\s+/i, '').trim(), 10);
            if (!targetId) {
                await waGateway.sock?.sendMessage(chatId, { text: '⚠️ Gunakan format: `!hapusjadwal <ID>` (contoh: `!hapusjadwal 1`)' });
                return;
            }
            const ok = NaturalReminderEngine.cancelReminder(targetId, chatId);
            if (ok) {
                await waGateway.sock?.sendMessage(chatId, { text: `✅ Berhasil membatalkan pengingat *#${targetId}*.` });
            } else {
                await waGateway.sock?.sendMessage(chatId, { text: `❌ Pengingat *#${targetId}* tidak ditemukan atau sudah selesai.` });
            }
            return;
        }

        const reminderParsed = isOwner ? NaturalReminderEngine.parseNaturalReminder(incomingText) : null;
        if (reminderParsed) {
            const newReminder = NaturalReminderEngine.addReminder({
                chatId,
                senderId: canonicalMsg.senderId,
                text: reminderParsed.text,
                targetTimestamp: reminderParsed.targetTimestamp
            });
            const confirmMsg = 
                `✅ *PENGINGAT BERHASIL DIJADWALKAN!*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📌 *Agenda:* ${reminderParsed.text}\n` +
                `🕒 *Waktu:* ${reminderParsed.formattedTime}\n` +
                `🆔 *ID Jadwal:* #${newReminder.id}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `_Salim OS akan mengirim notifikasi & pesan suara tepat waktu!_`;
            
            await waGateway.sock?.sendMessage(chatId, { text: confirmMsg });
            console.log(`[ReminderEngine] 📌 Scheduled reminder #${newReminder.id} for ${chatId}: "${reminderParsed.text}" at ${reminderParsed.formattedTime}`);
            return;
        }

        // ====================================================
        // PROACTIVE DAILY BRIEFING & RECAP (!briefing, !pagi, !recap, !malam)
        // ====================================================
        if (isOwner && (lcmd === '!briefing' || lcmd === '!pagi' || lcmd === '/briefing')) {
            await DailyLifeBriefing.dispatchMorningBriefing(chatId);
            return;
        }

        if (isOwner && (lcmd === '!recap' || lcmd === '!malam' || lcmd === '/recap')) {
            await DailyLifeBriefing.dispatchNightRecap(chatId);
            return;
        }

        // ====================================================
        // SHIFT WORK & TUKAR SHIFT TRACKER
        // (!shift, "besok shift apa", "besok aku shift pagi", "tukar shift sama...")
        // ====================================================
        const shiftParsed = isOwner ? ShiftWorkTracker.parseNaturalShiftInput(incomingText) : null;
        if (shiftParsed) {
            if (shiftParsed.action === 'QUERY') {
                const scheduleMsg = ShiftWorkTracker.formatScheduleMessage(7);
                await waGateway.sock?.sendMessage(chatId, { text: scheduleMsg });
                return;
            } else if (shiftParsed.action === 'SET') {
                const resp = `✅ *JADWAL SHIFT BERHASIL DICATAT!*\n` +
                             `━━━━━━━━━━━━━━━━━━\n` +
                             `📅 *Hari:* ${shiftParsed.targetDay} (${shiftParsed.dateStr})\n` +
                             `💼 *Shift:* *${shiftParsed.shiftType}*` +
                             (shiftParsed.swappedWith ? ` _(Tukar dg ${shiftParsed.swappedWith})_` : '') + `\n` +
                             `━━━━━━━━━━━━━━━━━━\n` +
                             `_Salim OS akan menyesuaikan briefing & alarm bangun tidur otomatis._`;
                await waGateway.sock?.sendMessage(chatId, { text: resp });
                return;
            } else if (shiftParsed.action === 'BATCH_SET') {
                await waGateway.sock?.sendMessage(chatId, { text: `✅ Berhasil mencatat *${shiftParsed.count} jadwal shift* mingguan Bos Agus!` });
                return;
            }
        }

        // ====================================================
        // GROUP CHAT INTEL & SUMMARIZER
        // (!rangkum <nama grup>, "rangkum grup...")
        // ====================================================
        if (isOwner && (lcmd.startsWith('!rangkum ') || lcmd.startsWith('/rangkum ') || lcmd.startsWith('rangkum grup '))) {
            const groupQuery = incomingText.replace(/^(?:[!/]?rangkum\s+(?:grup\s+)?)/i, '').trim();
            if (!groupQuery) {
                await waGateway.sock?.sendMessage(chatId, { text: '⚠️ Format: `!rangkum <nama/id grup>`\n\nContoh:\n`!rangkum PELETBENTO`\n`!rangkum GeForteX`' });
                return;
            }
            await waGateway.sock?.sendMessage(chatId, { text: `🔍 Sedang memindai obrolan grup *"${groupQuery}"* dan menyusun ringkasan intelijen... (tunggu sebentar ya Bos)` }).catch(()=>{});
            const summary = await GroupChatSummarizer.summarize({ queryOrChatId: groupQuery, waGateway, hoursAgo: 8, maxMessages: 80 });
            await waGateway.sock?.sendMessage(chatId, { text: summary });
            return;
        }

        // ====================================================
        // WISDOM & DEEP TALK SPARRING (!curhat, !evaluasi)
        // ====================================================
        if (isOwner && (lcmd === '!curhat' || lcmd === '!evaluasi' || lcmd.startsWith('!curhat ') || lcmd.startsWith('!evaluasi '))) {
            const promptText = WisdomSparringEngine.formatDeepTalkPrompt();
            await waGateway.sock?.sendMessage(chatId, { text: promptText });
            return;
        }

        // ====================================================
        // MOUNTAIN & OUTDOOR COPILOT (!cuaca, !packing, !sopgunung)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!cuaca ') || lcmd.startsWith('/cuaca ') || lcmd.startsWith('!gunung '))) {
            const mQuery = incomingText.replace(/^[!/](?:cuaca|gunung)\s+/i, '').trim();
            await waGateway.sock?.sendMessage(chatId, { text: `🛰️ Mengambil data satelit cuaca puncak untuk *"${mQuery}"*...` }).catch(()=>{});
            const weatherMsg = await MountainCopilot.getSummitWeather(mQuery);
            await waGateway.sock?.sendMessage(chatId, { text: weatherMsg });
            return;
        }

        if (isOwner && (lcmd.startsWith('!packing') || lcmd.startsWith('/packing'))) {
            const parts = incomingText.trim().split(/\s+/);
            const days = parts[1] || 2;
            const team = parts[2] || 4;
            const packMsg = MountainCopilot.getPackingChecklist(days, team);
            await waGateway.sock?.sendMessage(chatId, { text: packMsg });
            return;
        }

        if (isOwner && (lcmd === '!sopgunung' || lcmd === '!daruratgunung' || lcmd === '/sopgunung')) {
            const sopMsg = MountainCopilot.getEmergencySOP();
            await waGateway.sock?.sendMessage(chatId, { text: sopMsg });
            return;
        }

        // ====================================================
        // SMART EXPENSE BUDGET GUARD (!pengeluaran, natural logging)
        // ====================================================
        const expenseParsed = isOwner ? SmartBudgetGuard.parseNaturalExpense(incomingText) : null;
        if (expenseParsed) {
            if (expenseParsed.action === 'QUERY') {
                const summaryMsg = SmartBudgetGuard.formatSummary(chatId);
                await waGateway.sock?.sendMessage(chatId, { text: summaryMsg });
                return;
            } else if (expenseParsed.action === 'ADD') {
                const recorded = SmartBudgetGuard.recordExpense({
                    chatId,
                    amount: expenseParsed.amount,
                    description: expenseParsed.description
                });
                const weekly = SmartBudgetGuard.getWeeklyStats(chatId);
                let addResp = `✅ *PENGELUARAN DICATAT!*\n` +
                              `━━━━━━━━━━━━━━━━━━\n` +
                              `📌 *Item:* ${recorded.description}\n` +
                              `💵 *Nominal:* Rp ${recorded.amount.toLocaleString('id-ID')}\n` +
                              `🏷️ *Kategori:* ${recorded.category}\n` +
                              `📊 *Total Minggu Ini:* Rp ${weekly.total.toLocaleString('id-ID')}\n` +
                              `━━━━━━━━━━━━━━━━━━\n`;
                if (weekly.total >= SmartBudgetGuard.DEFAULT_WEEKLY_BUDGET * 0.8) {
                    addResp += `⚠️ *Catatan:* Pengeluaran minggu ini sudah mendekati batas budget! Rem dikit ya Bos.`;
                } else {
                    addResp += `_Ketik \`!pengeluaran\` untuk melihat rekap saldo & jatah mingguan._`;
                }
                await waGateway.sock?.sendMessage(chatId, { text: addResp });
                return;
            }
        }

        // ====================================================
        // TERMUX SYSTEM HEALTH MONITOR (!status, !sistem, !clearmem)
        // ====================================================
        if (isOwner && (lcmd === '!status' || lcmd === '!sistem' || lcmd === '/status' || lcmd === '!hp' || lcmd === '!battery' || lcmd === '!hardware')) {
            const statusMsg = await DeviceHardwareSentinel.getDiagnosticReport();
            await waGateway.sock?.sendMessage(chatId, { text: statusMsg });
            return;
        }

        if (isOwner && (lcmd === '!clearmem' || lcmd === '/clearmem')) {
            const gcRes = TermuxDeviceBridge.cleanMemory();
            await waGateway.sock?.sendMessage(chatId, {
                text: `🧹 *PEMBERSIHAN MEMORI RAM BERHASIL*\n━━━━━━━━━━━━━━━━━━\n` +
                      `• Sebelum: ${gcRes.before} MB\n` +
                      `• Sesudah: ${gcRes.after} MB\n` +
                      `_Sistem kembali ringan & segar!_`
            });
            return;
        }

        // ====================================================
        // AGGRESSIVE ALARM ENGINE (!alarmgalak, "pasang alarm galak...")
        // ====================================================
        if (isOwner && (lcmd === '!alarmgalak' || lcmd === '!alarmgalak list' || lcmd === '/alarmgalak list')) {
            const list = AggressiveAlarmEngine.getActiveAlarms();
            if (list.length === 0) {
                await waGateway.sock?.sendMessage(chatId, { text: '⏰ Tidak ada alarm galak yang sedang aktif.' });
            } else {
                let msg = `🚨 *DAFTAR ALARM GALAK AKTIF (${list.length})*\n━━━━━━━━━━━━━━━━━━\n`;
                list.forEach((a, i) => {
                    const timeStr = new Date(a.target_timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                    msg += `${i + 1}. *${timeStr}* - "${a.alarm_text}" [Status: ${a.status}]\n`;
                });
                msg += `\n_Ketik "aku udah bangun" atau "stop alarm" untuk mematikan._`;
                await waGateway.sock?.sendMessage(chatId, { text: msg });
            }
            return;
        }

        const alarmParsed = isOwner ? AggressiveAlarmEngine.parseAlarmRequest(incomingText) : null;
        if (alarmParsed) {
            const newId = AggressiveAlarmEngine.createAlarm(chatId, alarmParsed.targetTimestamp, alarmParsed.alarmText);
            const confirmMsg =
                `🚨 *ALARM GALAK BERHASIL DISET!* 🚨\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `⏰ *Waktu Target:* *${alarmParsed.formattedTime}*\n` +
                `📝 *Agenda:* *${alarmParsed.alarmText}*\n` +
                `🆔 *ID Alarm:* #${newId}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `⚠️ *PERINGATAN:* Saat waktu tiba, alarm ini AKAN BERBUNYI TERUS SETIAP 60 DETIK (Teks + Pesan Suara VN) sampai Bos membalas kata sandi *"aku udah bangun"*!\n` +
                `_Anti-kesiangan Salim OS aktif._`;
            await waGateway.sock?.sendMessage(chatId, { text: confirmMsg });
            return;
        }

        // ====================================================
        // LIVE WEB SEARCH ENGINE (!cari <kueri>, !google <kueri>)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!cari ') || lcmd.startsWith('/cari ') || lcmd.startsWith('!google '))) {
            const query = incomingText.replace(/^[!/](?:cari|google)\s+/i, '').trim();
            if (!query) {
                await waGateway.sock?.sendMessage(chatId, { text: '❓ Masukkan kata kunci pencarian. Contoh: `!cari harga emas hari ini`' });
                return;
            }
            await waGateway.sock?.sendMessage(chatId, { text: `🌐 Sedang menjelajahi web secara real-time untuk *"${query}"*...` }).catch(()=>{});
            const searchSummary = await LiveWebSearch.search(query);
            await waGateway.sock?.sendMessage(chatId, { text: searchSummary });
            return;
        }

        // ====================================================
        // PEOPLE MEMORY CRM (Buku Catatan Teman & Info Kontak)
        // (!crm, "catat tentang <nama>: <info>", "info <nama>", "siapa yang punya...")
        // ====================================================
        const crmResponse = isOwner ? PeopleMemoryCRM.handleNaturalInput(incomingText) : null;
        if (crmResponse) {
            await waGateway.sock?.sendMessage(chatId, { text: crmResponse });
            return;
        }

        // ====================================================
        // SMART SPLIT BILL CALCULATOR (!splitbill, "hitung patungan...")
        // ====================================================
        if (isOwner) {
            const splitBillResp = SplitBillCalculator.handleCommand(incomingText);
            if (splitBillResp) {
                await waGateway.sock?.sendMessage(chatId, { text: splitBillResp });
                return;
            }
        }

        // ====================================================
        // HABIT TRACKER & STREAK COUNTER (!habit, "sudah push up 30x", etc.)
        // ====================================================
        if (isOwner) {
            const habitParsed = HabitTrackerEngine.parseNaturalHabit(incomingText);
            if (habitParsed) {
                if (habitParsed.action === 'LIST') {
                    const listText = HabitTrackerEngine.formatHabitList(chatId);
                    await waGateway.sock?.sendMessage(chatId, { text: listText });
                    return;
                } else if (habitParsed.action === 'LOG' && habitParsed.habitName) {
                    const logRes = HabitTrackerEngine.logHabit(chatId, habitParsed.habitName, habitParsed.notes);
                    await waGateway.sock?.sendMessage(chatId, { text: logRes });
                    return;
                } else if (habitParsed.action === 'ADD' && habitParsed.habitName) {
                    const addRes = HabitTrackerEngine.logHabit(chatId, habitParsed.habitName, 'Habit baru');
                    await waGateway.sock?.sendMessage(chatId, { text: addRes });
                    return;
                }
            }
        }

        // ====================================================
        // PERSONAL JOURNAL & PSYCHOLOGICAL REFLECTION (!jurnal, "catat jurnal: ...")
        // ====================================================
        if (isOwner) {
            const journalParsed = PersonalJournalEngine.parseNaturalJournal(incomingText);
            if (journalParsed) {
                if (journalParsed.action === 'RECAP') {
                    const recapText = PersonalJournalEngine.getRecentEntries(chatId);
                    await waGateway.sock?.sendMessage(chatId, { text: recapText });
                    return;
                } else if (journalParsed.action === 'RECORD' && journalParsed.content) {
                    await waGateway.sock?.sendMessage(chatId, { text: '✍️ Menganalisis refleksi dan menyimpannya ke brankas memori...' }).catch(()=>{});
                    const journalRes = await PersonalJournalEngine.recordEntry(chatId, journalParsed.content);
                    await waGateway.sock?.sendMessage(chatId, { text: journalRes });
                    return;
                }
            }
        }

        // ====================================================
        // EMAIL SENTINEL (!email, !cekemail)
        // ====================================================
        if (isOwner && (lcmd === '!email' || lcmd === '!cekemail' || lcmd === '/email')) {
            const emailRes = await EmailSentinelEngine.checkInbox();
            await waGateway.sock?.sendMessage(chatId, { text: emailRes.message });
            return;
        }

        // ====================================================
        // STEAM RADAR & DEALS (!steam <game/diskon>)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!steam ') || lcmd.startsWith('/steam ') || lcmd === '!steam' || lcmd === '/steam')) {
            const query = incomingText.replace(/^[!/]steam\s*/i, '').trim();
            const steamRes = await SteamRadarEngine.searchGame(query || 'special');
            await waGateway.sock?.sendMessage(chatId, { text: steamRes });
            return;
        }

        // ====================================================
        // COURIER & PACKAGE TRACKER (!resi <kurir> <nomor_resi>)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!resi ') || lcmd.startsWith('/resi ') || lcmd === '!resi' || lcmd === '/resi')) {
            const courierRes = await CourierTrackerEngine.track(incomingText);
            await waGateway.sock?.sendMessage(chatId, { text: courierRes });
            return;
        }

        // ====================================================
        // WEATHER & OUTDOOR RADAR (!cuaca, !cuaca <kota>)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!cuaca') || lcmd.startsWith('/cuaca'))) {
            const weatherRes = await WeatherOutdoorRadar.getWeather(incomingText);
            await waGateway.sock?.sendMessage(chatId, { text: weatherRes });
            return;
        }

        // ====================================================
        // UNIVERSAL MEDIA DOWNLOADER (!dl <url> or social links)
        // ====================================================
        if (isOwner && (lcmd.startsWith('!dl ') || lcmd.startsWith('/dl ') || UniversalMediaDownloader.isSupportedUrl(incomingText))) {
            const dlRes = await UniversalMediaDownloader.process(incomingText);
            await waGateway.sock?.sendMessage(chatId, { text: dlRes });
            return;
        }

        // ====================================================
        // ENTERPRISE SAAS CONTROL PLANE & AUDIT COMMANDS (Owner Only)
        // (!kuota, !usage, !audit <id>, !approve <id>, !reject <id>, !approvals)
        // ====================================================
        if (isOwner && (lcmd === '!kuota' || lcmd === '!usage' || lcmd === '/kuota')) {
            const usageReport = UsageMeteringBilling.formatUsageReport('tenant_agus_master');
            await waGateway.sock?.sendMessage(chatId, { text: usageReport });
            return;
        }

        if (isOwner && (lcmd.startsWith('!audit ') || lcmd.startsWith('/audit '))) {
            const traceId = incomingText.replace(/^[!/]audit\s*/i, '').trim();
            const auditRes = DecisionAuditTrail.explainDecision(traceId);
            await waGateway.sock?.sendMessage(chatId, { text: auditRes });
            return;
        }

        if (isOwner && (lcmd === '!approvals' || lcmd === '/approvals')) {
            const pending = Array.from(ActionPermissionEngine.pendingApprovals.values()).filter(p => p.status === 'PENDING_APPROVAL');
            if (pending.length === 0) {
                await waGateway.sock?.sendMessage(chatId, { text: '✅ Tidak ada permintaan aksi tertunda yang butuh approval saat ini.' });
            } else {
                let card = `⚠️ *DAFTAR PERSETUJUAN TERTUNDA (${pending.length})*\n━━━━━━━━━━━━━━━━━━\n`;
                pending.forEach((p, idx) => {
                    card += `${idx + 1}. ID: \`${p.approvalId}\`\n   Aksi: *${p.actionType}*\n   Waktu: ${p.requestedAt}\n\n`;
                });
                card += `_Ketik \`!approve <ID>\` atau \`!reject <ID>\`_`;
                await waGateway.sock?.sendMessage(chatId, { text: card });
            }
            return;
        }

        if (isOwner && (lcmd.startsWith('!approve ') || lcmd.startsWith('/approve '))) {
            const appId = incomingText.replace(/^[!/]approve\s*/i, '').trim();
            const res = ActionPermissionEngine.approveAction(appId, 'Agus_Owner');
            await waGateway.sock?.sendMessage(chatId, { text: res.message });
            return;
        }

        if (isOwner && (lcmd.startsWith('!reject ') || lcmd.startsWith('/reject '))) {
            const appId = incomingText.replace(/^[!/]reject\s*/i, '').trim();
            const res = ActionPermissionEngine.rejectAction(appId, 'Agus_Owner');
            await waGateway.sock?.sendMessage(chatId, { text: res.message });
            return;
        }

        // ====================================================
        // CONTACT & GROUP WHITELIST POLICY (WEB COCKPIT & !whitelist)
        // Owner selalu diizinkan, kontak/grup lain harus diizinkan via Checklist/Command
        // ====================================================
        const isGroupMsg = chatId.endsWith('@g.us');
        
        // Record seen so contact or group appears in Web Cockpit checklist with actual name
        const entityName = isGroupMsg ? await getGroupSubject(chatId) : pushName;
        await ContactPolicyEngine.recordSeen(chatId, entityName, isGroupMsg);

        const isAllowedChat = isOwner || await ContactPolicyEngine.isAllowed(chatId, isGroupMsg);
        if (!isAllowedChat) {
            return; // Drop total pesan jika belum diizinkan oleh Owner
        }

        // ====================================================
        // STRICT GROUP MENTION & REPLY GUARD (Anti-Spam Mutlak)
        // Bot HANYA membalas di grup jika:
        // 1. Nomor / Akun Owner di-tag (@mention) via Phone / LID
        // 2. Pesan Owner / Bot di-reply (quote reply)
        // 3. Explicit command (!ai / !tanya)
        // ====================================================
        if (isGroupMsg) {
            const isCommandTrigger = /^(?:!ai|!tanya|\/ai|\/tanya)\b/i.test(incomingText);
            const isTargeted = isCommandTrigger || OwnerMentionResolver.isSpecificallyTargetedToOwner({
                rawMessage,
                ownerJid: waGateway.sock?.user?.id || OWNER_LID,
                text: incomingText
            });

            if (!isTargeted) {
                // Bukan di-tag dan bukan me-reply pesan Owner/Bot — 100% DIAM (Anti-Spam)
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

                    // Smart Receipt & QRIS OCR
                    if (isOwner && ReceiptScannerOCR.isReceiptLure(incomingText)) {
                        console.log(`[ReceiptOCR] 🧾 Processing receipt from Owner in ${chatId}`);
                        await waGateway.sock?.sendMessage(chatId, { text: '🔍 Sedang memindai struk/nota pembayaran via Vision AI... (tunggu sebentar ya Bos)' }).catch(()=>{});
                        const receiptResp = await ReceiptScannerOCR.processAndRecord(chatId, imageBase64, mimeType);
                        await waGateway.sock?.sendMessage(chatId, { text: receiptResp });
                        PersistFirstIngress.markCompleted(canonicalMsg.id);
                        return;
                    }
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
            const docMsg = rawMessage?.documentMessage || rawMessage?.documentWithCaptionMessage?.message?.documentMessage;
            const isDoc = Boolean(docMsg);
            if (isDoc && waGateway.sock) {
                docFileName = docMsg.fileName || 'document.pdf';
                const fileSize = Number(docMsg.fileLength || 0);
                const MAX_DOC_SIZE = 18 * 1024 * 1024; // 18 MB limit for inline Google API and Termux safety

                if (fileSize > MAX_DOC_SIZE) {
                    console.warn(`[WA Doc] ⚠️ Document "${docFileName}" is too large (${(fileSize/1024/1024).toFixed(1)} MB > 18 MB). Skipping raw buffer.`);
                    incomingText = incomingText
                        ? `${incomingText}\n[Pemberitahuan Dokumen]: File "${docFileName}" berukuran ${(fileSize/1024/1024).toFixed(1)} MB (melebihi batas maksimal 18 MB pemrosesan langsung di HP). Mohon beri tahu Bos dengan ramah bahwa batas per file adalah 18 MB.`
                        : `File dokumen "${docFileName}" berukuran ${(fileSize/1024/1024).toFixed(1)} MB (melebihi batas maksimal 18 MB untuk pemrosesan AI langsung di HP). Jelaskan hal ini ke Bos dengan santai dan ramah.`;
                } else {
                    const msgToDownload = rawMessage?.documentMessage ? rawMessage : { documentMessage: docMsg };
                    const buffer = await downloadMediaMessage(
                        { key: rawKey, message: msgToDownload },
                        'buffer', {},
                        { logger: { level: 'silent', child: () => ({ error: ()=>{}, warn: ()=>{}, info: ()=>{}, debug: ()=>{} }) }, reuploadRequest: waGateway.sock.updateMediaMessage }
                    );
                    if (buffer) {
                        docBase64 = buffer.toString('base64');
                        mimeType = docMsg.mimetype || 'application/pdf';
                        console.log(`[WA Doc] 📄 Downloaded document "${docFileName}" (${(buffer.length/1024).toFixed(1)} KB) from ${chatId}`);

                        if (docFileName.endsWith('.txt') || docFileName.endsWith('.csv') || docFileName.endsWith('.json') || docFileName.endsWith('.md')) {
                            const snippet = buffer.toString('utf8').slice(0, 4000);
                            incomingText = incomingText ? `${incomingText}\n[Isi Dokumen "${docFileName}"]:\n${snippet}` : `[Isi Dokumen "${docFileName}"]:\n${snippet}`;
                        } else {
                            incomingText = incomingText ? `${incomingText}\n[Lampiran Dokumen PDF]: "${docFileName}"` : `Tolong baca, analisis, dan jelaskan atau buatkan ringkasan isi dokumen PDF "${docFileName}" ini secara lengkap`;
                        }
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

            // ── SECURITY FIREWALL: Prompt Injection & Goal Hijacking (OWASP Agent Security) ──
            let deliveryPlan = null;
            if (!isOwner && incomingText) {
                const injection = PromptInjectionFirewall.inspect(incomingText);
                if (!injection.clean && injection.blocked) {
                    console.warn(`[SECURITY FIREWALL] Blocked prompt injection from ${chatId}: ${injection.matchedAttacks.map(a => a.category).join(', ')}`);
                    deliveryPlan = {
                        text: injection.safeResponse,
                        bubbles: [injection.safeResponse],
                        typingDelays: [800],
                        reactionEmoji: '🛡️',
                        action: 'REPLY'
                    };
                }
            }

            // ── FAST INTERCEPTOR: Owner Whitelist & Permission Control (!whitelist, !izinkan, !mute) ──
            if (!deliveryPlan && isOwner) {
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

            // ── FAST INTERCEPTOR: Multi-Step Mission DAG Progression (Owner Only) ──
            if (!deliveryPlan && isOwner && MissionDAGTracker.isResumeCommand(incomingText)) {
                const advance = incomingText.trim().toLowerCase() !== 'misi' && incomingText.trim().toLowerCase() !== 'status misi';
                const missionRes = MissionDAGTracker.handleProgression(advance);
                if (missionRes.handled) {
                    deliveryPlan = {
                        text: missionRes.response,
                        bubbles: [missionRes.response],
                        typingDelays: [600],
                        reactionEmoji: '🧩',
                        action: 'REPLY'
                    };
                }
            }

            // ── FAST INTERCEPTOR: Pattern Watcher & "STOP ME" Engine (Owner Only) ──
            if (!deliveryPlan && isOwner) {
                const stopCheck = PatternWatcherAndStopMeEngine.check(incomingText);
                if (stopCheck.shouldIntervene && stopCheck.warningMessage) {
                    deliveryPlan = {
                        text: stopCheck.warningMessage,
                        bubbles: [stopCheck.warningMessage],
                        typingDelays: [800],
                        reactionEmoji: '✋',
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

            // ── FAST INTERCEPTOR: Universal AI Operating System ("Request Anything") (Owner Only) ──
            if (!deliveryPlan && isOwner && UniversalRequestEngine.isBusinessRequest(incomingText)) {
                const bizRes = await UniversalRequestEngine.processRequest({
                    tenantId: 'tenant_agus_master',
                    text: incomingText,
                    role: 'AI_AGENT',
                    chatId
                });
                if (bizRes) {
                    deliveryPlan = {
                        text: bizRes,
                        bubbles: [bizRes],
                        typingDelays: [800],
                        reactionEmoji: '🏢',
                        action: 'REPLY'
                    };
                }
            }

            // ── BUSINESS OS INTERCEPTOR (Goals for Owner, Guarded Inbound Sales for Clients) ──
            if (!deliveryPlan && incomingText) {
                try {
                    const bizPlan = await businessOS.process({
                        chatId,
                        incomingText,
                        isOwner,
                        mediaOptions
                    });
                    if (bizPlan && bizPlan.handled && bizPlan.deliveryPlan) {
                        deliveryPlan = bizPlan.deliveryPlan;
                    }
                } catch (bizErr) {
                    console.warn('[BusinessOS] ⚠️ Interceptor error, falling back:', bizErr.message);
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

                // 3. Two-Way Conversational Voice Note Reply (if Voice Note incoming, or requested by Owner)
                const hasAudioInput = Boolean(audio || payload?.audioBase64 || payload?.audio);
                const wantsVoiceNote = isOwner && (
                    hasAudioInput ||
                    TwoWayVoiceDirector.shouldReplyWithVoice(incomingText, hasAudioInput, isOwner) ||
                    /\b(?:jawab|balas|kirim)\s*(?:pake|pakai|dengan)?\s*(?:vn|suara|audio)\b/i.test(incomingText) ||
                    /\b(?:pake|pakai)\s*(?:vn|suara)\b/i.test(incomingText)
                );

                if (wantsVoiceNote && waGateway.sock) {
                    try {
                        const voiceText = deliveryPlan.text || (deliveryPlan.bubbles || []).join(' ');
                        const audioBuffer = await TwoWayVoiceDirector.generateVoiceBuffer(voiceText);
                        if (audioBuffer) {
                            await waGateway.sock.sendMessage(chatId, {
                                audio: audioBuffer,
                                mimetype: 'audio/mp4',
                                ptt: true
                            });
                            console.log(`[WA Voice] 🎙️ Two-Way Voice Note auto-replied to ${chatId}`);
                        }
                    } catch (vErr) {
                        console.warn('[WA Voice] ⚠️ Failed auto-VN reply:', vErr.message);
                    }
                }

                // 4. Dispatch Bubbles with Adaptive Typing Delays
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

    // Start Natural Language Reminder & Alarm Daemon
    NaturalReminderEngine.startDaemon(waGateway);

    // Start Proactive Daily Briefing & Night Recap Cron
    DailyLifeBriefing.startCron(waGateway, OWNER_LID);

    // Start Aggressive Wake-Up Alarm Loop Daemon (checks every 15s, fires every 60s)
    AggressiveAlarmEngine.startDaemon(waGateway);

    // Start Telegram Mirror Gateway (Dual-Ecosystem Bridge)
    TelegramMirrorGateway.start(async ({ text, chatId: tgChatId, fromUser }) => {
        console.log(`[TelegramMirror] 📨 Incoming from @${fromUser} (${tgChatId}): "${text}"`);
        try {
            const plan = await personalAI.process(OWNER_LID, text, `tg_${Date.now()}`);
            return plan?.text || (plan?.bubbles || []).join('\n\n') || null;
        } catch (tgErr) {
            console.warn('[TelegramMirror] Error processing message:', tgErr.message);
            return null;
        }
    });

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
    TelegramMirrorGateway.stop();
    burstAggregator.flushAll();
    QueueWorker.stop();
    waGateway.shutdown();
    setTimeout(() => process.exit(0), 1000);
});

start();
