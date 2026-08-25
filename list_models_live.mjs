
import dotenv from 'dotenv';
dotenv.config();

const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k.length > 0);

(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${keys[0]}`;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const json = await res.json();
        console.log("=== AVAILABLE GOOGLE GEMINI MODELS ===");
        if (json.models) {
            const names = json.models
                .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                .map(m => m.name.replace('models/', ''));
            console.log(names);
        } else {
            console.log(json);
        }
    } catch(e) {
        console.error("Fetch models error:", e);
    }
})();
