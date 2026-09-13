// src/os/finance/SplitBillCalculator.mjs
// Smart Split Bill Calculator for Salim OS
// Computes fair share per person with tax/service and formats polite WhatsApp payment broadcast

export class SplitBillCalculator {
    /**
     * Parses amount in Indonesian formats (240k, 240rb, 240.000, 240000)
     * @param {string} raw 
     * @returns {number}
     */
    static parseAmount(raw) {
        if (!raw) return 0;
        let s = raw.toLowerCase().replace(/rp/g, '').trim();
        if (s.endsWith('jt') || s.endsWith('juta')) {
            const num = parseFloat(s.replace(/(?:jt|juta)/g, '').replace(/,/g, '.'));
            return Math.round(num * 1000000);
        }
        if (s.endsWith('k') || s.endsWith('rb') || s.endsWith('ribu')) {
            const num = parseFloat(s.replace(/(?:k|rb|ribu)/g, '').replace(/,/g, '.'));
            return Math.round(num * 1000);
        }
        const cleaned = s.replace(/\./g, '').replace(/,/g, '');
        return parseInt(cleaned, 10) || 0;
    }

    /**
     * Parses natural split bill command
     * e.g. "!splitbill 240000 4", "!splitbill 300rb Hanif Cindy Salim Budi", "!splitbill 150rb pajak 10% 3"
     * @param {string} text 
     * @returns {string | null}
     */
    static handleCommand(text = '') {
        if (!text) return null;
        const clean = text.trim();

        const triggerRegex = /^(?:!splitbill|!patungan|(?:tolong\s+)?(?:hitung\s+)?patungan)\s+/i;
        if (!triggerRegex.test(clean)) return null;

        const body = clean.replace(triggerRegex, '').trim();
        const tokens = body.split(/\s+/);

        if (tokens.length < 2) {
            return `❓ *Format Split Bill Salah*\n\nGunakan format:\n• \`!splitbill 240000 4\` (nominal & jumlah orang)\n• \`!splitbill 300rb Hanif Cindy Salim Budi\` (dengan nama teman)\n• \`!splitbill 200rb pajak 10% 4\` (dengan pajak)`;
        }

        // 1. First token is amount
        let baseAmount = this.parseAmount(tokens[0]);
        if (baseAmount <= 0) {
            return `❌ Nominal tagihan "${tokens[0]}" tidak valid. Contoh: \`!splitbill 240000 4\` atau \`!splitbill 150rb 3\``;
        }

        let taxPercent = 0;
        let remainingTokens = tokens.slice(1);

        // Check for tax / service
        const taxIdx = remainingTokens.findIndex(t => /^(?:pajak|tax|ppn|service)$/i.test(t));
        if (taxIdx !== -1 && remainingTokens[taxIdx + 1]) {
            const taxStr = remainingTokens[taxIdx + 1].replace('%', '');
            taxPercent = parseFloat(taxStr) || 0;
            remainingTokens.splice(taxIdx, 2);
        }

        if (remainingTokens.length === 0) {
            return `❌ Mohon tentukan jumlah orang atau nama-nama teman. Contoh: \`!splitbill 240000 4\``;
        }

        let people = [];
        // If remaining is a single number (e.g. "4" or "4 orang")
        if (remainingTokens.length === 1 || (remainingTokens.length === 2 && remainingTokens[1].toLowerCase() === 'orang')) {
            const count = parseInt(remainingTokens[0], 10);
            if (count > 1) {
                for (let i = 1; i <= count; i++) {
                    people.push(`Orang ke-${i}`);
                }
            }
        }

        // If not a single number, treat tokens as names (e.g. "Hanif", "Cindy", "Salim", "Budi")
        if (people.length === 0) {
            people = remainingTokens.filter(t => !/^(?:orang|bagi|dan)$/i.test(t));
        }

        if (people.length < 2) {
            return `❌ Pembagian split bill minimal untuk 2 orang ya Bos.`;
        }

        // Total with tax
        const taxAmount = Math.round((baseAmount * taxPercent) / 100);
        const totalWithTax = baseAmount + taxAmount;

        // Per person share rounded up to nearest 100 for easy transfer
        const rawShare = totalWithTax / people.length;
        const perPerson = Math.ceil(rawShare / 100) * 100;

        let out = `🧾 *RINCIAN PATUNGAN / SPLIT BILL* 🧾\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `💵 *Total Tagihan Dasar:* Rp ${baseAmount.toLocaleString('id-ID')}\n`;

        if (taxPercent > 0) {
            out += `🏷️ *Pajak / Service (${taxPercent}%):* Rp ${taxAmount.toLocaleString('id-ID')}\n` +
                   `💰 *Total Keseluruhan:* Rp ${totalWithTax.toLocaleString('id-ID')}\n`;
        }

        out += `👥 *Total Orang:* ${people.length} orang\n` +
               `👉 *Tagihan Per Orang:* *Rp ${perPerson.toLocaleString('id-ID')}*\n` +
               `━━━━━━━━━━━━━━━━━━\n` +
               `📋 *Daftar Pembagian:*\n`;

        people.forEach((name, idx) => {
            out += `${idx + 1}. *${name}:* Rp ${perPerson.toLocaleString('id-ID')}\n`;
        });

        out += `━━━━━━━━━━━━━━━━━━\n` +
               `💳 *Info Transfer / QRIS:*\n` +
               `Silakan transfer pas Rp ${perPerson.toLocaleString('id-ID')} ke rekening Bos Agus Salim ya teman-teman. Terima kasih! 🙏✨\n` +
               `━━━━━━━━━━━━━━━━━━\n` +
               `_Pesan ini siap di-forward ke grup obrolan._`;

        return out;
    }
}
