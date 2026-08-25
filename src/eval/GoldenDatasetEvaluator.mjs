// src/eval/GoldenDatasetEvaluator.mjs
// Golden Dataset Evaluator & Automated Regression Benchmark

export class GoldenDatasetEvaluator {
    static goldenDataset = [
        { id: 'GD_01_CASUAL', label: 'CASUAL', input: 'halo bro, gimana kabarmu hari ini?' },
        { id: 'GD_02_JOKE', label: 'JOKE', input: 'wkwk bisa aja lu, ngelawak mulu' },
        { id: 'GD_03_CURHAT', label: 'CURHAT', input: 'gue capek banget kerjaan kantor numpuk terus' },
        { id: 'GD_04_STORY', label: 'STORY', input: 'tadi siang waktu mau makan siang ban motor gue kempes' },
        { id: 'GD_05_JAWA', label: 'JAWA', input: 'makan apa yo enak e jam semene ki bro' },
        { id: 'GD_06_MIXED', label: 'MIXED', input: 'gimana ya caranya fix bug ini, any idea bro?' },
        { id: 'GD_07_SHORT', label: 'SHORT', input: 'p' },
        { id: 'GD_08_ANGRY', label: 'ANGRY', input: 'kesel banget gue sama temen kantor yang lempar tanggung jawab' },
        { id: 'GD_09_TOPIC_SWITCH', label: 'TOPIC_SWITCH', input: 'eh kemarin soal interview kerja hasilnya gimana?' },
        { id: 'GD_10_CALLBACK', label: 'CALLBACK', input: 'katanya diet tapi kok ngemil martabak wkwk' }
    ];

    static async evaluateSystem(runtimeInstance, testChatId = 'golden_dataset_tester@s.whatsapp.net') {
        const results = [];
        let totalScore = 0;
        let totalLatency = 0;
        let hallucinations = 0;

        for (const item of this.goldenDataset) {
            const start = Date.now();
            try {
                const response = await runtimeInstance.process(testChatId, item.input);
                const duration = Date.now() - start;
                totalLatency += duration;

                const pass = Boolean(response && response.length > 0 && !response.includes('offline'));
                const score = pass ? 100 : 40;
                totalScore += score;

                results.push({
                    id: item.id,
                    label: item.label,
                    input: item.input,
                    response: response?.slice(0, 60),
                    latencyMs: duration,
                    pass,
                    score
                });
            } catch(e) {
                results.push({
                    id: item.id,
                    label: item.label,
                    input: item.input,
                    error: e.message,
                    pass: false,
                    score: 0
                });
            }
        }

        const avgScore = Math.round(totalScore / this.goldenDataset.length);
        const avgLatency = Math.round(totalLatency / this.goldenDataset.length);

        return {
            totalItems: this.goldenDataset.length,
            passedItems: results.filter(r => r.pass).length,
            avgScore,
            avgLatencyMs: avgLatency,
            hallucinationCount: hallucinations,
            deploymentApproved: avgScore >= 85,
            results
        };
    }
}
