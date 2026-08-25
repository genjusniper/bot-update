// src/multimodal/LinkIntelligenceEngine.mjs
// URL Resolver, Web Scraper & Product/Article Intelligence

export class LinkIntelligenceEngine {
    static async resolveUrl(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const html = await res.text();

            // Extract Title
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Web Link';

            // Extract Meta Description
            const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
            const description = metaMatch ? metaMatch[1].trim() : '';

            // Clean visible body text snippet (limit to 1200 chars for token budget)
            const cleanBody = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 1200);

            return {
                url,
                title,
                description,
                snippet: cleanBody,
                success: true
            };
        } catch (e) {
            return {
                url,
                title: 'Link Web',
                snippet: `Gagal membaca isi link secara penuh: ${e.message}`,
                success: false
            };
        }
    }

    static formatLinkContext(linkData) {
        if (!linkData || !linkData.success) return '';
        return `=== HASIL BACA LINK / WEB (URL: ${linkData.url}) ===\nJudul: "${linkData.title}"\nDeskripsi: "${linkData.description}"\nRingkasan Isi:\n${linkData.snippet}\n======================================================`;
    }
}
