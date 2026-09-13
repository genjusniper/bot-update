// src/os/bridges/CourierTrackerEngine.mjs
// ============================================================================
// SALIM OS - COURIER & PACKAGE TRACKER ENGINE
// Tracks parcels across JNE, J&T, SiCepat, Shopee Xpress, Pos Indonesia, dll.
// ============================================================================

export class CourierTrackerEngine {
    static SUPPORTED_COURIERS = {
        'jne': 'JNE Express',
        'jnt': 'J&T Express',
        'sicepat': 'SiCepat Ekspres',
        'spx': 'Shopee Xpress',
        'shopee': 'Shopee Xpress',
        'anteraja': 'AnterAja',
        'pos': 'Pos Indonesia',
        'tiki': 'TIKI',
        'wahana': 'Wahana Express',
        'ninja': 'Ninja Xpress'
    };

    /**
     * Parses courier and receipt number from text
     */
    static parseInput(text = '') {
        const cleaned = text.replace(/^!resi\s*/i, '').trim();
        const parts = cleaned.split(/\s+/);
        if (parts.length < 2) {
            return null;
        }
        const courierInput = parts[0].toLowerCase();
        const resi = parts[1].toUpperCase();

        const matchedCourier = Object.keys(this.SUPPORTED_COURIERS).find(k => 
            courierInput.includes(k) || k.includes(courierInput)
        ) || courierInput;

        return {
            courier: matchedCourier,
            courierName: this.SUPPORTED_COURIERS[matchedCourier] || matchedCourier.toUpperCase(),
            resi
        };
    }

    /**
     * Tracks parcel status
     */
    static async track(text = '') {
        const parsed = this.parseInput(text);
        if (!parsed) {
            return (
                `📦 *PELACAK RESI EKSPEDISI SALIM OS*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `Format: \`!resi <kurir> <nomor_resi>\`\n\n` +
                `*Pilihan Kurir Didukung:*\n` +
                `• JNE: \`!resi jne 0123456789\`\n` +
                `• J&T: \`!resi jnt JZ012345678\`\n` +
                `• SiCepat: \`!resi sicepat 001234567\`\n` +
                `• Shopee Xpress: \`!resi spx SPXID012345\`\n` +
                `• AnterAja / Pos / TIKI / Ninja`
            );
        }

        const apiKey = process.env.BINDERBYTE_API_KEY;
        if (apiKey) {
            try {
                const url = `https://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=${parsed.courier}&awi=${parsed.resi}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.status === 200 && data.data) {
                    const d = data.data;
                    const history = (d.history || []).slice(-3).reverse();
                    let historyStr = history.map(h => `• _${h.date}_: ${h.desc}`).join('\n');
                    return (
                        `📦 *STATUS PENGIRIMAN PAKET*\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `Kurir: *${parsed.courierName}*\n` +
                        `No. Resi: *${parsed.resi}*\n` +
                        `Status: *${d.summary.status}*\n` +
                        `Penerima: ${d.detail.receiver}\n` +
                        `Tujuan: ${d.detail.destination}\n\n` +
                        `📍 *Riwayat Perjalanan Terakhir:*\n` +
                        `${historyStr}\n` +
                        `━━━━━━━━━━━━━━━━━━`
                    );
                }
            } catch (apiErr) {
                console.warn('[CourierTrackerEngine] API error:', apiErr.message);
            }
        }

        // Direct web link fallback if no BinderByte key configured
        const trackerLink = `https://cekresi.com/?noresi=${parsed.resi}`;
        return (
            `📦 *STATUS RESI PAKET (${parsed.courierName})*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `No. Resi: *${parsed.resi}*\n` +
            `Kurir: *${parsed.courierName}*\n\n` +
            `🔍 Cek detail checkpoint langsung di portal resmi:\n` +
            `🔗 ${trackerLink}\n\n` +
            `_Tip: Bos juga bisa masukkan BINDERBYTE_API_KEY di .env agar status paket muncul langsung di dalam chat WA tanpa klik link!_`
        );
    }
}
