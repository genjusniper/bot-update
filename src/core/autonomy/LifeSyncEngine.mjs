// src/core/autonomy/LifeSyncEngine.mjs
// Daily routine and quiet hours monitor authentic to Mas Agus's operational rhythm

export class LifeSyncEngine {
    static ROUTINE_PHASES = Object.freeze({
        DEEP_FOCUS_WORK: 'DEEP_FOCUS_WORK',   // 09:00 - 18:00 WIB
        EVENING_CHILL: 'EVENING_CHILL',       // 18:00 - 23:00 WIB
        LATE_NIGHT_CODING: 'LATE_NIGHT_CODING', // 23:00 - 01:00 WIB
        QUIET_HOURS: 'QUIET_HOURS'            // 01:00 - 07:00 WIB
    });

    /**
     * Determines current phase based on WIB hour
     * @param {Date|number} [dateOrTimestamp=new Date()]
     * @returns {{ phase: string, allowsNonUrgentAlerts: boolean, wibHour: number }}
     */
    static evaluateCurrentPhase(dateOrTimestamp = new Date()) {
        const d = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
        
        // Convert to WIB (UTC+7)
        const utcHour = d.getUTCHours();
        const wibHour = (utcHour + 7) % 24;

        if (wibHour >= 1 && wibHour < 7) {
            return {
                phase: this.ROUTINE_PHASES.QUIET_HOURS,
                allowsNonUrgentAlerts: false,
                wibHour
            };
        }

        if (wibHour >= 9 && wibHour < 18) {
            return {
                phase: this.ROUTINE_PHASES.DEEP_FOCUS_WORK,
                allowsNonUrgentAlerts: true,
                wibHour
            };
        }

        if (wibHour >= 18 && wibHour < 23) {
            return {
                phase: this.ROUTINE_PHASES.EVENING_CHILL,
                allowsNonUrgentAlerts: true,
                wibHour
            };
        }

        return {
            phase: this.ROUTINE_PHASES.LATE_NIGHT_CODING,
            allowsNonUrgentAlerts: true,
            wibHour
        };
    }
}
