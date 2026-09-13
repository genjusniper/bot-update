/**
 * OrderBookingExtractor.mjs
 * 
 * Extracts structured order and booking details from natural chat.
 * Generates instant, beautiful WhatsApp invoice / booking receipts.
 */

export class OrderBookingExtractor {
    /**
     * Inspect if incoming text contains an ordering or booking intent
     */
    static isOrderIntent(text) {
        const clean = (text || '').toLowerCase();
        return /\b(?:pesan|order|beli|ambil|booking|sewa|jadwal|mau\s*ambil|mau\s*pesan|transfer\s*ke\s*mana)\b/i.test(clean);
    }

    /**
     * Extract structured data from order conversation
     */
    static extractOrder({ text, catalog = [], tenantName = 'Toko' }) {
        const clean = (text || '').trim();
        const matchedItems = [];

        // Match items against catalog
        for (const prod of catalog) {
            const prodRegex = new RegExp(`\\b${prod.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            const simpleKeywords = prod.name.toLowerCase().split(' ').filter(w => w.length > 3);
            
            let matched = prodRegex.test(clean);
            if (!matched && simpleKeywords.length > 0) {
                matched = simpleKeywords.some(k => clean.toLowerCase().includes(k));
            }

            if (matched) {
                // Check quantity
                const qtyMatch = clean.match(new RegExp(`(\\d+)\\s*(?:pcs|biji|buah|unit|lembar|porsi|pasang)?\\s*${prod.name}`, 'i')) ||
                                 clean.match(new RegExp(`${prod.name}\\s*(\\d+)\\s*(?:pcs|biji|buah|unit)?`, 'i')) ||
                                 clean.match(/\b(\d+)\s*(?:pcs|biji|buah|unit)\b/i);
                const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
                matchedItems.push({
                    id: prod.id,
                    name: prod.name,
                    price: prod.price,
                    qty: Math.max(1, qty),
                    subtotal: prod.price * Math.max(1, qty)
                });
            }
        }

        // Extract destination / address if provided
        const addrMatch = clean.match(/(?:alamat|kirim\s*ke|lokasi)\s*[:=]?\s*([^,\n.]{5,80})/i);
        const address = addrMatch ? addrMatch[1].trim() : null;

        // Calculate total
        const totalAmount = matchedItems.reduce((acc, item) => acc + item.subtotal, 0);

        return {
            hasItems: matchedItems.length > 0,
            items: matchedItems,
            totalAmount,
            address,
            formattedInvoice: this.formatInvoice({
                tenantName,
                items: matchedItems,
                totalAmount,
                address
            })
        };
    }

    /**
     * Format clean WhatsApp invoice receipt
     */
    static formatInvoice({ tenantName, items, totalAmount, address, paymentAccounts = [] }) {
        if (!items || items.length === 0) return null;

        const itemsList = items
            .map((it, idx) => `${idx + 1}. *${it.name}* (x${it.qty})\n   ↳ Rp ${it.subtotal.toLocaleString('id-ID')}`)
            .join('\n');

        let invoice = `🧾 *RINGKASAN PESANAN — ${tenantName.toUpperCase()}*\n` +
                      `──────────────────────\n` +
                      `${itemsList}\n` +
                      `──────────────────────\n` +
                      `💰 *TOTAL TAGIHAN:* *Rp ${totalAmount.toLocaleString('id-ID')}*\n`;

        if (address) {
            invoice += `📍 *Tujuan Kirim:* ${address}\n`;
        }

        invoice += `\nSilakan transfer ke salah satu rekening kami:\n` +
                   `• *BCA:* 8410928371 a/n Agus Salim\n` +
                   `• *Mandiri:* 1370018291029 a/n Agus Salim\n\n` +
                   `_Setelah transfer, kirimkan foto bukti transfer di sini ya biar langsung kami proses!_ 🙏`;

        return invoice;
    }
}
