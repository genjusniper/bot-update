/**
 * GoogleScraperProvider (via SerpApi)
 * Mengambil data bisnis asli dari Google Maps API menggunakan SerpApi.
 */

export class GoogleScraperProvider {
    constructor(apiKey) {
        // Gunakan key dari param atau fallback ke key baru yang dikirim user
        this.apiKey = apiKey || process.env.SERPAPI_KEY || "b092b3a811388a14aab6bd8dc7962e15b226c8328fe06bfb733098b629b41851";
    }

    async search(query, limit = 1) {
        console.log(`[Scraper] 🔎 Mencari di Google Maps (SerpApi): "${query}" (Limit: ${limit})`);
        
        try {
            // Kita pakai Google Maps engine dari SerpApi
            const q = encodeURIComponent(query);
            const url = `https://serpapi.com/search.json?engine=google_maps&q=${q}&api_key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) throw new Error(data.error);
            if (!data.local_results || data.local_results.length === 0) {
                console.log("[Scraper] ❌ Tidak ada hasil ditemukan.");
                return [];
            }

            // Ambil sesuai limit
            return data.local_results.slice(0, limit).map(place => this._formatPlace(place));
        } catch (error) {
            console.error("[Scraper] ❌ Gagal mencari data via SerpApi:", error.message);
            // Fallback ke mock jika gagal
            return this._getMockData(limit);
        }
    }

    _formatPlace(place) {
        return {
            businessName: place.title || 'Usaha Tanpa Nama',
            businessCategory: place.type || 'Lokal Bisnis',
            location: place.address || 'Lokasi tidak diketahui',
            publicContact: place.phone || null,
            contactPermission: "UNKNOWN",
            source: {
                sourceType: 'SERPAPI_MAPS',
                sourceRef: place.place_id || 'unknown_place_id',
                capturedAt: new Date().toISOString()
            }
        };
    }

    _getMockData(limit) {
        const mocks = [
            {
                businessName: "RM Padang Bundo Kanduang",
                businessCategory: "Restoran, Minang",
                location: "Jl. Margonda Raya, Depok",
                publicContact: "+6281299998888",
                contactPermission: "UNKNOWN",
                source: {
                    sourceType: 'MOCK_DATA',
                    sourceRef: 'mock-1',
                    capturedAt: new Date().toISOString()
                }
            },
            {
                businessName: "RM Padang Bundo Kanduang (Cabang)",
                businessCategory: "Restoran, Minang",
                location: "Jl. Margonda Raya No 2, Depok",
                publicContact: "+6281299998888", // Same phone -> Duplicate trigger
                contactPermission: "UNKNOWN",
                source: {
                    sourceType: 'MOCK_DATA',
                    sourceRef: 'mock-2',
                    capturedAt: new Date().toISOString()
                }
            },
            {
                businessName: "Toko Elektronik Makmur",
                businessCategory: "Elektronik",
                location: "Jl. Sudirman",
                publicContact: "+628111222333",
                contactPermission: "UNKNOWN",
                source: {
                    sourceType: 'MOCK_DATA',
                    sourceRef: 'mock-3',
                    capturedAt: new Date().toISOString()
                }
            }
        ];
        return mocks.slice(0, limit);
    }
}
