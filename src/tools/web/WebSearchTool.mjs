export const WebSearchTool = {
  name: 'web_search',
  description: 'Search the web for information using DuckDuckGo.',
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
    try {
      const response = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await response.text();
      
      const results = [];
      const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null && results.length < 3) {
        let snippet = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim(); // strip html
        if (snippet) {
          results.push({ snippet });
        }
      }
      
      return {
        source: 'duckduckgo',
        query,
        results: results.length > 0 ? results : [{ snippet: 'Tidak ditemukan hasil spesifik.' }]
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
