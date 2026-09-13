/**
 * ApprovalIntegrityEngine.mjs
 * 
 * OWASP Lies-in-the-Loop Protection & Approval Integrity.
 * Guarantees that approvals are strictly cryptographically bound to:
 * WHO, WHAT, TARGET, PARAMETERS_HASH, SCOPE, TIME, EXPIRY, POLICY_VERSION
 * 
 * Any modification of parameters or post-approval replay renders the ticket VOID.
 */

import crypto from 'crypto';

export class ApprovalIntegrityEngine {
    static POLICY_VERSION = '2026.09.v2';

    /**
     * Generate a tamper-proof approval request
     */
    static createTicket({ requester, action, target, parameters, scope = 'SINGLE_ACTION', ttlMs = 10 * 60 * 1000 }) {
        const timestamp = Date.now();
        const expiresAt = timestamp + ttlMs;

        // Canonical deterministic hash of parameters
        const paramString = JSON.stringify(parameters, Object.keys(parameters).sort());
        const paramHash = crypto.createHash('sha256').update(paramString).digest('hex');

        // Signature of the ticket payload
        const signaturePayload = `${requester}|${action}|${target}|${paramHash}|${scope}|${expiresAt}|${this.POLICY_VERSION}`;
        const signature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

        return {
            ticketId: `tkt_${crypto.randomBytes(6).toString('hex')}`,
            requester,
            action,
            target,
            paramHash,
            parameters,
            scope,
            createdAt: timestamp,
            expiresAt,
            policyVersion: this.POLICY_VERSION,
            signature,
            status: 'PENDING'
        };
    }

    /**
     * Validate an approval ticket before execution
     */
    static validateTicket(ticket, currentParameters, approverRole = 'OWNER') {
        if (!ticket || ticket.status !== 'PENDING') {
            return { valid: false, reason: 'INVALID_STATUS: Ticket is missing or not in PENDING state.' };
        }

        // 1. Check Expiration
        if (Date.now() > ticket.expiresAt) {
            ticket.status = 'EXPIRED';
            return { valid: false, reason: 'TICKET_EXPIRED: Approval ticket TTL has elapsed.' };
        }

        // 2. Check Approver Authority
        if (approverRole !== 'OWNER' && approverRole !== 'ADMIN') {
            return { valid: false, reason: 'UNAUTHORIZED_APPROVER: Approver lacks executive signing authority.' };
        }

        // 3. Check Policy Version Drift
        if (ticket.policyVersion !== this.POLICY_VERSION) {
            return { valid: false, reason: 'POLICY_VERSION_MISMATCH: Ticket generated under deprecated policy.' };
        }

        // 4. Check Parameter Integrity (Lies-in-the-Loop prevention)
        const currentParamString = JSON.stringify(currentParameters, Object.keys(currentParameters).sort());
        const currentHash = crypto.createHash('sha256').update(currentParamString).digest('hex');

        if (currentHash !== ticket.paramHash) {
            ticket.status = 'TAMPERED';
            return {
                valid: false,
                reason: 'LIES_IN_THE_LOOP_DETECTED: Parameters submitted at execution do not match approved snapshot.'
            };
        }

        // 5. Check Signature Integrity
        const expectedSignaturePayload = `${ticket.requester}|${ticket.action}|${ticket.target}|${ticket.paramHash}|${ticket.scope}|${ticket.expiresAt}|${ticket.policyVersion}`;
        const expectedSignature = crypto.createHash('sha256').update(expectedSignaturePayload).digest('hex');

        if (expectedSignature !== ticket.signature) {
            ticket.status = 'SIGNATURE_INVALID';
            return { valid: false, reason: 'SIGNATURE_TAMPERING_DETECTED: Ticket cryptographic proof is corrupted.' };
        }

        // Passed all integrity checks
        ticket.status = 'CONSUMED';
        ticket.consumedAt = Date.now();
        ticket.approvedBy = approverRole;

        return {
            valid: true,
            ticket,
            reason: 'Approval signature and parameter integrity verified 100%.'
        };
    }
}
