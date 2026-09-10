// src/core/tools/ToolExecutor.mjs
// Deterministic and secure tool execution engine for calculation, date/time, and system status

export { ToolCapabilityFabric, ToolContract, RiskTier, ToolCategory } from './ToolCapabilityFabric.mjs';

export class ToolExecutor {
    /**
     * Executes requested tool safely
     * @param {string} toolName
     * @param {Object} [params={}]
     * @returns {Object} { success: boolean, result: any, error?: string }
     */
    static execute(toolName, params = {}) {
        switch (toolName) {
            case 'CALCULATOR':
                return this.calculate(params.expression);
            case 'DATE_TIME':
                return this.getDateTime(params.timezone);
            case 'SYSTEM_INFO':
                return this.getSystemInfo();
            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    }

    /**
     * Safe arithmetic evaluation (strictly math tokens only)
     * @param {string} expr
     * @returns {Object}
     */
    static calculate(expr = '') {
        if (!expr || typeof expr !== 'string') {
            return { success: false, error: 'Empty expression' };
        }

        // Sanitize: allow ONLY digits, operators, parens, decimal, spaces
        const sanitized = expr.replace(/x/gi, '*').replace(/÷/g, '/').replace(/[^0-9+\-*\/().%\s]/g, '');
        if (!sanitized.trim()) {
            return { success: false, error: 'Invalid math characters' };
        }

        try {
            const val = Function(`"use strict"; return (${sanitized});`)();
            if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
                return { success: false, error: 'Calculation resulted in non-finite value' };
            }
            return { success: true, result: val, expression: sanitized };
        } catch (e) {
            return { success: false, error: 'Failed to evaluate expression' };
        }
    }

    /**
     * Retrieves current Indonesian date and time
     * @param {string} [tz='Asia/Jakarta']
     * @returns {Object}
     */
    static getDateTime(tz = 'Asia/Jakarta') {
        const now = new Date();
        const formatted = now.toLocaleString('id-ID', {
            timeZone: tz,
            dateStyle: 'full',
            timeStyle: 'medium'
        });
        return {
            success: true,
            iso: now.toISOString(),
            formattedWIB: formatted,
            timestamp: now.getTime()
        };
    }

    /**
     * Retrieves runtime memory and environment stats
     * @returns {Object}
     */
    static getSystemInfo() {
        const mem = process.memoryUsage();
        return {
            success: true,
            nodeVersion: process.version,
            platform: process.platform,
            uptimeSeconds: Math.floor(process.uptime()),
            heapUsedMB: Number((mem.heapUsed / 1024 / 1024).toFixed(1)),
            rssMB: Number((mem.rss / 1024 / 1024).toFixed(1))
        };
    }
}
