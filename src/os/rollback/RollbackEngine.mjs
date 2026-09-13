/**
 * RollbackEngine.mjs
 * 
 * Transactional snapshot and rollback manager.
 * Classifies actions by reversibility and executes state restores or compensating actions:
 * ACTION -> SNAPSHOT -> EXECUTE -> VERIFY -> ROLLBACK IF NEEDED
 */

export class RollbackEngine {
    static REVERSIBILITY = {
        FULL: 'FULL',               // Draft creation, config update, database record
        COMPENSATING: 'COMPENSATING', // Outbound message sent (requires retraction note)
        DEPENDENT: 'DEPENDENT',       // External payment gateway (requires refund / reversal)
        IRREVERSIBLE: 'IRREVERSIBLE' // Hard purge
    };

    constructor() {
        this.snapshots = new Map(); // snapshotId -> { actionType, stateBefore, timestamp }
    }

    /**
     * Create snapshot before executing a mutation
     */
    createSnapshot({ actionType, entityId, stateBefore }) {
        const snapshotId = `snp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const record = {
            snapshotId,
            actionType,
            entityId,
            stateBefore: JSON.parse(JSON.stringify(stateBefore || {})),
            createdAt: Date.now(),
            reversibility: this._getReversibility(actionType)
        };

        this.snapshots.set(snapshotId, record);
        return record;
    }

    /**
     * Execute rollback based on snapshot
     */
    async rollback(snapshotId, restoreExecutor) {
        const snap = this.snapshots.get(snapshotId);
        if (!snap) {
            return { success: false, reason: 'SNAPSHOT_NOT_FOUND' };
        }

        try {
            if (snap.reversibility === this.constructor.REVERSIBILITY.FULL) {
                if (restoreExecutor) {
                    await restoreExecutor(snap.entityId, snap.stateBefore);
                }
                snap.rolledBackAt = Date.now();
                return {
                    success: true,
                    snapshotId,
                    restoredState: snap.stateBefore,
                    action: 'FULL_STATE_RESTORED'
                };
            }

            if (snap.reversibility === this.constructor.REVERSIBILITY.COMPENSATING) {
                return {
                    success: true,
                    snapshotId,
                    action: 'COMPENSATING_ACTION_REQUIRED',
                    note: 'Pesan sudah terlanjur terkirim. Kirim pesan koreksi / klarifikasi kepada penerima.'
                };
            }

            return {
                success: false,
                reason: `IRREVERSIBLE_ACTION: Action type ${snap.actionType} cannot be cleanly restored automatically.`
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    _getReversibility(actionType) {
        if (actionType.startsWith('order.createDraft') || actionType.startsWith('product.changePrice') || actionType.startsWith('config.')) {
            return this.constructor.REVERSIBILITY.FULL;
        }
        if (actionType.startsWith('message.send') || actionType.startsWith('message.broadcast')) {
            return this.constructor.REVERSIBILITY.COMPENSATING;
        }
        if (actionType.startsWith('payment.')) {
            return this.constructor.REVERSIBILITY.DEPENDENT;
        }
        return this.constructor.REVERSIBILITY.FULL;
    }
}
