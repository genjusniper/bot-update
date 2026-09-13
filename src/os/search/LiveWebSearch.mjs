// src/os/search/LiveWebSearch.mjs
// Real-time zero-key live web search and synthesis engine for Salim OS

export class LiveWebSearch {
    /**
     * Fetch web search results from Bing Search
     * @param {string} query 
     * @returns {Promise<Array<{ title: string, snippet: string }>>}
     */
    static async fetchBingSnippets(query) {
        try {
            const url = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
                },
                signal: AbortSignal.timeout(7000)
            });

            if (!res.ok) return [];
            const html = await res.text();
            const regex = /<li class="b_algo"[^>]*>.*?<h2[^>]*><a [^>]*>(.*?)<\/a><\/h2>.*?<div class="b_caption">.*?<p[^>]*>(.*?)<\/p>/gs;
            let m;
            const results = [];
            while ((m = regex.exec(html)) !== null && results.length < 5) {
                const title = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0183;/g, '·').replace(/&nbsp;/g, ' ').trim();
                const snippet = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0183;/g, '·').replace(/&nbsp;/g, ' ').trim();
                if (title && snippet && !title.toLowerCase().includes('calculator')) {
                    results.push({ title, snippet });
                }
            }
            return results;
        } catch (err) {
            console.warn('[LiveWebSearch] ⚠️ Bing search error:', err.message);
            return [];
        }
    }

    /**
     * Fetch encyclopedic results from Wikipedia Indonesia
     * @param {string} query 
     * @returns {Promise<Array<{ title: string, snippet: string }>>}
     */
    static async fetchWikiSnippets(query) {
        try {
            const url = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) return [];
            const data = await res.json();
            const list = data?.query?.search || [];
            return list.slice(0, 3).map(item => ({
                title: item.title,
                snippet: item.snippet.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').trim()
            }));
        } catch (err) {
            return [];
        }
    }

    /**
     * Synthesize search results using Gemini Flash Lite
     * @param {string} query 
     * @param {Array<{ title: string, snippet: string }>} snippets 
     * @returns {Promise<string>}
     */
    static async synthesizeResults(query, snippets) {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const apiKey = rawKey.split(',')[0].trim();
        const snippetText = snippets.map((s, i) => `[Sumber ${i + 1}: ${s.title}]\n${s.snippet}`).join('\n\n');

        if (!apiKey) {
            let out = `🌐 *HASIL PENCARIAN WEB: "${query}"*\n━━━━━━━━━━━━━━━━━━\n\n`;
            snippets.forEach((s) => {
                out += `📌 *${s.title}*\n${s.snippet}\n\n`;
            });
            out += `━━━━━━━━━━━━━━━━━━\n_Data web terkini._`;
            return out;
        }

        const prompt = `Kamu adalah Co-Pilot setia & cerdas untuk Bos Agus Salim.
User meminta pencarian web / info terbaru tentang: "${query}".
Berikut adalah potongan data web terkini yang berhasil dihimpun:

"""
${snippetText}
"""

TUGASMU:
1. Berikan penjelasan yang akurat, padat, lugas, dan to the point.
2. Gaya bahasa santai, cerdas, bersahabat, dan meyakinkan (khas Salim OS Co-Pilot).
3. Buat intisari/poin kunci yang relevan.
4. Format output rapi dengan bullet points WhatsApp (* tebal, • poin).

FORMAT OUTPUT:
🌐 *HASIL PENCARIAN: "${query}"*
━━━━━━━━━━━━━━━━━━
(Ringkasan jawaban tajam & fakta utama)

💡 *Intisari Penting:*
• ...
• ...
━━━━━━━━━━━━━━━━━━
_Sumber: Live Web Intelligence Salim OS_`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 600
                    }
                }),
                signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) throw new Error(`Gemini API returned ${res.status}`);
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return text || snippetText;
        } catch (err) {
            console.warn('[LiveWebSearch] ⚠️ Synthesis fallback:', err.message);
            let out = `🌐 *HASIL PENCARIAN WEB: "${query}"*\n━━━━━━━━━━━━━━━━━━\n\n`;
            snippets.forEach((s) => {
                out += `📌 *${s.title}*\n${s.snippet}\n\n`;
            });
            out += `━━━━━━━━━━━━━━━━━━\n_Data web terkini._`;
            return out;
        }
    }

    /**
     * Search and summarize query
     * @param {string} query 
     * @returns {Promise<string>}
     */
    static async search(query) {
        if (!query || query.trim().length === 0) {
            return `❓ Silakan masukkan kueri pencarian.\nContoh: \`!cari harga emas hari ini\` atau \`!cari gempa bmkg\``;
        }

        const cleanQuery = query.trim();
        let snippets = await this.fetchBingSnippets(cleanQuery);
        
        // If Bing returned few or no snippets, supplement with Wikipedia
        if (snippets.length < 2) {
            const wikiSnippets = await this.fetchWikiSnippets(cleanQuery);
            snippets = [...snippets, ...wikiSnippets];
        }

        if (snippets.length === 0) {
            return `🔍 Maaf Bos, tidak ditemukan informasi web yang relevan untuk kueri: *"${cleanQuery}"*. Coba kata kunci lain ya!`;
        }

        return await this.synthesizeResults(cleanQuery, snippets);
    }
}
