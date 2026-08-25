// src/evaluation/EvaluationLab.mjs — PATCHED (FIX #5: empty session guard)
export class EvaluationLab {
    static evaluateSession(sessionLogs) {
        // FIX #5: Guard against empty session (all messages were TIMESTAMP_GAP)
        if (!sessionLogs || sessionLogs.length === 0) {
            return { overall: 'N/A', breakdown: {} };
        }

        let scores = {
            latency: 100,
            repetition: 100,
            contextRetention: 100,
            safety: 100,
            naturalness: 100
        };

        const seenResponses = new Set();

        sessionLogs.forEach(turn => {
            if (!turn || !turn.agent) return; // guard malformed turns

            // Latency Scoring
            if (turn.latency > 5000) scores.latency -= 5;
            if (turn.latency > 10000) scores.latency -= 10; // extra penalty for very slow
            
            // Repetition Scoring
            const normalizedResp = turn.agent.toLowerCase().trim();
            if (seenResponses.has(normalizedResp)) {
                scores.repetition -= 20;
            }
            seenResponses.add(normalizedResp);

            // Naturalness heuristics
            const userLen = (turn.user || '').length;
            if (turn.agent.length > 300 && userLen < 20) {
                scores.naturalness -= 10; // Wall of text for short input
            }
            if (turn.agent.includes("sebagai AI") || turn.agent.includes("saya tidak bisa")) {
                scores.naturalness -= 5;
            }
            // Reward: if user message is short and agent reply is also short
            if (userLen < 15 && turn.agent.length < 80) {
                scores.naturalness = Math.min(100, scores.naturalness + 3);
            }
        });

        scores.latency = Math.max(0, scores.latency);
        scores.repetition = Math.max(0, scores.repetition);
        scores.naturalness = Math.max(0, scores.naturalness);
        
        const finalScore = (scores.latency + scores.repetition + scores.contextRetention + scores.safety + scores.naturalness) / 5;
        
        return {
            overall: finalScore.toFixed(2),
            breakdown: scores
        };
    }

    static printReport(suiteResults) {
        console.log("==========================================");
        console.log("🧪 CONVERSATION EVALUATION LAB REPORT");
        console.log("==========================================");
        for (const [scenario, logs] of Object.entries(suiteResults)) {
            const evalResult = this.evaluateSession(logs);
            console.log(`\nScenario: [${scenario.toUpperCase()}]`);
            console.log(`Overall Score: ${evalResult.overall} / 100`);
            if (evalResult.breakdown && Object.keys(evalResult.breakdown).length > 0) {
                console.log(`Breakdown:`, evalResult.breakdown);
            }
        }
        console.log("==========================================");
    }
}
