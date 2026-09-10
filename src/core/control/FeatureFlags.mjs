// src/core/control/FeatureFlags.mjs
// Central runtime feature toggles for safe migrations, experiments, and safe-mode degradation

export class FeatureFlags {
    static flags = {
        safeMode: false,
        systemControl: true,
        persistFirstIngress: true,
        behavioralOrchestrator: false, // Phase 2
        behavioralMemory: false,       // Phase 3
        socialCalibration: false,      // Phase 4
        advancedHumor: true,
        webSearch: true,
        voiceTranscription: true,
        visionInspection: true,
        salesExecutionOS: true
    };

    static isEnabled(flagName) {
        if (this.flags.safeMode) {
            // In safe mode, non-essential heavy features are disabled
            const safeModeAllowed = new Set([
                'systemControl',
                'persistFirstIngress',
                'webSearch'
            ]);
            if (!safeModeAllowed.has(flagName)) return false;
        }
        return Boolean(this.flags[flagName]);
    }

    static setFlag(flagName, value) {
        if (flagName in this.flags) {
            this.flags[flagName] = Boolean(value);
            console.log(`[FeatureFlags] 🚩 Flag "${flagName}" updated to: ${this.flags[flagName]}`);
            return true;
        }
        return false;
    }

    static enableSafeMode() {
        this.flags.safeMode = true;
        console.warn('[FeatureFlags] 🛡️ SAFE MODE ENGAGED. Heavy & experimental subsystems paused.');
    }

    static disableSafeMode() {
        this.flags.safeMode = false;
        console.log('[FeatureFlags] 🛡️ SAFE MODE DISENGAGED. All standard subsystems operational.');
    }

    static getAll() {
        return { ...this.flags };
    }
}
