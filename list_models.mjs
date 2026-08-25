import dotenv from 'dotenv';
dotenv.config();

(async () => {
    const rawKeys = process.env.GEMINI_API_KEY || '';
    const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    console.log(`Found ${keys.length} Gemini API keys.`);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        try {
            console.log(`\nTesting Key #${i + 1} (${key.substring(0, 10)}...):`);
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            const json = await res.json();
            if (json.models) {
                console.log(`✅ Key #${i + 1} is VALID! Available models:`, json.models.map(m => m.name).slice(0, 8));
            } else {
                console.log(`❌ Key #${i + 1} Error:`, JSON.stringify(json));
            }
        } catch (e) {
            console.log(`❌ Key #${i + 1} Network Error:`, e.message);
        }
    }
})();
