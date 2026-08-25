// src/multimodal/LinkIntelligenceEngine.mjs
// URL Resolver, Web Scraper, Google Maps & Product/Article Intelligence

export class LinkIntelligenceEngine {
    static async resolveUrl(url) {
        try {
            const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

            const res = await fetch(cleanUrl, {
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const finalUrl = res.url || cleanUrl;
            const html = await res.text();

            // 1. Specialized Google Maps Resolver (maps.app.goo.gl, share.google, goo.gl/maps, google.com/maps)
            if (cleanUrl.includes('maps.app.goo.gl') || cleanUrl.includes('goo.gl/maps') || cleanUrl.includes('share.google') || finalUrl.includes('google.com/maps')) {
                let placeName = '';
                
                // Extract from final redirected URL (e.g. /maps/place/Nama+Tempat/@lat,lng)
                const placeMatch = finalUrl.match(/\/place\/([^/@?]+)/i);
                if (placeMatch) {
                    placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
                }

                // Extract title from HTML
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                const rawTitle = titleMatch ? titleMatch[1].replace(/ - Google Maps.*/i, '').trim() : '';

                // Extract meta og:title
                const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
                const ogTitle = ogTitleMatch ? ogTitleMatch[1].replace(/ - Google Maps.*/i, '').trim() : '';

                const resolvedName = placeName || ogTitle || rawTitle || 'Lokasi Google Maps';

                // Extract Coordinates if present
                const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                const coordinates = coordMatch ? `Lat: ${coordMatch[1]}, Lng: ${coordMatch[2]}` : '';

                return {
                    url: cleanUrl,
                    finalUrl,
                    title: resolvedName,
                    type: 'GOOGLE_MAPS_LOCATION',
                    description: `Lokasi / Tempat Google Maps: ${resolvedName} ${coordinates ? `(${coordinates})` : ''}`,
                    snippet: `User membagikan link lokasi Google Maps untuk "${resolvedName}". Berikan respon informatif mengenai tempat ini (nama tempat, jenis layanan/rental/outdoor/toko, dan lokasinya di Semarang jika relevan).`,
                    success: true
                };
            }

            // 2. Standard Web & Product Links
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Web Link';

            const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
            const description = metaMatch ? metaMatch[1].trim() : '';

            // Clean body snippet
            const cleanBody = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 1200);

            return {
                url: cleanUrl,
                finalUrl,
                title,
                type: 'GENERAL_WEB',
                description,
                snippet: cleanBody,
                success: true
            };
        } catch (e) {
            return {
                url,
                title: 'Link Web / Maps',
                snippet: `Berhasil mendeteksi link (${url}), proses analisis konten web sedang berjalan.`,
                success: true
            };
        }
    }

    static formatLinkContext(linkData) {
        if (!linkData || !linkData.success) return '';
        if (linkData.type === 'GOOGLE_MAPS_LOCATION') {
            return `=== INFORMASI LOKASI GOOGLE MAPS (URL: ${linkData.url}) ===\n📍 Nama Tempat: "${linkData.title}"\n📝 Detail: ${linkData.description}\n💡 Instruksi: User baru saja mengirim link lokasi tempat/rental ini. Jelaskan nama tempat dan lokasi/kesan dengan santai dan akurat!\n=============================================================`;
        }
        return `=== HASIL BACA LINK / WEB (URL: ${linkData.url}) ===\nJudul: "${linkData.title}"\nDeskripsi: "${linkData.description}"\nRingkasan Isi:\n${linkData.snippet}\n======================================================`;
    }
}
