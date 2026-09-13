export class SalesGuard {
    constructor(config = { outboundMode: 'DRY_RUN' }) {
        this.config = config;
    }

    authorize(lead, draft, approvalContext) {
        if (!approvalContext || !approvalContext.approvedBy) {
            throw new Error("SalesGuard: Missing explicit human approval context.");
        }

        if (!draft || draft.trim().length === 0) {
            throw new Error("SalesGuard: Draft cannot be empty.");
        }

        // Must enforce DRY_RUN for Phase E
        if (this.config.outboundMode !== 'DRY_RUN') {
            throw new Error("SalesGuard: UNEXPECTED OUTBOUND ATTEMPT DETECTED. Execution halted.");
        }

        return {
            authorized: true,
            mode: this.config.outboundMode,
            guardId: `sg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            authorizedAt: new Date().toISOString()
        };
    }
}
