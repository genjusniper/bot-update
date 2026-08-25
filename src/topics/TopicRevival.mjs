// src/topics/TopicRevival.mjs

export class TopicRevival {
    static evaluateRevival(momentum, topicGraph) {
        // If energy is low (< 0.45), revive an interesting open loop
        if (momentum.energy < 0.45 && topicGraph.topics) {
            const dormantTopics = Object.values(topicGraph.topics).filter(t => 
                t.openLoops && t.openLoops.length > 0 && (Date.now() - t.lastMentioned > 300000)
            );

            if (dormantTopics.length > 0) {
                const target = dormantTopics[0];
                return {
                    shouldRevive: true,
                    topic: target.topic,
                    openLoop: target.openLoops[0],
                    instruction: `PERCAKAPAN MULAI SEPI: Hidupkan kembali topik lama "${target.topic}" secara santai (contoh: "eh ngomong-ngomong, yang soal ${target.openLoops[0]} itu kemarin kelanjutannya gimana?").`
                };
            }
        }

        return { shouldRevive: false, instruction: '' };
    }
}
