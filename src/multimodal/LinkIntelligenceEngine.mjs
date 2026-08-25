// src/multimodal/LinkIntelligenceEngine.mjs
// Universal Web, Google Maps, TikTok, YouTube, Instagram, Shopee, Tokopedia Intelligence
// V13.7 — In-memory URL cache, YouTube oEmbed, Shopee/Tokopedia, improved Maps title resolution

const URL_CACHE = new Map(); // url -> { data, expiresAt }
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit

export class LinkIntelligenceEngine {
    static async resolveUrl(url) {
        const cleanUrl = (url || '').trim().startsWith('http') ? url.trim() : `https://${(url || '').trim()}`;

        // In-memory cache to avoid re-fetching same URL
        const cached = URL_CACHE.get(cleanUrl);
        if (cached && Date.now() < cached.expiresAt) return cached.data;

        const result = await this._doResolve(cleanUrl);
        URL_CACHE.set(cleanUrl, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
    }

    static async _doResolve(cleanUrl) {
        try {
            // 1. TIKTOK — Official oEmbed API (no scraping needed)
            if (cleanUrl.includes('tiktok.com')) {
                try {
                    const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`, { signal: AbortSignal.timeout(5000) });
                    if (oembedRes.ok) {
                        const data = await oembedRes.json();
                        return {
                            url: cleanUrl,
                            title: data.title || 'Video TikTok',
                            type: 'TIKTOK_VIDEO',
                            author: data.author_name || '',
                            description: `Video TikTok oleh @${data.author_name}: "${data.title}"`,
                            snippet: `User membagikan video TikTok berjudul "${data.title}" oleh @${data.author_name}. Tanggapi isi video ini dengan seru dan relevan!`,
                            success: true
                        };
                    }
                } catch (e) {}
                // TikTok fallback — just domain
                return { url: cleanUrl, title: 'Video TikTok', type: 'TIKTOK_VIDEO', author: '', description: 'Video TikTok', snippet: 'User membagikan video TikTok. Tanggapi dengan santai!', success: true };
            }

            // 2. YOUTUBE — Official oEmbed API
            if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
                try {
                    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`, { signal: AbortSignal.timeout(5000) });
                    if (oembedRes.ok) {
                        const data = await oembedRes.json();
                        return {
                            url: cleanUrl,
                            title: data.title || 'Video YouTube',
                            type: 'YOUTUBE_VIDEO',
                            author: data.author_name || '',
                            description: `Video YouTube oleh ${data.author_name}: "${data.title}"`,
                            snippet: `User membagikan video YouTube berjudul "${data.title}" oleh channel ${data.author_name}. Tanggapi isi video ini dengan informatif!`,
                            success: true
                        };
                    }
                } catch (e) {}
            }

            // 3. Fetch HTML with smart User-Agent for OpenGraph parsing
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(cleanUrl, {
                redirect: 'follow',
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const finalUrl = res.url || cleanUrl;
            const html = await res.text();

            // OpenGraph + Meta helpers
            const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() || '';
            const metaTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '';
            const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() ||
                           html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() || '';
            const title = ogTitle || metaTitle || '';
            const description = ogDesc;

            // 4. GOOGLE MAPS (share.google / maps.app.goo.gl / goo.gl/maps / google.com/maps)
            if (cleanUrl.includes('maps.app.goo.gl') || cleanUrl.includes('goo.gl/maps') ||
                cleanUrl.includes('share.google') || finalUrl.includes('google.com/maps')) {

                // Extract place name from final redirected URL /place/Name@lat,lng
                const placeMatch = finalUrl.match(/\/place\/([^/@?&]+)/i);
                let placeName = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : '';

                // Try og:title stripped of suffix
                if (!placeName && title) placeName = title.replace(/ - Google Maps.*/i, '').replace(/ - Maps.*/i, '').trim();

                // If still "Place Viewer" or empty, use URL path hint
                if (!placeName || placeName.toLowerCase() === 'place viewer') {
                    try {
                        const urlObj = new URL(finalUrl.includes('google.com') ? finalUrl : cleanUrl);
                        const pathParts = urlObj.pathname.split('/').filter(Boolean);
                        // Find "place" segment and take the next
                        const placeIdx = pathParts.indexOf('place');
                        if (placeIdx !== -1 && pathParts[placeIdx + 1]) {
                            placeName = decodeURIComponent(pathParts[placeIdx + 1].replace(/\+/g, ' '));
                        } else {
                            placeName = 'Lokasi di Google Maps';
                        }
                    } catch (_) { placeName = 'Lokasi di Google Maps'; }
                }

                const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                const coordinates = coordMatch ? `Koordinat: ${coordMatch[1]}, ${coordMatch[2]}` : '';

                return {
                    url: cleanUrl,
                    finalUrl,
                    title: placeName,
                    type: 'GOOGLE_MAPS_LOCATION',
                    description: `Lokasi Google Maps: "${placeName}"${coordinates ? ` (${coordinates})` : ''}`,
                    snippet: `User membagikan link lokasi Google Maps: "${placeName}". Berikan tanggapan terkait tempat/lokasi/rental ini secara informatif, santai, dan akurat. Jika ada info koordinat, kamu bisa mention kira-kira area di mana.`,
                    success: true
                };
            }

            // 5. INSTAGRAM
            if (cleanUrl.includes('instagram.com')) {
                const cleanTitle = title.replace(/ on Instagram.*/i, '').replace(/Instagram photo by .*/i, '').replace(/• Instagram/i, '').trim();
                return {
                    url: cleanUrl,
                    finalUrl,
                    title: cleanTitle || 'Postingan Instagram',
                    type: 'INSTAGRAM_CONTENT',
                    description: description || 'Konten / Reel Instagram',
                    snippet: `User mengirim link Instagram: "${cleanTitle || 'Postingan/Reel'}". ${description ? `Caption/Deskripsi: ${description}` : ''} Tanggapi konten ini secara santai!`,
                    success: true
                };
            }

            // 6. SHOPEE
            if (cleanUrl.includes('shopee.co.id')) {
                const cleanTitle = title.replace(/\| Shopee.*/i, '').replace(/Shopee Indonesia.*\|/i, '').trim();
                return {
                    url: cleanUrl,
                    finalUrl,
                    title: cleanTitle || 'Produk Shopee',
                    type: 'SHOPEE_PRODUCT',
                    description: description,
                    snippet: `User mengirim link produk Shopee: "${cleanTitle}". ${description ? `Detail: ${description}.` : ''} Bantu analisis/rekomendasi produk ini!`,
                    success: true
                };
            }

            // 7. TOKOPEDIA
            if (cleanUrl.includes('tokopedia.com')) {
                const cleanTitle = title.replace(/\| Tokopedia.*/i, '').trim();
                return {
                    url: cleanUrl,
                    finalUrl,
                    title: cleanTitle || 'Produk Tokopedia',
                    type: 'TOKOPEDIA_PRODUCT',
                    description: description,
                    snippet: `User mengirim link produk Tokopedia: "${cleanTitle}". ${description ? `Detail: ${description}.` : ''} Bantu analisis/rekomendasi produk ini!`,
                    success: true
                };
            }

            // 8. GENERAL WEB
            const cleanBody = html
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 1000);

            return {
                url: cleanUrl,
                finalUrl,
                title: title || 'Web Link',
                type: 'GENERAL_WEB',
                description,
                snippet: cleanBody || description || title,
                success: true
            };

        } catch (e) {
            // Graceful fallback — extract domain name
            let fallbackTitle = 'Link Web';
            try { fallbackTitle = new URL(cleanUrl).hostname.replace('www.', ''); } catch (_) {}
            return {
                url: cleanUrl,
                title: fallbackTitle,
                type: 'GENERAL_WEB',
                snippet: `User membagikan link dari ${fallbackTitle}. Tanggapi dengan ramah dan tanyakan apa yang ingin dibahas dari link tersebut.`,
                success: true
            };
        }
    }

    static formatLinkContext(linkData) {
        if (!linkData || !linkData.success) return '';

        const icons = {
            GOOGLE_MAPS_LOCATION: '📍',
            TIKTOK_VIDEO: '🎬',
            INSTAGRAM_CONTENT: '📸',
            YOUTUBE_VIDEO: '▶️',
            SHOPEE_PRODUCT: '🛍️',
            TOKOPEDIA_PRODUCT: '🛒',
            GENERAL_WEB: '🔗'
        };
        const labels = {
            GOOGLE_MAPS_LOCATION: 'LOKASI GOOGLE MAPS',
            TIKTOK_VIDEO: 'VIDEO TIKTOK',
            INSTAGRAM_CONTENT: 'KONTEN INSTAGRAM',
            YOUTUBE_VIDEO: 'VIDEO YOUTUBE',
            SHOPEE_PRODUCT: 'PRODUK SHOPEE',
            TOKOPEDIA_PRODUCT: 'PRODUK TOKOPEDIA',
            GENERAL_WEB: 'LINK WEB'
        };
        const icon = icons[linkData.type] || '🔗';
        const label = labels[linkData.type] || 'LINK WEB';

        return `=== ${icon} INFORMASI ${label} ===
URL: ${linkData.url}
Judul: "${linkData.title}"
Detail: ${linkData.description || '-'}
💡 Instruksi untuk AI: ${linkData.snippet}
${'='.repeat(52)}`;
    }
}
