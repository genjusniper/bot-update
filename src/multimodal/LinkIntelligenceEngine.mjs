// src/multimodal/LinkIntelligenceEngine.mjs
// Universal Web, Google Maps, Instagram, TikTok & Marketplace Intelligence

export class LinkIntelligenceEngine {
    static async resolveUrl(url) {
        try {
            const cleanUrl = (url || '').trim().startsWith('http') ? url.trim() : `https://${(url || '').trim()}`;
            
            // 1. TIKTOK SPECIALIZED RESOLVER (via Official Public oEmbed & Redirect)
            if (cleanUrl.includes('tiktok.com')) {
                try {
                    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
                    const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
                    if (oembedRes.ok) {
                        const data = await oembedRes.json();
                        return {
                            url: cleanUrl,
                            title: data.title || 'Video TikTok',
                            type: 'TIKTOK_VIDEO',
                            author: data.author_name || '',
                            description: `Video TikTok oleh @${data.author_name}: "${data.title}"`,
                            snippet: `User mengirim link video TikTok (${cleanUrl}). Judul/Caption: "${data.title}", Pembuat: @${data.author_name}. Berikan tanggapan yang relevan, asik, dan sesuai isi video/topik tersebut.`,
                            success: true
                        };
                    }
                } catch (e) {
                    console.warn('[LinkIntelligence] TikTok oEmbed fallback:', e.message);
                }
            }

            // 2. Fetch HTTP for other links (Maps, Instagram, Web)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

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

            // Extract Title & OpenGraph Description
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
            const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);

            const title = (ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : 'Web Link')).trim();
            const description = ogDescMatch ? ogDescMatch[1].trim() : '';

            // 3. GOOGLE MAPS RESOLVER (maps.app.goo.gl, share.google, goo.gl/maps, google.com/maps)
            if (cleanUrl.includes('maps.app.goo.gl') || cleanUrl.includes('goo.gl/maps') || cleanUrl.includes('share.google') || finalUrl.includes('google.com/maps')) {
                let placeName = '';
                const placeMatch = finalUrl.match(/\/place\/([^/@?]+)/i);
                if (placeMatch) {
                    placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
                }

                const resolvedName = placeName || title.replace(/ - Google Maps.*/i, '').trim() || 'Lokasi Google Maps';
                const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                const coordinates = coordMatch ? `Lat: ${coordMatch[1]}, Lng: ${coordMatch[2]}` : '';

                return {
                    url: cleanUrl,
                    finalUrl,
                    title: resolvedName,
                    type: 'GOOGLE_MAPS_LOCATION',
                    description: `Lokasi / Tempat Google Maps: ${resolvedName} ${coordinates ? `(${coordinates})` : ''}`,
                    snippet: `User membagikan link lokasi Google Maps untuk "${resolvedName}". Berikan ulasan/respon informatif mengenai tempat/rental/lokasi ini (seperti perkiraan area di Semarang/Jateng, layanan yang disediakan, dsb).`,
                    success: true
                };
            }

            // 4. INSTAGRAM POST / REEL RESOLVER
            if (cleanUrl.includes('instagram.com')) {
                return {
                    url: cleanUrl,
                    finalUrl,
                    title: title || 'Postingan Instagram',
                    type: 'INSTAGRAM_CONTENT',
                    description: description || 'Konten / Reel Instagram',
                    snippet: `User mengirim link Instagram: "${title}". Deskripsi: "${description}". Tanggapi konten ini secara santai dan sesuai topik obrolan.`,
                    success: true
                };
            }

            // 5. GENERAL WEB & MARKETPLACE
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
                snippet: cleanBody || description || title,
                success: true
            };
        } catch (e) {
            return {
                url,
                title: 'Tautan / Link',
                type: 'GENERAL_WEB',
                snippet: `User membagikan link (${url}). Tanggapi link ini dengan ramah dan tanyakan apa yang ingin dibahas dari link tersebut.`,
                success: true
            };
        }
    }

    static formatLinkContext(linkData) {
        if (!linkData || !linkData.success) return '';
        if (linkData.type === 'GOOGLE_MAPS_LOCATION') {
            return `=== INFORMASI LOKASI GOOGLE MAPS (URL: ${linkData.url}) ===\n📍 Nama Tempat: "${linkData.title}"\n📝 Detail: ${linkData.description}\n💡 Instruksi: User baru saja mengirim link lokasi Google Maps untuk tempat ini. Jelaskan nama tempat dan lokasi/kesannya secara langsung dan akurat!\n=============================================================`;
        }
        if (linkData.type === 'TIKTOK_VIDEO') {
            return `=== INFORMASI VIDEO TIKTOK (URL: ${linkData.url}) ===\n🎬 Judul Video: "${linkData.title}"\n👤 Kreator: ${linkData.author}\n💡 Instruksi: User membagikan video TikTok ini. Bahas dan tanggapi isi video ini dengan seru!\n===================================================`;
        }
        if (linkData.type === 'INSTAGRAM_CONTENT') {
            return `=== INFORMASI KONTEN INSTAGRAM (URL: ${linkData.url}) ===\n📸 Judul/Caption: "${linkData.title}"\n📝 Detail: ${linkData.description}\n💡 Instruksi: User membagikan link Instagram ini. Bahas postingan/reel ini dengan santai!\n=======================================================`;
        }
        return `=== HASIL BACA LINK / WEB (URL: ${linkData.url}) ===\nJudul: "${linkData.title}"\nDeskripsi: "${linkData.description}"\nRingkasan Isi:\n${linkData.snippet}\n======================================================`;
    }
}
