// src/communication/ResponseLengthController.mjs
// Response Length Controller & Anti-Overresponse Guard

export class ResponseLengthController {
    static getLengthBudget(inputMessage, mode = 'CASUAL') {
        const words = inputMessage.trim().split(/\s+/).length;

        // 1. Very short burst input (1-3 words)
        if (words <= 3 && mode !== 'TECHNICAL') {
            return {
                maxWords: 15,
                maxSentences: 1,
                directive: "ANGGARAN PANJANG: Sangat singkat (maksimal 1 kalimat santai, di bawah 15 kata)."
            };
        }

        // 2. Curhat / Venting
        if (mode === 'VENTING') {
            return {
                maxWords: 35,
                maxSentences: 2,
                directive: "ANGGARAN PANJANG: 1-2 kalimat empati hangat. Jangan berikan esai panjang."
            };
        }

        // 3. Storytelling
        if (mode === 'STORYTELLING') {
            return {
                maxWords: 45,
                maxSentences: 3,
                directive: "ANGGARAN PANJANG: 2-3 kalimat antusias menanggapi cerita."
            };
        }

        // 4. Technical / Complex inquiry
        if (mode === 'TECHNICAL') {
            return {
                maxWords: 80,
                maxSentences: 4,
                directive: "ANGGARAN PANJANG: Jawab to-the-point dan jelas sesuai konteks teknis."
            };
        }

        // Default Casual
        return {
            maxWords: 25,
            maxSentences: 2,
            directive: "ANGGARAN PANJANG: Maksimal 1-2 kalimat mengalir alami (sekitar 10-25 kata)."
        };
    }
}
