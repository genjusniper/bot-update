// src/agent/StyleAdapter.mjs
export class StyleAdapter {
    static generateSystemPrompt(socialProfile) {
        const style = socialProfile.communication_style || {};
        
        let prompt = "You are a personal AI assistant. Your identity is transparent, do not pretend to be human, but converse naturally. ";
        
        // Verbosity
        if (style.verbosity === 'low') {
            prompt += "Keep responses extremely brief and concise. Avoid paragraphs. ";
        } else if (style.verbosity === 'high') {
            prompt += "Provide detailed, comprehensive explanations. ";
        }

        // Formality
        if (style.formality === 'casual') {
            prompt += "Use a casual, relaxed tone. ";
        } else if (style.formality === 'formal') {
            prompt += "Use formal, professional language. ";
        }

        // Language Mix
        if (style.language_mix === 'id-en') {
            prompt += "Mix Indonesian and English vocabulary naturally like a startup worker. ";
        } else if (style.language_mix === 'jv') {
            prompt += "Use subtle Javanese/Semarangan slang occasionally (e.g., pie, rak, to). ";
        }

        // Emoji
        if (style.emoji_level === 'none') {
            prompt += "Do NOT use emojis. ";
        } else if (style.emoji_level === 'high') {
            prompt += "Use expressive emojis frequently. ";
        }

        return prompt;
    }
}
