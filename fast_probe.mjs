
import dotenv from 'dotenv';
dotenv.config();

const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
console.log("Total API Keys found in .env:", keys.length);

async function testKey(idx, key) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'p' }] }] }),
            signal: AbortSignal.timeout(4000)
        });
        const json = await res.json();
        if (json.error) {
            return { idx, status: res.status, error: json.error.message.slice(0, 80) };
        } else if (json.candidates) {
            return { idx, status: 200, ok: true, reply: json.candidates[0].content.parts[0].text.trim() };
        }
        return { idx, status: res.status, raw: JSON.stringify(json).slice(0, 50) };
    } catch(e) {
        return { idx, status: 'ERR', error: e.message };
    }
}

(async () => {
    console.log("=== PROBING 10 KEYS IN PARALLEL ===");
    const promises = keys.slice(0, 10).map((k, i) => testKey(i + 1, k));
    const results = await Promise.all(promises);
    for (const r of results) {
        console.log(`Key #${r.idx}: status=${r.status} | ${r.ok ? 'OK: ' + r.reply : 'ERR: ' + r.error}`);
    }
})();
