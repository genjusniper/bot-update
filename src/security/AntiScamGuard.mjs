// src/security/AntiScamGuard.mjs
// Anti-Scam & Malware APK Shield for Salim OS
// Detects Android APK trojans, phishing lures (undangan nikah, kurir paket, surat tilang), and malicious links

export class AntiScamGuard {
    static KNOWN_APK_MODUS = [
        { pattern: /(?:surat\s+)?undangan(?:\s+pernikahan|\s+digital|\s+nikah)?/i, modus: 'Malware Berkedok Undangan Nikah (Sniffer SMS/OTP)' },
        { pattern: /(?:paket|resi|j&t|jne|sicepat|pos|anteraja|ninja|spx)/i, modus: 'Malware Berkedok Cek Resi / Foto Paket Kurir' },
        { pattern: /(?:tilang|surat\s+tilang|etle|polisi|korlantas)/i, modus: 'Malware Berkedok Surat Konfirmasi Tilang Elektronik (ETLE)' },
        { pattern: /(?:tagihan|pln|pdam|bpjs|pajak|djp)/i, modus: 'Malware Berkedok Surat Tagihan / SPT Pajak' },
        { pattern: /(?:update|pembaruan|aplikasi)\s+(?:bca|mandiri|bri|bni|bsi|dana|ovo|gopay)/i, modus: 'Malware Berkedok Update Aplikasi Perbankan / E-Wallet Palsu' },
        { pattern: /(?:bansos|bantuan\s+sosial|prakerja|blt|subsidi)/i, modus: 'Phishing Berkedok Bantuan Pemerintah / Bansos' }
    ];

    /**
     * Inspects incoming message for malware APK or deceptive scam patterns
     * @param {any} rawMsg Baileys proto.IWebMessageInfo
     * @param {string} senderJid
     * @param {string} chatJid
     * @param {string} messageText
     * @returns {{ isScam: boolean, threatType?: string, fileName?: string, modus?: string, warningText?: string }}
     */
    static inspect(rawMsg, senderJid, chatJid, messageText = '') {
        const msg = rawMsg?.message;
        if (!msg) return { isScam: false };

        let isApk = false;
        let fileName = '';
        let detectedModus = 'Potensi Malware Android (APK)';

        // 1. Check Document Message
        const doc = msg.documentMessage || msg.documentWithCaptionMessage?.message?.documentMessage;
        if (doc) {
            fileName = (doc.fileName || '').trim();
            const mimetype = (doc.mimetype || '').toLowerCase();

            if (
                fileName.toLowerCase().endsWith('.apk') ||
                fileName.toLowerCase().endsWith('.xapk') ||
                mimetype.includes('application/vnd.android.package-archive') ||
                mimetype.includes('application/x-zip-compressed') && fileName.toLowerCase().endsWith('.apk')
            ) {
                isApk = true;
            }
        }

        // 2. Check Text for direct .apk download link or suspicious shortened links
        const text = (messageText || '').trim();
        const hasApkLink = /https?:\/\/[^\s]+\.apk(?:[^\s]*)/i.test(text);
        const hasSuspiciousShortener = /https?:\/\/(?:bit\.ly|s\.id|cutt\.ly|tinyurl\.com|linktr\.ee|is\.gd|v\.gd)\/[^\s]+/i.test(text);

        // Identify modus from fileName or text
        const targetString = `${fileName} ${text}`;
        for (const item of this.KNOWN_APK_MODUS) {
            if (item.pattern.test(targetString)) {
                detectedModus = item.modus;
                break;
            }
        }

        if (isApk || hasApkLink) {
            const warningText = `🚨🚨 *PERINGATAN KEAMANAN: MALWARE APK TERDETEKSI!* 🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *Awas Bahaya Sniffer Android!*
Ditemukan file / link instalasi aplikasi (*.apk*) yang berisiko tinggi mencuri SMS, OTP, dan saldo rekening:

📁 *Nama File:* \`${fileName || 'File APK Eksternal'}\`
👤 *Pengirim:* \`${senderJid}\`
🎯 *Indikasi Modus:* *${detectedModus}*

🛡️ *PETUNJUK KEAMANAN SALIM OS:*
1. ⛔ *JANGAN PERNAH KLIK / INSTALL FILE INI!*
2. Jika terlanjur ter-install, segera matikan koneksi internet (Airplane mode) dan uninstall aplikasi dari Settings.
3. Ingatkan anggota grup lain agar tidak menjadi korban penipuan.
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Dilindungi oleh AntiScam Shield Salim OS_`;

            return {
                isScam: true,
                threatType: 'APK_MALWARE',
                fileName: fileName || 'unknown.apk',
                modus: detectedModus,
                warningText
            };
        }

        // 3. Check for obvious phishing text patterns even without direct file attachment
        if (hasSuspiciousShortener) {
            for (const item of this.KNOWN_APK_MODUS) {
                if (item.pattern.test(text)) {
                    const warningText = `⚠️ *PERINGATAN PHISHING / LINK MENCURIGAKAN!* ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━
Tautan tautan singkat mencurigakan terdeteksi berkedok:
👉 *${item.modus}*

👤 *Pengirim:* \`${senderJid}\`
📝 *Cuplikan Pesan:* "${text.substring(0, 120)}..."

🛡️ *Rekomendasi:* Jangan klik link tersebut untuk menghindari pencurian data akun atau unduhan malware otomatis.
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Shield Keamanan Salim OS_`;

                    return {
                        isScam: true,
                        threatType: 'PHISHING_LINK',
                        modus: item.modus,
                        warningText
                    };
                }
            }
        }

        return { isScam: false };
    }
}
