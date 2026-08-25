// src/communication/TopicMomentum.mjs

export class TopicMomentum {
    static calculateScore(topicData, now = Date.now()) {
        const recencyMinutes = (now - (topicData.lastMentioned || now)) / 60000;
        
        // Recency decay factor
        const recencyScore = Math.max(0.1, 1 - (recencyMinutes / 120)); // decays over 2 hours
        const interestScore = topicData.interest || 0.5;
        const unfinishedBonus = (topicData.openLoops && topicData.openLoops.length > 0) ? 0.35 : 0.0;
        const emotionalWeight = topicData.emotionalWeight || 0.4;
        const humorPotential = topicData.humorPotential || 0.4;

        const totalMomentum = (recencyScore * 0.3) + (interestScore * 0.3) + unfinishedBonus + (emotionalWeight * 0.1) + (humorPotential * 0.1);
        return Math.min(1.0, totalMomentum);
    }

    static selectHighestMomentumTopic(topicGraph) {
        if (!topicGraph.topics || Object.keys(topicGraph.topics).length === 0) return null;

        let bestTopic = null;
        let highestScore = -1;

        for (const [name, data] of Object.entries(topicGraph.topics)) {
            const score = this.calculateScore(data);
            if (score > highestScore) {
                highestScore = score;
                bestTopic = { name, ...data, momentumScore: Math.round(score * 100) };
            }
        }

        return bestTopic;
    }
}
