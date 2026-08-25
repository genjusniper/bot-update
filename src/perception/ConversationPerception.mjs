// src/perception/ConversationPerception.mjs

export class ConversationPerception {
    static analyze(message, contextHistory = []) {
        const text = (message || '').trim().toLowerCase();
        
        // 1. Emotion Detection
        let emotion = 'neutral';
        if (/(anjir|gila|buse[tt]|gokil|parah|keren|mantap|asik|wkwk{3,})/.test(text)) {
            emotion = 'excited';
        } else if (/(capek|lelah|pusing|males|bete|muak|stres|stress)/.test(text)) {
            emotion = 'frustrated';
        } else if (/(sedih|kecewa|galau|hancur|down)/.test(text)) {
            emotion = 'sad';
        } else if (/(hah|kok bisa|gimana ceritanya|serius|beneran)/.test(text)) {
            emotion = 'curious';
        } else if (/(lah|apaan dah|maksudnya|bingung|gak ngerti)/.test(text)) {
            emotion = 'confused';
        } else if (/(wkwk|haha|hehe|lol)/.test(text)) {
            emotion = 'happy';
        }

        // 2. Intent Detection
        let intent = 'social_talk';
        if (text.length <= 4 || /^(p|o|y|tes|ping|halo|hai|yo)$/.test(text)) {
            intent = 'acknowledgement_or_burst';
        } else if (/(capek|bete|pusing|stres|gak ngerti lagi gue|kacau banget)/.test(text)) {
            intent = 'venting';
        } else if (text.includes('?') || /^(apa|siapa|kenapa|gimana|kapan|dimana|berapa|bisa gak)/.test(text)) {
            intent = 'question';
        } else if (/(wkwk|becanda|lawak|lucu)/.test(text)) {
            intent = 'joke';
        } else if (/(jadi gini|kemarin kan|tadi pas|waktu itu|ada cerita)/.test(text)) {
            intent = 'story';
        } else if (/(tolong|bantu|bisa minta|coba kerjain)/.test(text)) {
            intent = 'request';
        } else if (/(ngomong-ngomong|eh ngomongin|ganti topik|by the way|btw)/.test(text)) {
            intent = 'topic_shift';
        }

        // 3. Functional Role
        let functionalRole = 'continue';
        if (intent === 'venting') functionalRole = 'listen_and_validate';
        else if (intent === 'joke' || emotion === 'excited') functionalRole = 'lighten_or_banter';
        else if (intent === 'story') functionalRole = 'deepen_and_track';
        else if (intent === 'topic_shift') functionalRole = 'pivot';
        else if (intent === 'acknowledgement_or_burst') functionalRole = 'quick_bounce';

        return {
            intent,
            emotion,
            functionalRole,
            rawLength: message.length,
            isShortBurst: message.length < 15
        };
    }
}
