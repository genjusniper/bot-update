// src/resilience/FailureContainment.mjs
// Failure Containment & Degraded State Machine — Never Spam Failure

import { EmergencyConversationBrain } from './EmergencyConversationBrain.mjs';

export class FailureContainment {
    static chatFailureMap = new Map(); // chatId -> { count: number, lastFailureTime: number, inDegradedMode: boolean }

    static getFailureState(chatId) {
        if (!this.chatFailureMap.has(chatId)) {
            this.chatFailureMap.set(chatId, { count: 0, lastFailureTime: 0, inDegradedMode: false });
        }
        return this.chatFailureMap.get(chatId);
    }

    static recordSuccess(chatId) {
        this.chatFailureMap.set(chatId, { count: 0, lastFailureTime: 0, inDegradedMode: false });
    }

    static recordFailure(chatId) {
        const state = this.getFailureState(chatId);
        state.count++;
        state.lastFailureTime = Date.now();
        if (state.count >= 2) {
            state.inDegradedMode = true;
        }
        return state;
    }

    static handleFailure(chatId, incomingMessage) {
        const state = this.recordFailure(chatId);
        console.warn(`[FailureContainment] ⚠️ Handled failure for ${chatId} (Consecutive failures: ${state.count})`);

        // Use Emergency Conversation Brain to return a smart, contextual reply with 0 API tokens
        const emergencyReply = EmergencyConversationBrain.generateEmergencyReply(incomingMessage);
        return emergencyReply;
    }
}
