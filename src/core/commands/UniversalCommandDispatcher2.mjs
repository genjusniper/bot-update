// src/core/commands/UniversalCommandDispatcher2.mjs
// Universal Command Dispatcher 2.0 (Global Command & Control Layer)
// Intercepts control commands, health probes, and management instructions BEFORE LLM invocation
// Strictly enforces Owner-only execution for mutating commands anywhere via ATX 2.0.

import { GlobalCommandDetector } from '../control/GlobalCommandDetector.mjs';
import { AuthorityManager } from '../control/AuthorityManager.mjs';
import { GlobalControlPlane } from '../control/GlobalControlPlane.mjs';

export class UniversalCommandDispatcher2 {
    constructor(options = {}) {
        this.ownerJids = new Set(options.ownerJids || ['owner', 'admin']);
        this.detector = options.detector || GlobalCommandDetector;
        this.controlPlane = options.controlPlane || GlobalControlPlane;
        this.authority = options.authority || AuthorityManager;
    }

    /**
     * Detects if incoming message is a control command
     * @param {string} text 
     * @returns {string|null} Canonical command name or null
     */
    detectCommand(text = '') {
        if (!text || typeof text !== 'string') return null;
        const detection = this.detector.detect(text);
        if (detection.isControlCommand && detection.actionName) {
            return detection.actionName.toLowerCase();
        }
        return null;
    }

    /**
     * Inspects full detection details
     * @param {string} text 
     * @returns {Object} Detection result
     */
    detect(text = '') {
        return this.detector.detect(text);
    }

    /**
     * Dispatches command before LLM invocation
     * @param {string} text User message
     * @param {Object} context Context { senderJid, senderName, chatId, isGroup, isOwner, metadata, waGateway }
     * @returns {Promise<{ handled: boolean, command?: string, response?: string, reason?: string, operationType?: string, executionDurationMs?: number }>}
     */
    async dispatch(text = '', context = {}) {
        const detection = this.detector.detect(text);
        if (!detection.isControlCommand || !detection.actionName) {
            return { handled: false };
        }

        const actionName = detection.actionName.toUpperCase();
        const operationType = detection.operationType || 'READ';
        const senderId = context.senderJid || context.senderId || 'unknown';
        const chatId = context.chatId || senderId;
        const metadata = context.metadata || {};
        const startTime = Date.now();

        // 1. Identity & Anti-Spoofing Authority Check
        const isOwner = this.authority.isTrustedOwner(senderId, metadata);
        const canExecute = this.authority.canExecute(senderId, actionName, metadata);

        // Mutating commands are strictly OWNER-ONLY anywhere
        if (operationType === 'MUTATING' && !isOwner) {
            return {
                handled: true,
                command: actionName,
                operationType,
                response: '⛔ Akses ditolak: Perintah operasional mutasi hanya dapat dijalankan oleh Owner terverifikasi.',
                reason: 'MUTATING_PERMISSION_DENIED',
                executionDurationMs: Date.now() - startTime
            };
        }

        if (!canExecute) {
            return {
                handled: true,
                command: actionName,
                operationType,
                response: '⛔ Akses ditolak: Hak akses tidak mencukupi untuk menjalankan perintah ini.',
                reason: 'PERMISSION_DENIED',
                executionDurationMs: Date.now() - startTime
            };
        }

        // 2. Execute via GlobalControlPlane (Central ATX 2.0 Pipeline)
        try {
            const controlResult = await this.controlPlane.execute({
                action: actionName,
                args: detection.args || [],
                senderId,
                chatId,
                waGateway: context.waGateway || null,
                preConfirmed: Boolean(context.preConfirmed)
            });

            return {
                handled: true,
                command: actionName,
                operationType,
                response: controlResult.output || '✅ Perintah berhasil dieksekusi.',
                success: controlResult.success,
                requiresExit: controlResult.requiresExit,
                executionDurationMs: Date.now() - startTime
            };
        } catch (error) {
            return {
                handled: true,
                command: actionName,
                operationType,
                response: `❌ Gagal menjalankan perintah operasional: ${error.message}`,
                error: error.message,
                executionDurationMs: Date.now() - startTime
            };
        }
    }
}

export const universalCommandDispatcher2 = new UniversalCommandDispatcher2();
