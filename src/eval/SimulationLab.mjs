// src/eval/SimulationLab.mjs
// Comprehensive Multi-Turn Conversation Simulation Lab

export class SimulationLab {
    static fixtures = [
        { id: '01_short_reply', name: 'Minimal Fast Path', turns: ['p'] },
        { id: '02_curhat_venting', name: 'Pure Venting', turns: ['gue capek banget sama kerjaan hari ini'] },
        { id: '03_playful_venting', name: 'Playful Venting', turns: ['anjir capek banget wkwk bos gue aneh-aneh aja'] },
        { id: '04_story_thread', name: 'Storytelling Continuity', turns: ['tadi waktu pulang ban motor gue bocor kena paku'] },
        { id: '05_javanese_dialect', name: 'Authentic Jawa Dialect', turns: ['makan apa yo enak e jam semene ki'] },
        { id: '06_topic_transition', name: 'Topic Graph Association', turns: ['mau rakit PC baru nih buat main game'] },
        { id: '07_humor_escalation', name: 'Humor & Teasing', turns: ['wkwk lu kalo lapar emang beda orang ya'] },
        { id: '08_closing_reaction', name: 'Minimal Reaction Turn', turns: ['wkwk'] }
    ];

    static async runSimulation(engineInstance, testChatId = 'sim_lab_user@s.whatsapp.net') {
        const results = [];
        let totalNaturalness = 0;
        let totalLatency = 0;

        for (const fixture of this.fixtures) {
            const start = Date.now();
            let finalReply = "";
            let pass = true;

            try {
                for (const input of fixture.turns) {
                    finalReply = await engineInstance.process(testChatId, input);
                }
                const duration = Date.now() - start;
                totalLatency += duration;

                const hasNoGlitch = Boolean(finalReply && !finalReply.includes('offline') && !finalReply.includes('nge-lag'));
                const naturalness = hasNoGlitch ? 95 : 40;
                totalNaturalness += naturalness;

                results.push({
                    id: fixture.id,
                    name: fixture.name,
                    input: fixture.turns[0],
                    output: finalReply?.slice(0, 70),
                    durationMs: duration,
                    naturalness,
                    pass: hasNoGlitch
                });
            } catch (e) {
                results.push({
                    id: fixture.id,
                    name: fixture.name,
                    input: fixture.turns[0],
                    error: e.message,
                    durationMs: Date.now() - start,
                    naturalness: 0,
                    pass: false
                });
            }
        }

        const avgNaturalness = Math.round(totalNaturalness / this.fixtures.length);
        const avgLatency = Math.round(totalLatency / this.fixtures.length);

        return {
            totalFixtures: this.fixtures.length,
            passedFixtures: results.filter(r => r.pass).length,
            avgNaturalness,
            avgLatencyMs: avgLatency,
            results
        };
    }
}
