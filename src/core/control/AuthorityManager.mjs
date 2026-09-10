// src/core/control/AuthorityManager.mjs
// Role-Based Access Control (RBAC) ensuring only authorized identities can invoke system actions

export const ROLES = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    TRUSTED: 'TRUSTED',
    USER: 'USER',
    GUEST: 'GUEST'
};

export class AuthorityManager {
    static OWNER_LID = '236322690191595@lid';
    static OWNER_PHONE = '6285600596826';
    static ADMINS = new Set([
        '236322690191595@lid',
        '6285600596826@s.whatsapp.net'
    ]);
    static TRUSTED = new Set();

    // Classification of Operational Commands
    static READ_COMMANDS = Object.freeze(new Set([
        'STATUS', 'INFO', 'HEALTH', 'DOCTOR', 'DIAGNOSTICS', 'VERSION',
        'QUEUE', 'JOBS', 'MEMORY', 'RAM', 'CPU', 'STORAGE', 'LOGS', 'EVENTS',
        'CONNECTIONS', 'PROVIDERS', 'MODELS', 'TOOLS', 'UPTIME', 'GOALS',
        'OPEN_LOOPS', 'HELP', 'MENU', 'CAPABILITIES', 'LAST_ERROR'
    ]));

    static MUTATING_COMMANDS = Object.freeze(new Set([
        'RESTART', 'REBOOT', 'SHUTDOWN', 'MATIKAN', 'PAUSE', 'PAUSE_AUTOMATION',
        'RESUME', 'RESUME_AUTOMATION', 'SAFE_MODE_ON', 'SAFE_MODE_OFF',
        'SAFE_MODE', 'NORMAL_MODE', 'RELOAD', 'CONFIG', 'BACKUP', 'RESTORE',
        'UPDATE', 'MAINTENANCE', 'SLEEP', 'WAKE', 'RESET_MEMORY'
    ]));

    /**
     * Strictly verifies if the sender is the authenticated Owner.
     * PRINSIP: Message Location != Permission.
     * Rejects: display names, contact names, user text claims, forwarded messages,
     * quoted messages, group admin roles, and prompt injections.
     * @param {string} senderId - Pure WhatsApp JID or LID from Baileys envelope
     * @param {Object} [metadata={}]
     * @returns {boolean}
     */
    static isTrustedOwner(senderId, metadata = {}) {
        if (!senderId || typeof senderId !== 'string') return false;

        // 1. Anti-Spoofing: Forwarded messages NEVER grant authority
        if (metadata.isForwarded === true) return false;

        // 2. Anti-Spoofing: Quoted message author NEVER grants authority to current sender
        if (metadata.isQuotedSpoof === true) return false;

        const clean = senderId.trim().toLowerCase();
        const digits = clean.replace(/\D/g, '');

        // Verify strictly against trusted hardware identity
        const isOwnerLid = clean === this.OWNER_LID.toLowerCase() || clean.includes('236322690191595');
        const isOwnerPhone = digits.length >= 10 && digits === this.OWNER_PHONE;

        return Boolean(isOwnerLid || isOwnerPhone);
    }

    /**
     * Resolves the authority role for a given sender / chat
     * @param {string} senderId - WhatsApp JID or LID
     * @param {Object} options
     * @returns {string} One of ROLES
     */
    static getRole(senderId, options = {}) {
        if (!senderId) return ROLES.GUEST;
        
        if (this.isTrustedOwner(senderId, options)) {
            return ROLES.OWNER;
        }

        const clean = String(senderId).trim();
        const digits = clean.replace(/\D/g, '');

        if (this.ADMINS.has(clean) || (digits && Array.from(this.ADMINS).some(a => a.replace(/\D/g, '') === digits))) {
            return ROLES.ADMIN;
        }

        if (this.TRUSTED.has(clean) || options.isWhitelisted) {
            return ROLES.TRUSTED;
        }

        return ROLES.USER;
    }

    /**
     * Checks if sender has permission to execute a specific system command
     * @param {string} senderId
     * @param {string} commandName
     * @param {Object} [metadata={}]
     * @returns {boolean}
     */
    static canExecute(senderId, commandName, metadata = {}) {
        const canonicalCmd = String(commandName || '').toUpperCase().trim();
        const isOwner = this.isTrustedOwner(senderId, metadata);

        // Mutating commands are strictly OWNER-ONLY anywhere
        if (this.MUTATING_COMMANDS.has(canonicalCmd)) {
            return isOwner;
        }

        // Owner has universal authority
        if (isOwner) return true;

        // Public commands allowed for everyone
        const publicCommands = new Set(['CAPABILITIES', 'HELP', 'MENU', 'GOALS', 'OPEN_LOOPS']);
        if (publicCommands.has(canonicalCmd)) {
            return true;
        }

        // Admin role permissions for read telemetry
        const role = this.getRole(senderId, metadata);
        if (role === ROLES.ADMIN) {
            return this.READ_COMMANDS.has(canonicalCmd);
        }

        return false;
    }
}
