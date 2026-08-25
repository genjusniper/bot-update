// src/security/CapabilityRegistry.mjs
// FIX #10: Missing CapabilityRegistry — used by CapabilityFirewall
export class CapabilityRegistry {
    // Map of chatId -> Set of allowed tool names
    static _permissions = new Map();

    static grantPermission(chatId, toolName) {
        if (!this._permissions.has(chatId)) {
            this._permissions.set(chatId, new Set());
        }
        this._permissions.get(chatId).add(toolName);
    }

    static revokePermission(chatId, toolName) {
        if (this._permissions.has(chatId)) {
            this._permissions.get(chatId).delete(toolName);
        }
    }

    static checkPermission(chatId, toolName) {
        // Admins always have permission (add owner chatId here)
        const OWNERS = (process.env.OWNER_CHAT_IDS || '').split(',').map(s => s.trim());
        if (OWNERS.includes(chatId)) return true;

        // Check per-user permissions
        const perms = this._permissions.get(chatId);
        if (!perms) return false;
        return perms.has(toolName);
    }

    static grantDefaultPermissions(chatId) {
        // Safe defaults: only read tools by default
        ['read_file', 'query_database'].forEach(tool => this.grantPermission(chatId, tool));
    }
}
