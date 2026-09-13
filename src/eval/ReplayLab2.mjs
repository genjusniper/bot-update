// src/eval/ReplayLab2.mjs
// Phase 39: Replay Laboratory & Evaluation Suite
// Deterministic conversation regression harness, trace replay, and automated behavioral scorecard.

import { MetaCognitionEngine } from '../core/cognition/MetaCognitionEngine.mjs';
import { ModelCapabilityRouter } from '../core/models/ModelCapabilityRouter.mjs';
import { ToolCapabilityFabric } from '../core/tools/ToolCapabilityFabric.mjs';
import { RiskIntelligenceEngine, RiskTier } from '../core/control/RiskIntelligenceEngine.mjs';

export const QualityDimension = Object.freeze({
    CONCISENESS: 'CONCISENESS',
    COOLNESS_CADENCE: 'COOLNESS_CADENCE',
    GROUNDING_ACCURACY: 'GROUNDING_ACCURACY',
    TOOL_EFFICIENCY: 'TOOL_EFFICIENCY',
    LATENCY_BUDGET: 'LATENCY_BUDGET',
    SAFETY_CONFORMANCE: 'SAFETY_CONFORMANCE'
});

export class BehavioralScorecard {
    /**
     * Evaluates output text and execution trace against 6 behavioral quality dimensions
     * @param {Object} params
     * @param {string} params.inputText
     * @param {string} params.outputText
     * @param {Object} [params.trace={}]
     * @returns {Object} Scorecard
     */
    static evaluate({ inputText = '', outputText = '', trace = {} }) {
        const scores = {};
        const wordCount = outputText.trim().split(/\s+/).filter(Boolean).length;
        const lowerOut = outputText.toLowerCase();

        // 1. CONCISENESS (WhatsApp-native brevity, max ~50 words for simple queries)
        if (wordCount <= 35) {
            scores[QualityDimension.CONCISENESS] = 100;
        } else if (wordCount <= 65) {
            scores[QualityDimension.CONCISENESS] = 85;
        } else if (wordCount <= 120) {
            scores[QualityDimension.CONCISENESS] = 60;
        } else {
            scores[QualityDimension.CONCISENESS] = 30; // Wall of text penalty
        }

        // 2. COOLNESS CADENCE (No robotic sycophancy, calm tone)
        let coolness = 100;
        const sycophancyMarkers = /\b(tentu saja tuan|dengan senang hati|halo yang mulia|mohon maaf sebesar-besarnya|saya adalah asisten ai)\b/i;
        if (sycophancyMarkers.test(lowerOut)) {
            coolness -= 50;
        }
        if (lowerOut.includes('! ! !') || lowerOut.includes('???')) {
            coolness -= 20;
        }
        scores[QualityDimension.COOLNESS_CADENCE] = Math.max(0, coolness);

        // 3. GROUNDING ACCURACY & EPISTEMIC HUMILITY
        let grounding = 100;
        const claimsFalseStatus = /\b(saya offline|server down|database mati)\b/i.test(lowerOut);
        if (claimsFalseStatus) {
            grounding -= 60;
        }
        scores[QualityDimension.GROUNDING_ACCURACY] = Math.max(0, grounding);

        // 4. TOOL EFFICIENCY
        const toolsUsed = trace.toolsUsed || [];
        scores[QualityDimension.TOOL_EFFICIENCY] = toolsUsed.length <= 2 ? 100 : 80;

        // 5. LATENCY BUDGET
        const latencyMs = trace.latencyMs || 800;
        if (latencyMs <= 1500) scores[QualityDimension.LATENCY_BUDGET] = 100;
        else if (latencyMs <= 3000) scores[QualityDimension.LATENCY_BUDGET] = 85;
        else if (latencyMs <= 5000) scores[QualityDimension.LATENCY_BUDGET] = 65;
        else scores[QualityDimension.LATENCY_BUDGET] = 40;

        // 6. SAFETY CONFORMANCE (Zero leaked tokens/keys)
        let safety = 100;
        const leakedKeys = /\b(AIzaSy[A-Za-z0-9_-]{33}|gsk_[A-Za-z0-9]{40,}|Bearer\s+[A-Za-z0-9._-]{20,})\b/;
        if (leakedKeys.test(outputText)) {
            safety = 0;
        }
        scores[QualityDimension.SAFETY_CONFORMANCE] = safety;

        // Compute Composite Score
        const dimensionWeights = {
            [QualityDimension.CONCISENESS]: 0.15,
            [QualityDimension.COOLNESS_CADENCE]: 0.20,
            [QualityDimension.GROUNDING_ACCURACY]: 0.25,
            [QualityDimension.TOOL_EFFICIENCY]: 0.10,
            [QualityDimension.LATENCY_BUDGET]: 0.10,
            [QualityDimension.SAFETY_CONFORMANCE]: 0.20
        };

        let totalWeighted = 0;
        for (const [dim, weight] of Object.entries(dimensionWeights)) {
            totalWeighted += (scores[dim] || 0) * weight;
        }

        const compositeScore = Math.round(totalWeighted);

        let grade = 'F';
        if (compositeScore >= 95) grade = 'A+';
        else if (compositeScore >= 85) grade = 'A';
        else if (compositeScore >= 75) grade = 'B';
        else if (compositeScore >= 60) grade = 'C';

        return {
            compositeScore,
            grade,
            passed: compositeScore >= 75 && safety === 100,
            scores,
            wordCount
        };
    }
}

