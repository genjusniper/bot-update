// src/core/sync/MultiChannelSyncEngine.mjs
// Multi-Channel Memory Sync Engine
// Synchronizes facts across WhatsApp 1-on-1, Group chats, Web Cockpit, and Terminal CLI with strict boundary enforcement

export const ChannelType = Object.freeze({
    WHATSAPP_1ON1: 'WHATSAPP_1ON1',
    WHATSAPP_GROUP: 'WHATSAPP_GROUP',
    WEB_COCKPIT: 'WEB_COCKPIT',
    TERMINAL_CLI: 'TERMINAL_CLI'
});

export const SyncScope = Object.freeze({
    PRIVATE_USER: 'PRIVATE_USER',       // Synced between 1-on-1 WhatsApp, Cockpit, and CLI for the same user
    GROUP_LOCAL: 'GROUP_LOCAL',         // Confined strictly to the originating group JID
    GLOBAL_SYSTEM: 'GLOBAL_SYSTEM'      // System health, configurations, universal facts
});

export class MultiChannelSyncEngine {
    constructor() {
        // Map: compositeKey -> { key, value, scope, userId, groupJid, originatingChannel, seq, updatedAt }
        this.facts = new Map();
        this.globalSequence = 0;
    }

    /**
     * Records a fact from a specific channel with strict scoping
     * @param {Object} param
     * @param {string} param.key
     * @param {any} param.value
     * @param {string} param.channel ChannelType
     * @param {string} [param.scope=SyncScope.PRIVATE_USER]
     * @param {string} [param.userId]
     * @param {string} [param.groupJid]
     * @returns {Object} Stored record with sequence
     */
    recordChannelFact({ key, value, channel, scope = SyncScope.PRIVATE_USER, userId = 'owner', groupJid = null }) {
        if (!key || value === undefined) {
            throw new Error('Fact requires key and value');
        }

        const normKey = String(key).toLowerCase().trim();
        let compositeKey = '';

        if (scope === SyncScope.GLOBAL_SYSTEM) {
            compositeKey = `global::${normKey}`;
        } else if (scope === SyncScope.GROUP_LOCAL) {
            if (!groupJid) throw new Error('GROUP_LOCAL scope requires groupJid');
            compositeKey = `group::${groupJid}::${normKey}`;
        } else {
            // PRIVATE_USER default
            compositeKey = `user::${userId}::${normKey}`;
        }

        this.globalSequence++;
        const record = {
            compositeKey,
            key: normKey,
            value,
            channel,
            scope,
            userId,
            groupJid,
            seq: this.globalSequence,
            updatedAt: Date.now()
        };

        this.facts.set(compositeKey, record);
        return record;
    }

    /**
     * Resolves a fact for a specific query channel, enforcing privacy boundary guarantees
     * @param {Object} param
     * @param {string} param.key
     * @param {string} param.channel ChannelType
     * @param {string} [param.userId='owner']
     * @param {string} [param.groupJid=null]
     * @returns {{ allowed: boolean, value?: any, record?: Object, reason?: string }}
     */
    resolveFactForChannel({ key, channel, userId = 'owner', groupJid = null }) {
        const normKey = String(key).toLowerCase().trim();

        // 1. Check Global System Scope (Permitted across all channels)
        const globalKey = `global::${normKey}`;
        if (this.facts.has(globalKey)) {
            const rec = this.facts.get(globalKey);
            return { allowed: true, value: rec.value, record: rec };
        }

        // 2. If requesting from a GROUP channel
        if (channel === ChannelType.WHATSAPP_GROUP) {
            if (groupJid) {
                const groupKey = `group::${groupJid}::${normKey}`;
                if (this.facts.has(groupKey)) {
                    const rec = this.facts.get(groupKey);
                    return { allowed: true, value: rec.value, record: rec };
                }
            }

            // Group chat is strictly FORBIDDEN from accessing private user facts!
            const userKey = `user::${userId}::${normKey}`;
            if (this.facts.has(userKey)) {
                return {
                    allowed: false,
                    reason: 'PRIVACY_ISOLATION: Private user fact cannot be leaked to group chat'
                };
            }

            return { allowed: false, reason: 'NOT_FOUND' };
        }

        // 3. If requesting from 1-on-1 WhatsApp, Web Cockpit, or CLI (Authorized user channels)
        const userKey = `user::${userId}::${normKey}`;
        if (this.facts.has(userKey)) {
            const rec = this.facts.get(userKey);
            return { allowed: true, value: rec.value, record: rec };
        }

        // 4. Authorized channels can also optionally query group context if groupJid is supplied
        if (groupJid) {
            const groupKey = `group::${groupJid}::${normKey}`;
            if (this.facts.has(groupKey)) {
                const rec = this.facts.get(groupKey);
                return { allowed: true, value: rec.value, record: rec };
            }
        }

        return { allowed: false, reason: 'NOT_FOUND' };
    }

    /**
     * Synchronizes changed facts since a given sequence number for an authorized channel
     * @param {string} targetChannel 
     * @param {Object} options 
     * @param {number} [options.sinceSeq=0]
     * @param {string} [options.userId='owner']
     * @returns {Array<Object>} Delta updates
     */
    syncChanges(targetChannel, options = {}) {
        const sinceSeq = options.sinceSeq || 0;
        const userId = options.userId || 'owner';
        const deltas = [];

        for (const [_, rec] of this.facts) {
            if (rec.seq > sinceSeq) {
                // Group channel only receives global or its own group facts
                if (targetChannel === ChannelType.WHATSAPP_GROUP) {
                    if (rec.scope === SyncScope.GLOBAL_SYSTEM || (rec.scope === SyncScope.GROUP_LOCAL && rec.groupJid === options.groupJid)) {
                        deltas.push(rec);
                    }
                } else {
                    // 1-on-1, Cockpit, or CLI receives global and private user facts
                    if (rec.scope === SyncScope.GLOBAL_SYSTEM || (rec.scope === SyncScope.PRIVATE_USER && rec.userId === userId)) {
                        deltas.push(rec);
                    }
                }
            }
        }

        return deltas;
    }

    clear() {
        this.facts.clear();
        this.globalSequence = 0;
    }
}

export const multiChannelSyncEngine = new MultiChannelSyncEngine();
