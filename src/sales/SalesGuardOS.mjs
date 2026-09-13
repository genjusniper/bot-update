// src/sales/SalesGuardOS.mjs
import fs from 'fs/promises';
import path from 'path';

export class SalesGuardOS {
    static CONFIG = {
        OUTBOUND_MODE: 'G3_OBSERVATION', // G3_OBSERVATION mode active
        G2_BUDGET: 0,
        G3_BUDGET: 3, // Maksimal 3 pesan di Fase G3
        KILL_SWITCH: false,
        DAILY_LIMIT: 50,
        APPROVAL_VALIDITY_MS: 300000 // 5 Menit freshness
    };

    static state = {
        dailySentCount: 0,
        lastResetDate: new Date().toDateString()
    };

    static activateKillSwitch() {
        this.CONFIG.KILL_SWITCH = true;
    }

    static sanitizePayload(draft) {
        if (!draft) return "";
        let clean = draft.replace(/THOUGHT:[\s\S]*?(?=\n\n|$)/ig, '');
        clean = clean.replace(/\[Score:.*?\]/ig, '');
        clean = clean.replace(/<INTERNAL>.*?<\/INTERNAL>/ig, '');
        return clean.trim();
    }

    static canSend(job) {
        if (this.CONFIG.KILL_SWITCH) return { allowed: false, reason: 'KILL_SWITCH_ACTIVE' };
        
        if (this.CONFIG.OUTBOUND_MODE === 'DRY_RUN') {
            return { allowed: false, reason: 'OUTBOUND_MODE_IS_DRY_RUN' };
        }
        if (this.CONFIG.OUTBOUND_MODE === 'G2_SINGLE_CANARY' && this.CONFIG.G2_BUDGET <= 0) {
            return { allowed: false, reason: 'G2_CANARY_BUDGET_EXHAUSTED' };
        }
        if (this.CONFIG.OUTBOUND_MODE === 'G3_OBSERVATION' && this.CONFIG.G3_BUDGET <= 0) {
            return { allowed: false, reason: 'G3_OBSERVATION_BUDGET_EXHAUSTED' };
        }

        if (!job.approvedAt) return { allowed: false, reason: 'MISSING_APPROVAL_TIMESTAMP' };
        const timeSinceApproval = Date.now() - job.approvedAt;
        if (timeSinceApproval > this.CONFIG.APPROVAL_VALIDITY_MS) {
            return { allowed: false, reason: 'APPROVAL_EXPIRED' };
        }
        
        const today = new Date().toDateString();
        if (this.state.lastResetDate !== today) {
            this.state.dailySentCount = 0;
            this.state.lastResetDate = today;
        }
        if (this.state.dailySentCount >= this.CONFIG.DAILY_LIMIT) {
            return { allowed: false, reason: 'DAILY_LIMIT_REACHED' };
        }

        return { allowed: true };
    }

    static recordSent() {
        this.state.dailySentCount++;
        
        if (this.CONFIG.OUTBOUND_MODE === 'G2_SINGLE_CANARY') {
            this.CONFIG.G2_BUDGET -= 1;
            if (this.CONFIG.G2_BUDGET <= 0) this.CONFIG.OUTBOUND_MODE = 'DRY_RUN';
        }
        if (this.CONFIG.OUTBOUND_MODE === 'G3_OBSERVATION') {
            this.CONFIG.G3_BUDGET -= 1;
            if (this.CONFIG.G3_BUDGET <= 0) this.CONFIG.OUTBOUND_MODE = 'DRY_RUN';
        }
    }

    static async logAudit(leadId, phone, action, note) {
        const logFile = path.join(process.cwd(), 'data', 'audit_log.txt');
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] LEAD:${leadId} | PHONE:${phone} | ACTION:${action} | NOTE:${note}\n`;
        try { await fs.appendFile(logFile, logLine); } catch (e) {}
    }
}