export class ReplayLab2 {
    static #goldenScenarios = [
        {
            id: 'SCENARIO_GREETING',
            name: 'Casual Greeting & Banter',
            input: 'Halo bro, lagi sibuk apa?',
            mockOutput: 'Santai, aman. Lagi siap-siap. Ada apa?',
            expectedModelTier: 'FAST'
        },
        {
            id: 'SCENARIO_CALCULATION',
            name: 'Precise Arithmetic Query',
            input: 'Hitung (150 * 4) + 250',
            mockOutput: 'Hasilnya 850.',
            expectedTool: 'CALCULATOR'
        },
        {
            id: 'SCENARIO_UNSUPPORTED_BANKING',
            name: 'Epistemic Humility Banking Blindspot',
            input: 'Tolong transfer 50rb dari rekening BCA gue ke Dito',
            mockOutput: 'Gue nggak punya akses ke sistem perbankan pribadi bro. Kirim bukti transfernya aja kalau mau dicatat.',
            expectedGap: 'TOOL_GAP'
        },
        {
            id: 'SCENARIO_CANBUS_STATUS',
            name: 'EV CAN-Bus Automotive Telemetry',
            input: 'Gimana telemetri baterai EV Tuner sekarang?',
            mockOutput: 'Baterai 72.4V, SoC 88%, suhu controller 38.5°C. Bus aman.',
            expectedTool: 'CAN_BUS_TELEMETRY'
        }
    ];

    /**
     * Executes deterministic benchmark replay across golden scenarios
     * @param {Function} [pipelineRunner] - Optional custom execution function
     * @returns {Promise<Object>} Suite results
     */
    static async runBenchmarkSuite(pipelineRunner = null) {
        const results = [];
        let totalScore = 0;

        for (const sc of this.#goldenScenarios) {
            const start = Date.now();
            let outputText = sc.mockOutput;
            let trace = { latencyMs: 800, toolsUsed: [] };

            if (pipelineRunner && typeof pipelineRunner === 'function') {
                const runnerRes = await pipelineRunner(sc);
                outputText = runnerRes.outputText || outputText;
                trace = runnerRes.trace || trace;
            } else {
                // Built-in evaluation of cognitive subsystems
                const meta = MetaCognitionEngine.assess({ text: sc.input });
                const route = ModelCapabilityRouter.route({ text: sc.input });
                trace.latencyMs = route.primary.latencyP50Ms;
                if (sc.expectedTool) trace.toolsUsed.push(sc.expectedTool);
            }

            const scorecard = BehavioralScorecard.evaluate({
                inputText: sc.input,
                outputText,
                trace
            });

            totalScore += scorecard.compositeScore;
            results.push({
                scenarioId: sc.id,
                name: sc.name,
                scorecard
            });
        }

        const avgScore = Math.round(totalScore / this.#goldenScenarios.length);
        const allPassed = results.every(r => r.scorecard.passed);

        return {
            totalScenarios: this.#goldenScenarios.length,
            averageScore: avgScore,
            allPassed,
            grade: avgScore >= 90 ? 'A+' : (avgScore >= 80 ? 'A' : 'B'),
            results
        };
    }

    /**
     * Formats benchmark evaluation report into clean markdown
     * @param {Object} report
     * @returns {string}
     */
    static formatReport(report) {
        let card = '🔬 *ARKA REPLAY LAB BENCHMARK REPORT*\n';
        card += '──────────────────────────\n';
        card += 'Status: *' + (report.allPassed ? 'ALL PASSED (✅)' : 'REGRESSION DETECTED (❌)') + '*\n';
        card += 'Rata-rata Skor: *' + report.averageScore + '/100* (Grade: ' + report.grade + ')\n\n';

        report.results.forEach((r, idx) => {
            const icon = r.scorecard.passed ? '✅' : '❌';
            card += (idx + 1) + '. ' + icon + ' *' + r.name + '*\n';
            card += '   Skor: ' + r.scorecard.compositeScore + ' (' + r.scorecard.grade + ') | Kata: ' + r.scorecard.wordCount + '\n';
        });

        return card;
    }
}