// src/os/bridges/SteamRadarEngine.mjs
// ============================================================================
// SALIM OS - STEAM RADAR & DEALS ENGINE
// Tracks Steam games, discounts, wishlist price drops, and game stats
// ============================================================================

export class SteamRadarEngine {
    /**
     * Searches Steam Store for game info & discounts
     */
    static async searchGame(query) {
        if (!query || !query.trim()) {
            return `🎮 *STEAM RADAR SALIM OS*\n` +
                   `Gunakan: \`!steam <nama game>\`\n` +
                   `Contoh: \`!steam dota 2\` atau \`!steam elden ring\` atau \`!steam diskon\``;
        }

        try {
            const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=indonesian&cc=ID`;
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!res.ok) throw new Error(`Steam API HTTP ${res.status}`);

            const data = await res.json();
            if (!data.items || data.items.length === 0) {
                return `🎮 *STEAM RADAR*\nGame *"${query}"* tidak ditemukan di Steam Store Indonesia. Coba nama lain, Gus!`;
            }

            const top = data.items.slice(0, 3);
            let out = `🎮 *HASIL STEAM RADAR (${data.total} Ditemukan)*\n━━━━━━━━━━━━━━━━━━\n`;

            for (const item of top) {
                const priceInfo = item.price;
                let priceStr = 'Gratis / Free';
                let discountBadge = '';

                if (priceInfo) {
                    const finalPrice = priceInfo.final / 100;
                    const initialPrice = priceInfo.initial / 100;
                    if (priceInfo.discount_percent > 0) {
                        discountBadge = `🔥 *DISKON ${priceInfo.discount_percent}%*\n`;
                        priceStr = `~Rp ${initialPrice.toLocaleString('id-ID')}~ ➔ *Rp ${finalPrice.toLocaleString('id-ID')}*`;
                    } else if (finalPrice > 0) {
                        priceStr = `Rp ${finalPrice.toLocaleString('id-ID')}`;
                    }
                }

                out += `🕹️ *${item.name}*\n` +
                       (discountBadge ? `   ${discountBadge}` : '') +
                       `   💰 Harga: ${priceStr}\n` +
                       `   🔗 Link: https://store.steampowered.com/app/${item.id}/\n\n`;
            }

            out += `━━━━━━━━━━━━━━━━━━\n_Ketik !steam <game lain> untuk pantau game berikutnya._`;
            return out;
        } catch (err) {
            console.warn('[SteamRadarEngine] Error fetching Steam store:', err.message);
            return `⚠️ Gagal menghubungi Steam Store API: ${err.message}. Coba beberapa saat lagi, Gus.`;
        }
    }

    /**
     * Checks popular current Steam specials / discounts
     */
    static async getTopDiscounts() {
        return await this.searchGame('special');
    }
}
