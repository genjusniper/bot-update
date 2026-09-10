// src/core/reasoning/CognitivePlanner.mjs
// Multi-step task decomposition and cognitive plan generator

export class CognitivePlanner {
    /**
     * Determines whether an incoming prompt is a multi-step objective and generates an execution plan
     * @param {string} text - User command or question
     * @returns {{ isMultiStep: boolean, goal: string, steps: Object[], priority: string }}
     */
    static plan(text = '') {
        if (!text) return { isMultiStep: false, goal: '', steps: [], priority: 'NORMAL' };

        const lower = text.toLowerCase().trim();
        const steps = [];

        // Check for sequential markers or composite commands ("dan", "terus", "lalu", "habis itu", "kalau perlu")
        const hasSequentialConnectors = /\b(lalu|kemudian|terus|habis itu|setelah itu|sekaligus|dan juga)\b/i.test(lower);
        const hasConditional = /\b(kalo|kalau|jika)\s+(perlu|error|gagal|bisa)\b/i.test(lower);

        if (hasSequentialConnectors || hasConditional || lower.includes('step') || lower.includes('langkah')) {
            // Split into distinct candidate actions
            const rawParts = lower.split(/\b(lalu|kemudian|terus|habis itu|setelah itu|dan juga)\b/i)
                .map(p => p.trim())
                .filter(p => p.length > 3 && !/^(lalu|kemudian|terus|habis itu|setelah itu|dan juga)$/i.test(p));

            rawParts.forEach((part, idx) => {
                let toolNeeded = null;
                if (/(cek|status|monitoring|lihat)/i.test(part)) toolNeeded = 'SYSTEM_STATUS';
                else if (/(restart|reboot|matiin|nyalain)/i.test(part)) toolNeeded = 'DAEMON_CONTROL';
                else if (/(cari|googling|search|berita)/i.test(part)) toolNeeded = 'WEB_SEARCH';
                else if (/(hitung|kalkulasi)/i.test(part)) toolNeeded = 'CALCULATOR';

                steps.push({
                    stepNumber: idx + 1,
                    instruction: part,
                    toolNeeded,
                    status: 'PENDING'
                });
            });

            return {
                isMultiStep: steps.length > 1,
                goal: text,
                steps,
                priority: /urgent|penting|cepat|sekarang|darurat/i.test(lower) ? 'HIGH' : 'NORMAL'
            };
        }

        // Single atomic task
        return {
            isMultiStep: false,
            goal: text,
            steps: [{
                stepNumber: 1,
                instruction: text,
                toolNeeded: null,
                status: 'PENDING'
            }],
            priority: 'NORMAL'
        };
    }
}
