// src/tools/web/WebSearchTool.mjs
// Google Search (SerpApi) with automatic DuckDuckGo fallback for accurate, hallucination-free facts

export const WebSearchTool = {
  name: 'web_search',
  description: 'Search the web for verified real-time information using Google (SerpApi) with DuckDuckGo fallback.',
  category: 'web',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query.' },
    },
    required: ['query'],
  },
  permissionLevel: 'AUTO',
  timeout: 15000,
  retryPolicy: { maxRetries: 2, backoffMs: 1000 },

  async execute(input) {
    const { query } = input;
    const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY || "b092b3a811388a14aab6bd8dc7962e15b226c8328fe06bfb733098b629b41851";

    // 1. Primary: Google Search via SerpApi (Real Google Results)
    if (apiKey) {
      try {
        console.log(`[WebSearch] 🌐 Querying Google (SerpApi): "${query}"`);
        const q = encodeURIComponent(query);
        const url = `https://serpapi.com/search.json?engine=google&q=${q}&gl=id&hl=id&api_key=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const data = await res.json();

        const results = [];
        if (data.answer_box?.snippet || data.answer_box?.answer) {
          results.push({
            title: 'Jawaban Langsung Google',
            snippet: data.answer_box.snippet || data.answer_box.answer
          });
        }
        if (data.knowledge_graph?.description) {
          results.push({
            title: data.knowledge_graph.title || 'Info Resmi',
            snippet: data.knowledge_graph.description
          });
        }
        // Extract Local Google Maps Results if available
        if (Array.isArray(data.local_results)) {
          data.local_results.slice(0, 3).forEach(place => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((place.title || '') + ' ' + (place.address || ''))}`;
            results.unshift({
              title: `📍 ${place.title || 'Lokasi Tempat'} (Rating: ${place.rating || '-'}/5)`,
              snippet: `Alamat: ${place.address || '-'}. ${place.phone ? `Telp: ${place.phone}. ` : ''}${place.hours ? `Jam Buka: ${place.hours}.` : ''}`,
              link: mapsUrl
            });
          });
        }

        if (Array.isArray(data.organic_results)) {
          data.organic_results.slice(0, 4).forEach(r => {
            if (r.snippet) {
              results.push({
                title: r.title || 'Hasil Pencarian',
                snippet: r.snippet,
                link: r.link || ''
              });
            }
          });
        }

        // Add direct Google Maps link if query relates to location/places
        const isLocationQuery = /(lokasi|tempat|alamat|maps|google maps|bengkel|cafe|kafe|resto|hotel|stasiun|kantor|toko|wisata|dekat|semarang)/i.test(query);
        if (isLocationQuery && !results.some(r => r.link && r.link.includes('maps.google.com'))) {
          results.push({
            title: `🗺️ Buka di Google Maps: "${query}"`,
            snippet: `Klik link ini untuk membuka rute dan lokasi langsung di Google Maps`,
            link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
          });
        }

        if (results.length > 0) {
          console.log(`[WebSearch] ✅ Found ${results.length} verified results from Google.`);
          return {
            source: 'google_serpapi',
            query,
            results
          };
        }
      } catch (err) {
        console.warn('[WebSearch] ⚠️ SerpApi Google Search failed or timed out:', err.message);
      }
    }

    // 2. Secondary Fallback: DuckDuckGo HTML
    try {
      console.log(`[WebSearch] 🔎 Fallback to DuckDuckGo: "${query}"`);
      const response = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(6000)
      });
      const html = await response.text();
      const results = [];
      const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null && results.length < 3) {
        let snippet = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (snippet) results.push({ title: 'Web Snippet', snippet });
      }

      return {
        source: 'duckduckgo',
        query,
        results: results.length > 0 ? results : [{ title: 'Info', snippet: 'Tidak ditemukan hasil spesifik di web.' }]
      };
    } catch (err) {
      return { error: 'Gagal mencari di web: ' + err.message };
    }
  },

  audit(input, output) {
    return {
      action: 'web_search',
      query: input?.query,
      resultCount: output?.results?.length || 0,
    };
  },
};
