/**
 * AgentIdentityEngine.mjs
 * 
 * Enterprise Agent Identity & Attestation Engine.
 * Answers "WHO performed this action?" with immutable cryptographic identity:
 * agent_id, tenant_id, role, permissions, version, tool_scope, trust_level
 */

import crypto from 'crypto';

export class AgentIdentityEngine {
    static AGENT_VERSION = '2.5.0-agentic';

    /**
     * Issue an attested agent execution passport
     */
    static issuePassport({ tenantId = 'default', role = 'AI_OPERATOR', toolScope = [] }) {
        const timestamp = Date.now();
        const agentId = `agt_${role.toLowerCase()}_${crypto.randomBytes(4).toString('hex')}`;

        const payload = `${agentId}|${tenantId}|${role}|${toolScope.sort().join(',')}|${this.AGENT_VERSION}|${timestamp}`;
        const attestationHash = crypto.createHash('sha256').update(payload).digest('hex');

        return {
            agentId,
            tenantId,
            role,
            version: this.AGENT_VERSION,
            toolScope,
            issuedAt: timestamp,
            attestationHash,
            trustLevel: role === 'AI_RESEARCHER' ? 90 : (role === 'AI_ANALYST' ? 85 : 80)
        };
    }

    /**
     * Verify identity attestation
     */
    static verifyPassport(passport) {
        if (!passport || !passport.agentId || !passport.attestationHash) {
            return false;
        }

        const expectedPayload = `${passport.agentId}|${passport.tenantId}|${passport.role}|${passport.toolScope.sort().join(',')}|${passport.version}|${passport.issuedAt}`;
        const expectedHash = crypto.createHash('sha256').update(expectedPayload).digest('hex');

        return expectedHash === passport.attestationHash;
    }
}
