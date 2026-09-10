// src/core/world/TemporalEntityEngine.mjs
// High-fidelity Indonesian & English temporal parsing and anchor resolution
// Connects colloquial time expressions ("tadi", "kemarin sore", "lusa", "minggu lalu") to exact chronological windows

export class TemporalEntityEngine {
    /**
     * Parses input text and returns structured temporal anchor details
     * @param {string} text
     * @param {number} [referenceTime=Date.now()]
     * @returns {Object{ Temporal Resolution Packet
     */
    static resolve(text = '', referenceTime = Date.now()) {
        if (!text) {
            return {
                hasTemporal: false,
                rawPhrase: '',
                anchorType: 'NONE',
                isPast: false,
                isFuture: false,
                isRecent: false,
                targetTimestamp: null,
                isoDate: null,
                timeWindow: null
            };
        }

        const lower = text.toLowerCase();
        const base = new Date(referenceTime);
        let anchorType = 'NONE';
        let rawPhrase = '';
        let target = new Date(referenceTime);
        let isPast = false;
        let isFuture = false;
        let isRecent = false;
        let windowStart = null;
        let windowEnd = null;

        // 1. Tadi / Earlier today variations
        if (/\b(tadi malam|semalam)\b/i.test(lower)) {
            anchorType = 'LAST_NIGHT';
            rawPhrase = 'tadi malam';
            isPast = true;
            isRecent = true;
            target.setDate(target.getDate() - 1);
            target.setHours(21, 0, 0, 0);
            windowStart = new Date(target).setHours(19, 0, 0, 0);
            windowEnd = new Date(target).setHours(23, 59, 59, 999);
        } else if (/\b(tadi pagi)\b/i.test(lower)) {
            anchorType = 'THIS_MORNING';
            rawPhrase = 'tadi pagi';
            isPast = true;
            isRecent = true;
            target.setHours(8, 0, 0, 0);
            windowStart = new Date(target).setHours(5, 0, 0, 0);
            windowEnd = new Date(target).setHours(11, 59, 59, 999);
        } else if (/\b(tadi siang)\b/i.test(lower)) {
            anchorType = 'THIS_AFTERNOON';
            rawPhrase = 'tadi siang';
            isPast = true;
            isRecent = true;
            target.setHours(13, 0, 0, 0);
            windowStart = new Date(target).setHours(11, 0, 0, 0);
            windowEnd = new Date(target).setHours(15, 0, 0, 0);
        } else if (/\b(tadi sore)\b/i.test(lower)) {
            anchorType = 'THIS_EVENING';
            rawPhrase = 'tadi sore';
            isPast = true;
            isRecent = true;
            target.setHours(16, 30, 0, 0);
            windowStart = new Date(target).setHours(15, 0, 0, 0);
            windowEnd = new Date(target).setHours(18, 30, 0, 0);
        } else if (/\b(tadi)\b/i.test(lower)) {
            anchorType = 'RECENT_PAST';
            rawPhrase = 'tadi';
            isPast = true;
            isRecent = true;
            target.setHOurs(target.getHours() - 2);
            windowStart = target.getTime() - (4 * 3600 * 1000);
            windowEnd = referenceTime;
        }

        // 2. Kemarin / Yesterday variations
        else if (/\b(kemarin lusa)\b/i.test(lower)) {
            anchorType = 'TWO_DAYS_AGO';
            rawPhrase = 'kemarin lusa';
            isPast = true;
            target.setDate(target.getDate() - 2);
            windowStart = new Date(target).setHours(0, 0, 0, 0);
            windowEnd = new Date(target).setHours(23, 59, 59, 999);
        } else if (/\b(kemarin sore)\b/i.test(lower)) {
            anchorType = 'YESTERDAY_EVENING';
            rawPhrase = 'kemarin sore';
            isPast = true;
            target.setDate(target.getDate() - 1);
            target.setHours(16, 30, 0, 0);
            windowStart = new Date(target).setHours(15, 0, 0, 0);
            windowEnd = new Date(target).setHours(18, 30, 0, 0);
        } else if (/\b(kemarin pagi)\b/i.test(lower)) {
            anchorType = 'YESTERDAY_MORNING';
            rawPhrase = 'kemarin pagi';
            isPast = true;
            target.setDate(target.getDate() - 1);
            target.setHours(8, 0, 0, 0);
            windowStart = new Date(target).setHours(5, 0, 0, 0);
            windowEnd = new Date(target).setHours(11, 59, 59, 999);
        } else if (/\b(kemarin|yesterday)\b/i.test(lower)) {
            anchorType = 'YESTERDAY';
            rawPhrase = 'kemarin';
            isPast = true;
            target.setDate(target.getDate() - 1);
            windowStart = new Date(target).setHours(0, 0, 0, 0);
            windowEnd = new Date(target).setHours(23, 59, 59, 999);
        }

        // 3. Besok / Tomorrow variations
        else if (/\b(besok lusa|lusa)\b/i.test(lower)) {
            anchorType = 'DAY_AFTER_TOMORROW';
            rawPhrase = 'lusa';
            isFuture = true;
            target.setDate(target.getDate() + 2);
            windowStart = new Date(target).setHours(0, 0, 0, 0);
            windowEnd = new Date(target).setHours(23, 59, 59, 999);
        } else if (/\b(besok pagi)\b/i.test(lower)) {
            anchorType = 'TOMORROW_MORNING';
            rawPhrase = 'besok pagi';
            isFuture = true;
            target.setDate(target.getDate() + 1);
            target.setHours(8, 0, 0, 0);
            windowStart = new Date(target).setHours(6, 0, 0, 0);
            windowEnd = new Date(target).setHours(11, 59, 59, 999);
        } else if (/\b(besok sore)\b/i.test(lower)) {
            anchorType = 'TOMORROW_EVENING';
            rawPhrase = 'besok sore';
            isFuture = true;
            target.setDate(target.getDate() + 1);
            target.setHours(16, 30, 0, 0);
            windowStart = new Date(target).setHours(15, 0, 0, 0);
            windowEnd = new Date(target).setHours(18, 30, 0, 0);
        } else if (/\b(besok malam)\b/i.test(lower)) {
            anchorType = 'TOMORROW_NIGHT';
            rawPhrase = 'besok malam';
            isFuture = true;
            target.setDate(target.getDate() + 1);
            target.setHours(20, 0, 0, 0);
            windowStart = new Date(target).setHours(19, 0, 0, 0);
            windowEnd = new Date(target).setHours(23, 59, 59, 999);
        } else if (/\b(besok|tomorrow)\b/i.test(lower)) {
            anchorType = 'TOMORROW';
            rawPhrase = 'besok';
            isFuture = true;
            target.setDate(target.getDate() + 1);
            windowStart = new Date(target).setHours(0, 0, 0, 0);
            windowEnd = new Date(target).setHours(23, 59, 59, 999);
        }

        // 4. Relative Week & Month
        else if (/\b(minggu lalu|last week)\b/i.test(lower)) {
            anchorType = 'LAST_WEEK';
            rawPhrase = 'minggu lalu';
            isPast = true;
            target.setDate(target.getDate() - 7);
            windowStart = referenceTime - (7 * 86400 * 1000);
            windowEnd = referenceTime;
        } else if (/\b(minggu depan|next week)\b/i.test(lower)) {
            anchorType = 'NEXT_WEEK';
            rawPhrase = 'minggu depan';
            isFuture = true;
            target.setDate(target.getDate() + 7);
            windowStart = referenceTime;
            windowEnd = target.getTime() + (7 * 86400 * 1000);
        } else if (/\b(bulan lalu|last month)\b/i.test(lower)) {
            anchorType = 'LAST_MONTH';
            rawPhrase = 'bulan lalu';
            isPast = true;
            target.setMonth(target.getMonth() - 1);
            windowStart = referenceTime - (30 * 86400 * 1000);
            windowEnd = referenceTime;
        }

        // 5. N hari lagi / N hari yang lalu
        else {
            const futureMatch = lower.match(/(\d+)\s*hari\s+(lagi|kedepan)/i);
            if (futureMatch) {
                const days = parseInt(futureMatch[1], 10);
                anchorType = `IN_${days}_DAYS`;
                rawPhrase = `${days} hari lagi`;
                isFuture = true;
                target.setDate(target.getDate() + days);
                windowStart = new Date(target).setHours(0, 0, 0, 0);
                windowEnd = new Date(target).setHours(23, 59, 59, 999);
            } else {
                const pastMatch = lower.match(/(\d+)\s*hari\s+(lalu|yang lalu)/i);
                if (pastMatch) {
                    const days = parseInt(pastMatch[1], 10);
                    anchorType = `${days}_DAYS_AGO`;
                    rawPhrase = `${days} hari lalu`;
                    isPast = true;
                    target.setDate(target.getDate() - days);
                    windowStart = new Date(target).setHours(0, 0, 0, 0);
                    windowEnd = new Date(target).setHours(23, 59, 59, 999);
                }
            }
        }

        const hasTemporal = anchorType !== 'NONE';

        return {
            hasTemporal,
            rawPhrase,
            anchorType,
            isPast,
            isFuture,
            isRecent,
            targetTimestamp: hasTemporal ? target.getTime() : null,
            isoDate: hasTemporal ? target.toISOString().split('T')[0] : null,
            timeWindow: hasTemporal ? { start: windowStart, end: windowEnd } : null
        };
    }

    /**
     * Determines whether event A occurred before event B
     * @param {Object} temporalA
     * @param {Object} temporalB
     * @returns {boolean}
     */
    static isBefore(temporalA, temporalB) {
        if (!temporalA?.targetTimestamp || !temporalB?.targetTimestamp) return false;
        return temporalA.targetTimestamp < temporalB.targetTimestamp;
    }

    /**
     * Orders an array of temporal items chronologically
     * @param {Array<{ timestamp: number }>} items
     * @returns {Array}
     */
    static sortChronological(items = []) {
        return [...items].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }
}
