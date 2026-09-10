// src/core/signals/SignalTelemetry.mjs
// In-memory ring buffer & observability logger for sensory snapshots and conflict resolutions

export class SignalTelemetry {
    static maxHistory = 50;
    static snapshotHistory = [];

    /**
     * Records a fused sensory snapshot
     * @param {Object} snapshot - FusedSensorySnapshot
     */
    static record(snapshot) {
        if (!snapshot) return;
        this.snapshotHistory.unshift({
            id: snapshot.snapshotId,
            timestamp: snapshot.timestamp,
            chatId: snapshot.context?.chatId || '',
            dimensions: snapshot.dimensions,
            conflictResolutions: snapshot.conflictResolutions || [],
            rawSignalsCount: snapshot.rawSignalsCount || 0
        });

        if (this.snapshotHistory.length > this.maxHistory) {
            this.snapshotHistory.pop();
        }
    }

    /**
     * Records an arbitrary operational telemetry signal
     * @param {string} signalName
     * @param {Object} data
     */
    static recordSignal(signalName, data = {}) {
        this.record({
            snapshotId: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            dimensions: { signalName, ...data },
            rawSignalsCount: 1
        });
    }

    /**
     * Gets the last snapshot recorded for a specific chat
     */
    static getLastSnapshot(chatId) {
        return this.snapshotHistory.find(s => s.chatId === chatId) || null;
    }

    /**
     * Returns diagnostic metrics about signal fusion activity
     */
    static getMetrics() {
        const total = this.snapshotHistory.length;
        let conflictCount = 0;
        const ruleOccurrences = {};

        for (const s of this.snapshotHistory) {
            if (s.conflictResolutions && s.conflictResolutions.length > 0) {
                conflictCount++;
                for (const r of s.conflictResolutions) {
                    ruleOccurrences[r.rule] = (ruleOccurrences[r.rule] || 0) + 1;
                }
            }
        }

        return {
            totalSnapshotsRecorded: total,
            snapshotsWithConflictsResolved: conflictCount,
            conflictRuleFrequencies: ruleOccurrences
        };
    }
}
