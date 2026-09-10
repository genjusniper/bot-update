// src/core/kernel/PersonalSimulationKernel.mjs
// Central digital twin behavior synthesizer producing structured PersonalContextContract

import { PersonalityCore } from './PersonalityCore.mjs';
import { PersonalityStabilityController } from './PersonalityStabilityController.mjs';
import { CognitiveDecisionEngine } from '../cognition/CognitiveDecisionEngine.mjs';
import { ContextCalibrator } from '../social/ContextCalibrator.mjs';
import { ClosureEngine } from '../flow/ClosureEngine.mjs';
import { TopicShiftEngine } from '../flow/TopicShiftEngine.mjs';
import { WorldModelResolver } from '../world/WorldModelResolver.mjs';
import { BehavioralMetrics } from '../observability/BehavioralMetrics.mjs';
import { ReadTheRoomEngine } from '../interaction/ReadTheRoomEngine.mjs';
import { SharingDetectionEngine } from '../interaction/SharingDetectionEngine.mjs';
import { InteractionModeEngine } from '../interaction/InteractionModeEngine.mjs';
import { QuestionBudgetEngine } from '../interaction/QuestionBudgetEngine.mjs';
import { HumorBudgetEngine } from '../interaction/HumorBudgetEngine.mjs';
import { AcknowledgementStyleEngine } from '../interaction/AcknowledgementStyleEngine.mjs';
import { PunchlineSelectionEngine } from '../interaction/PunchlineSelectionEngine.mjs';
import { MessageBurstEngine } from '../interaction/MessageBurstEngine.mjs';
import { ResponseTimingModel } from '../interaction/ResponseTimingModel.mjs';
import { ConversationRhythmEngine } from '../interaction/ConversationRhythmEngine.mjs';
import { CommunicationDNA } from '../personality/CommunicationDNA.mjs';
import { ContactRegistry } from '../identity/ContactRegistry.mjs';
import { AliasResolver } from '../identity/AliasResolver.mjs';
import { NamePreferenceModel } from '../identity/NamePreferenceModel.mjs';
import { ContactConfidenceEngine } from '../identity/ContactConfidenceEngine.mjs';
import { GroupContextEngine } from '../group/GroupContextEngine.mjs';
import { UniversalEntityResolver } from '../world/UniversalEntityResolver.mjs';
import { UniversalKnowledgeRouter } from '../knowledge/UniversalKnowledgeRouter.mjs';
import { TemporalIntelligence } from '../memory/TemporalIntelligence.mjs';
import { EvidenceEngine } from '../memory/EvidenceEngine.mjs';
import { CognitivePlanner } from '../reasoning/CognitivePlanner.mjs';
import { CandidateSimulator } from '../reasoning/CandidateSimulator.mjs';
import { UniversalContextBus } from '../fabric/UniversalContextBus.mjs';
import { UniversalCognitiveGraph } from '../fabric/UniversalCognitiveGraph.mjs';

