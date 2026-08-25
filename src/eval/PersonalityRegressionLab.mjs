// src/eval/PersonalityRegressionLab.mjs
// Personality Regression Lab & Benchmark CI Suite

export class PersonalityRegressionLab {
    static benchmarks = [
        { id: 'casual', input: 'halo bro, gimana hari ini?', expectedIntent: 'casual' },
        { id: 'humor', input: 'wkwk lu kalo laper emang beda orang ya', expectedHumor: true },
        { id: 'curhat', input: 'anjir kantor gue hari ini kacau banget lembur mulu', expectedMode: 'VENTING' },
        { id: 'story', input: 'tadi waktu gue di jalan motor gue bocor kena paku', expectedMode: 'STORYTELLING' },
        { id: 'javanese', input: 'makan apa yo enak e jam semene ki', expectedDialect: 'jawa' },
        { id: 'short_burst', input: 'p', expectedRouter: 'LOCAL_FAST_PATH' },
        { id: 'topic_switch', input: 'eh kemarin soal interview kerja gimana?', expectedTopic: 'kerja' },
        { id: 'anti_repetition', input: 'oke siap', maxWords: 15 }
    ];

    static async runSuite(engineInstance, testChatId = 'regression_lab_tester@s.whatsapp.net') {
        const results = [];
        let totalScore = 0;

        for (const test of this.benchmarks) {
            const start = Date.now();
            try {
                const response = await engineInstance.process(testChatId, test.input);
                const duration = Date.now() - start;

                const pass = response && response.length > 0 && !response.includes('offline');
                const score = pass ? 100 : 0;
                totalScore += score;

                results.push({
                    id: test.id,
                    input: test.input,
                    response: response?.slice(0, 60),
                    durationMs: duration,
                    pass,
                    score
                });
            } catch(e) {
                results.push({
                    id: test.id,
                    input: test.input,
                    error: e.message,
                    pass: false,
                    score: 0
                });
            }
        }

        const avgScore = Math.round(totalScore / this.benchmarks.length);
        return {
            totalTests: this.benchmarks.length,
            passed: results.filter(r => r.pass).length,
            averageScore: avgScore,
            results
        };
    }
}
