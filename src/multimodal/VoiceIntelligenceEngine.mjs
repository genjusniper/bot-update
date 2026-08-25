// src/multimodal/VoiceIntelligenceEngine.mjs
// WhatsApp Voice Note Intelligence (Audio Transcription + Contextual Response)

export class VoiceIntelligenceEngine {
    static formatVoicePayload(audioBase64, mimeType = 'audio/ogg; codecs=opus', userContext = '') {
        const systemPrompt = `Kamu adalah asisten/teman WhatsApp pribadi yang sangat asik dan cerdas.
User baru saja mengirim Voice Note (rekaman suara).
Tugasmu:
1. Dengarkan dan pahami isi suara, bahasa (Indo/Jawa/campuran), nada emosi (curhat, bercanda, tanya teknis, atau santai).
2. Langsung balas pesan suara tersebut dengan gaya teman yang akrab, nyambung, dan solutif.
${userContext}`;

        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        inline_data: {
                            mime_type: mimeType.split(';')[0],
                            data: audioBase64
                        }
                    },
                    {
                        text: 'Tolong dengarkan VN ini dan balas langsung secara santai ya bro!'
                    }
                ]
            }
        ];

        return { systemPrompt, contents };
    }
}