export class PersonalSimulationKernel {
    /**
     * Synthesizes FusedSensorySnapshot + Core Persona into a concrete PersonalContextContract
     * @param {Object} fusedSnapshot - Output from SignalFusion
     * @param {Object} [options={}] - Optional overrides or test hooks
     * @returns {Object} PersonalContextContract (WHAT / HOW / WHY)
     */
    static synthesize(fusedSnapshot = {}, options = {}) {
        const { state, modulationsApplied } = PersonalityStabilityController.modulate(fusedSnapshot);
        const dims = fusedSnapshot.dimensions || {};

        // 1. Behavioral Variance Engine (70% Stable / 20% Adaptive / 10% Variation)
        const seed = options.varianceSeed !== undefined 
            ? Number(options.varianceSeed) 
            : Math.random();

        let varianceMode = 'STABLE_DEFAULT';
        if (seed > 0.90) {
            varianceMode = 'CONTROLLED_VARIATION';
        } else if (seed > 0.70) {
            varianceMode = 'CONTEXTUAL_ADAPTATION';
        }

        // 2. Decide WHAT (Strategy / Action)
        let strategy = 'OBSERVE_AND_PROBE';
        let requiresFollowup = false;

        if (dims.intent === 'QUERY' || dims.intent === 'REQUEST') {
            strategy = 'DIRECT_ANSWER';
        } else if (dims.intent === 'CURHAT' || dims.conversationState === 'VENTING') {
            strategy = 'REACT_THEN_PROBE';
            requiresFollowup = true;
        } else if (dims.intent === 'GREETING') {
            strategy = 'GREETING_RETURN';
        } else if (state.humorAllowed && state.teasingAffinity > 0.6) {
            strategy = 'DEADPAN_REACT';
        }

        // 3. Cognitive Reasoning & Overhelp Guard (Phase 4)
        const cognitive = CognitiveDecisionEngine.decide({
            fusedSnapshot,
            text: options.text || '',
            metadata: options.metadata || {}
        });

        // 4. Social & Context Calibration (Phase 6)
        const isGroup = Boolean(
            fusedSnapshot.canonicalMsg?.isGroup ||
            fusedSnapshot.metadata?.canonicalMsg?.isGroup ||
            fusedSnapshot.context?.isGroup ||
            fusedSnapshot.context?.canonicalMsg?.isGroup ||
            options.isGroup
        );
        const socialContext = ContextCalibrator.calibrate({
            isGroup,
            relationshipTier: dims.relationshipTier || 'STRANGER',
            emotionValence: dims.emotionValence || 'NEUTRAL'
        });

        // 5. Flow & Topic Shift Analysis (Phase 7)
        const closure = ClosureEngine.evaluate({
            text: options.text || '',
            languageStyle: state.languageMode
        });
        const topicShift = TopicShiftEngine.evaluate({
            currentText: options.text || '',
            languageStyle: state.languageMode
        });

        if (closure.isClosing) {
            strategy = 'CONVERSATION_CLOSURE';
            requiresFollowup = false;
        }

        // 6. World Model & Entity Memory (Phase 8)
        const worldContext = WorldModelResolver.resolve({
            text: options.text || '',
            fusedSnapshot
        });

        // 7. Interaction Dynamics & WhatsApp-Native Calibration (Phase 14)
        const roomState = ReadTheRoomEngine.read({ text: options.text || '', fusedSnapshot });
        const sharing = SharingDetectionEngine.evaluate(options.text || '');
        const interactionMode = InteractionModeEngine.resolve({
            text: options.text || '',
            fusedSnapshot,
            roomState,
            sharing,
            isGroup
        });
        const questionBudget = QuestionBudgetEngine.calculate({
            interactionMode: interactionMode.mode,
            sharing,
            clarification: cognitive.clarification
        });
        const humorBudget = HumorBudgetEngine.evaluate({
            chatId: fusedSnapshot.context?.chatId || 'default',
            humorStyle: state.humorAllowed ? state.humorStyle : 'OFF',
            interactionMode: interactionMode.mode
        });
        const acknowledgement = AcknowledgementStyleEngine.resolve({
            interactionMode: interactionMode.mode,
            roomState: roomState.state,
            directness: state.directness
        });
        const punchline = PunchlineSelectionEngine.evaluate({
            text: options.text || '',
            interactionMode: interactionMode.mode
        });
        const messageBurst = MessageBurstEngine.decide({
            interactionMode: interactionMode.mode,
            roomState: roomState.state,
            urgency: dims.urgency || 0.2,
            isGroup,
            varianceSeed: seed
        });
        const rhythm = ConversationRhythmEngine.analyze({
            interactionMode: interactionMode.mode,
            userWordCount: (options.text || '').split(/\s+/).filter(Boolean).length
        });
        const maxWords = closure.isClosing ? 4 : (state.targetLength === 'ULTRA_SHORT' ? 8 : (state.targetLength === 'CONCISE' ? 14 : 22));
        const timing = ResponseTimingModel.calculate({
            interactionMode: interactionMode.mode,
            urgency: dims.urgency || 0.2,
            wordCount: maxWords
        });
        const dna = CommunicationDNA.resolveForTier(dims.relationshipTier || 'STRANGER');

        // 8. Identity, Group & Universal Entity Intelligence (Phase 15)
        const senderIdentifier = options.senderJid || 
            fusedSnapshot.canonicalMsg?.sender || 
            fusedSnapshot.context?.sender || 
            options.chatId || 
            '';
        
        let resolvedIdentity = AliasResolver.resolve(senderIdentifier);
        if (!resolvedIdentity.contact && senderIdentifier) {
            const byJid = ContactRegistry.getContact(senderIdentifier);
            if (byJid) {
                resolvedIdentity = { contact: byJid, matchedBy: 'JID', confidence: byJid.confidence || 0.85 };
            }
        }

        if (!resolvedIdentity.contact && options.senderName) {
            const byName = AliasResolver.resolve(options.senderName);
            if (byName.contact) {
                resolvedIdentity = byName;
            }
        }

        const contact = resolvedIdentity?.contact || null;
        const addressForm = NamePreferenceModel.resolveAddressForm(
            contact || (options.senderName ? { canonicalName: options.senderName, relationshipTier: dims.relationshipTier || 'STRANGER' } : null), 
            dims.relationshipTier
        );
        const howTheyAddressMe = NamePreferenceModel.getHowTheyAddressMe(contact);
        const contactConfidence = ContactConfidenceEngine.evaluate({
            isVerified: contact ? contact.isVerified : false,
            matchType: resolvedIdentity?.matchedBy || 'NONE',
            baseScore: resolvedIdentity?.confidence || 0.5
        });

        let groupContext = { isGroup: false };
        if (isGroup) {
            groupContext = GroupContextEngine.processGroupEvent({
                groupId: fusedSnapshot.context?.chatId || options.chatId,
                senderJid: senderIdentifier,
                senderName: options.senderName || contact?.canonicalName || 'Member',
                text: options.text || '',
                isMentioned: Boolean(options.isMentioned),
                isReplyToBot: Boolean(options.isReplyToBot)
            });
        }

        const entities = UniversalEntityResolver.resolveEntities(options.text || '');
        const knowledgeRoute = UniversalKnowledgeRouter.routeQuery(options.text || '');
        const temporal = TemporalIntelligence.parse(options.text || '');
        const cognitivePlan = CognitivePlanner.plan(options.text || '');
        const simulation = CandidateSimulator.evaluateCandidates({
            text: options.text || '',
            contract: { how: state, cognitive }
        });

        // 8. Universal Context Bus & Reality Grounding (Cognitive Fabric v1)
        const fabricPacket = UniversalContextBus.assemble({
            text: options.text || '',
            senderId: senderIdentifier,
            senderName: options.senderName || contact?.canonicalName,
            chatId: fusedSnapshot.context?.chatId || options.chatId,
            isGroup,
            fusedSnapshot
        });

        // 9. Decide WHY (Reasoning Context for LLM & Audit)
        const whyReasoning = `Situasi terdeteksi: Mode ${interactionMode.mode}, Room: ${roomState.state}, Intent: ${dims.intent}. Aturan: [${modulationsApplied.join(', ') || 'CORE_BASELINE'}]. Strategi: ${strategy}. Shape: ${messageBurst.shape}.`;

        const contract = {
            contractId: `contract_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            what: {
                strategy,
                actionType: 'CHAT_RESPONSE',
                requiresFollowupQuestion: requiresFollowup
            },
            how: {
                tone: state.targetTone,
                directnessScore: state.directness,
                targetLength: state.targetLength,
                maxWords,
                languageStyle: state.languageMode,
                humorStyle: (state.humorAllowed && humorBudget.canJoke) ? state.humorStyle : 'OFF',
                forbiddenPhrases: Array.from(PersonalityCore.HUMOR.clicheBanList),
                varianceMode,
                varianceSeed: Number(seed.toFixed(3))
            },
            cognitive: {
                mode: cognitive.cognitiveMode,
                priorityScore: cognitive.priorityScore,
                adviceAllowed: cognitive.overhelp.adviceAllowed,
                directiveText: cognitive.overhelp.directiveText,
                clarificationInstruction: cognitive.clarification.instruction
            },
            social: {
                privacyLevel: socialContext.privacyLevel,
                banterAllowed: socialContext.banter.banterAllowed,
                directiveText: socialContext.directiveText
            },
            flow: {
                isClosing: closure.isClosing,
                isShifting: topicShift.isShifting,
                bridge: topicShift.bridge,
                terminalResponse: closure.terminalResponse,
                directiveText: closure.isClosing ? closure.directiveText : topicShift.directive
            },
            world: {
                activeProjects: worldContext.activeProjects,
                directiveText: worldContext.directiveText
            },
            interaction: {
                mode: interactionMode.mode,
                roomState: roomState.state,
                sharing,
                questionBudget,
                humorBudget,
                acknowledgement,
                punchline,
                messageBurst,
                rhythm,
                timing,
                dna
            },
            identity: {
                personId: contact?.personId || 'unknown',
                canonicalName: contact?.canonicalName || options.senderName || 'Sobat',
                addressForm: addressForm.callName,
                etiquette: addressForm.etiquette,
                howTheyAddressMe,
                confidence: contactConfidence.confidenceScore,
                verificationState: contactConfidence.verificationState,
                isVerified: Boolean(contact?.isVerified)
            },
            group: groupContext,
            entities,
            knowledge: {
                route: knowledgeRoute.route,
                confidence: knowledgeRoute.confidence,
                reasoning: knowledgeRoute.reasoning
            },
            temporal: {
                hasAnchor: temporal.hasTemporalAnchor,
                label: temporal.relativeLabel,
                isoDate: temporal.isoDate
            },
            reasoning: {
                isMultiStep: cognitivePlan.isMultiStep,
                steps: cognitivePlan.steps,
                priority: cognitivePlan.priority,
                optimalCandidate: simulation.optimalStrategy
            },
            fabric: {
                packetId: fabricPacket.packetId,
                grounding: fabricPacket.grounding,
                commitments: fabricPacket.commitments,
                uncertaintyScore: fabricPacket.uncertaintyScore,
                riskGates: fabricPacket.riskGates
            },
            why: {
                reasoning: whyReasoning,
                modulationsApplied
            }
        };

        try {
            BehavioralMetrics.recordContract(contract);
        } catch (e) {}

        return contract;
    }

    /**
     * Converts a PersonalContextContract into a compact, bulletproof 10-line directive block for Gemini
     * @param {Object} contract - PersonalContextContract
     * @returns {string} Compact prompt directives
     */
    static formatContractForPrompt(contract) {
        if (!contract) return '';
        const { what, how, why, interaction } = contract;

        let languageGuide = 'Bahasa Indonesia santai, akrab, wajar';
        if (how.languageStyle === 'SEMARANGAN_JAWA') {
            languageGuide = 'Bahasa Jawa Semarangan santai/akrab (contoh: "lha piye to", "santai wae", "rasah neko-neko")';
        } else if (how.languageStyle === 'FORMAL_INDO') {
            languageGuide = 'Bahasa Indonesia sopan, profesional, dan to-the-point';
        }

        return `=== PERSONAL BEHAVIOR CONTRACT ===
${contract.identity?.canonicalName ? `IDENTITAS KONTAK: ${contract.identity.canonicalName} (Sapa/Panggil: "${contract.identity.addressForm || 'Bro'}") | Status: ${contract.identity.verificationState}\n` : ''}${contract.group?.isGroup ? `KONTEKS GRUP: Diskresi ${contract.group.responseDiscretion} | Rekomendasi: ${contract.group.recommendation}\n` : ''}MODE INTERAKSI: ${interaction?.mode || 'Casual'} | ${interaction?.messageBurst?.directive || 'Single bubble'}
STRATEGI RESPON (WHAT): ${what.strategy} (${what.requiresFollowupQuestion ? 'Pancing cerita pendek, jangan beri wejangan!' : 'Jawab langsung, jangan muter-muter'})
GAYA & NADA (HOW): ${how.tone} | Directness: ${(how.directnessScore * 100).toFixed(0)}%
GAYA BAHASA: ${languageGuide}
BATASAN KATA: MAKSIMAL ${how.maxWords} KATA! Dilarang membuat esai panjang! Dilarang tanda seru (!) di akhir kalimat!
KUOTA PERTANYAAN: ${interaction?.questionBudget?.directive || '0 pertanyaan'}
HUMOR: ${how.humorStyle === 'OFF' ? 'DILARANG BERCANDA! Jaga suasana serius/empati!' : `Gunakan humor ${how.humorStyle} tipis, jangan melawak garing!`}
GAYA RESPON: ${interaction?.acknowledgement?.directive || 'Casual'} | ${interaction?.punchline?.directive || 'Jawab natural'}
${contract.knowledge?.route && contract.knowledge.route !== 'GENERAL_LLM' ? `RUTE PENGETAHUAN: [${contract.knowledge.route}] ${contract.knowledge.reasoning}\n` : ''}${contract.temporal?.hasAnchor ? `JANGKAR WAKTU: [${contract.temporal.label}] Terkait tanggal ${contract.temporal.isoDate}\n` : ''}${contract.reasoning?.isMultiStep ? `RENCANA TAHAP: [${contract.reasoning.steps.length} Langkah] ${contract.reasoning.steps.map(s => s.instruction).join(' -> ')}\n` : ''}${contract.fabric?.grounding?.requiresHedging ? `KEPASTIAN FAKTA: [${contract.fabric.grounding.epistemicClass}] Gunakan nada hati-hati ("${contract.fabric.grounding.hedgePhrase}").\n` : ''}PEDOMAN KOGNITIF: ${contract.cognitive?.directiveText || 'Jawab santai dan wajar.'}
KONTEKS SOSIAL: ${contract.social?.directiveText || 'Privat dan wajar.'}
ALUR PERCAKAPAN: ${contract.flow?.directiveText || 'Alur percakapan normal.'}
FAKTA DUNIA: ${contract.world?.directiveText || 'Basis pengetahuan personal.'}
LARANGAN MUTLAK KATA: DILARANG KERAS menggunakan kata klise: [${how.forbiddenPhrases.slice(0, 4).join(', ')}]!
RASIONAL (WHY): ${why.reasoning}
==================================`;
    }
}
