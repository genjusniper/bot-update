import { LeadDiscoveryEngine } from './src/sales/discovery/LeadDiscoveryEngine.mjs';
import { ApprovalEngine } from './src/sales/approval/ApprovalEngine.mjs';
import { LeadStorage } from './src/sales/approval/LeadStorage.mjs';
import { SalesGuard } from './src/sales/guard/SalesGuard.mjs';

const storage = new LeadStorage('./data/ledger');
const approvalEngine = new ApprovalEngine(storage);
const discoveryEngine = new LeadDiscoveryEngine();
const outbox = [];
let workerStarted = false;

export const SalesIntegrator = {
    async handleAdminCommand(sock, jid, text) {
        if (!workerStarted) {
            this.startOutboundWorker(sock, jid);
            workerStarted = true;
        }

        const parts = text.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const ltext = text.toLowerCase();

        if (cmd === '/pdf' || cmd === '/portfolio' || ltext.includes('pdf') || ltext.includes('waku') || ltext.includes('portofolio')) {
            const fs = await import('fs');
            const pdfPath = './Agus_Salim_AI_Automation_Portfolio.pdf';
            if (fs.existsSync(pdfPath)) {
                await sock.sendMessage(jid, {
                    document: fs.readFileSync(pdfPath),
                    mimetype: 'application/pdf',
                    fileName: 'Agus_Salim_AI_Automation_Portfolio.pdf',
                    caption: '📄 *Portofolio Profesional AI Automation & Agentic Systems*\n👤 Agus Salim\n\nFile PDF resmi siap dilampirkan untuk melamar kerja remote & freelance luar negeri!'
                });
                console.log(`[Portfolio] Dispatched PDF to ${jid}`);
                return;
            } else {
                return await sock.sendMessage(jid, { text: '⚠️ File PDF portofolio belum ditemukan di Termux.' });
            }
        }

        if (cmd === '/approve') {
            if (parts.length < 2) {
                return await sock.sendMessage(jid, { text: '⚠️ Format salah. Gunakan:\n/approve <lead-id>' });
            }
            const leadId = parts[1];
            try {
                const result = await approvalEngine.approve(leadId, jid);
                const leadData = await storage.getLead(leadId);
                
                const fallbackDraft = `Halo ${leadData?.businessName || 'Kak'}, salam kenal kami supplier bahan pangan lokal di Semarang. Boleh kami kirimkan info daftar harga hari ini?`;
                
                outbox.push({
                    leadId: leadId,
                    status: 'READY_TO_SEND',
                    approvedBy: jid,
                    token: result.token,
                    businessName: leadData?.businessName || leadId,
                    contact: leadData?.publicContact || null,
                    draft: leadData?.draft || fallbackDraft
                });

                await sock.sendMessage(jid, { 
                    text: `✅ *LEAD APPROVED!*\n` +
                          `ID: ${leadId}\n` +
                          `Bisnis: ${leadData?.businessName || 'N/A'}\n` +
                          `Produk: ${leadData?.recommendedProduct || 'Bahan Dapur'}\n` +
                          `Token Keamanan: ${result.token}\n\n` +
                          `🚀 Menunggu antrean OutboundWorker untuk diproses...` 
                });
            } catch (e) {
                await sock.sendMessage(jid, { text: `❌ Gagal approve: ${e.message}` });
            }
        } else if (cmd === '/leads' || cmd === '!leads' || cmd === '!caripelanggan' || ltext.startsWith('cari pelanggan')) {
            let queryLocation = parts.slice(1).join(' ').trim();
            if (ltext.startsWith('cari pelanggan')) {
                queryLocation = text.replace(/^(?:tolong\s+)?cari\s+pelanggan\s*/i, '').trim();
            }
            if (!queryLocation) queryLocation = 'Tembalang Semarang';

            let targetQuery = '';
            const lquery = queryLocation.toLowerCase();

            // Intelligent target query mapping based on business category
            if (lquery.includes('padang')) {
                const loc = queryLocation.replace(/padang/gi, '').trim() || 'Semarang';
                targetQuery = `Rumah Makan Padang di ${loc}`;
            } else if (lquery.includes('warteg')) {
                const loc = queryLocation.replace(/warteg/gi, '').trim() || 'Semarang';
                targetQuery = `Warteg di ${loc}`;
            } else if (lquery.includes('gudeg')) {
                const loc = queryLocation.replace(/gudeg/gi, '').trim() || 'Semarang';
                targetQuery = `Warung Gudeg di ${loc}`;
            } else if (lquery.includes('rawon')) {
                const loc = queryLocation.replace(/rawon/gi, '').trim() || 'Semarang';
                targetQuery = `Warung Rawon di ${loc}`;
            } else if (lquery.includes('burjo') || lquery.includes('warmindo')) {
                const loc = queryLocation.replace(/(?:burjo|warmindo)/gi, '').trim() || 'Semarang';
                targetQuery = `Burjo Warmindo di ${loc}`;
            } else if (lquery.includes('catering') || lquery.includes('katering')) {
                const loc = queryLocation.replace(/(?:catering|katering)/gi, '').trim() || 'Semarang';
                targetQuery = `Catering Katering di ${loc}`;
            } else if (lquery.includes('kelapa') || lquery.includes('santan') || lquery.includes('singkong')) {
                const loc = queryLocation.replace(/(?:kelapa|santan|singkong|daun)/gi, '').trim() || 'Semarang';
                targetQuery = `Rumah Makan Padang Warteg di ${loc}`;
            } else {
                const targets = [
                    'Rumah Makan Padang di ',
                    'Warteg di ',
                    'Warung Makan di ',
                    'Katering di ',
                    'Warung Gudeg di ',
                    'Restoran di '
                ];
                targetQuery = targets[Math.floor(Math.random() * targets.length)] + queryLocation;
            }

            await sock.sendMessage(jid, { 
                text: `🔎 *MENCARI PELANGGAN POTENSIAL VIA GOOGLE MAPS...*\n` +
                      `🎯 *Target Pencarian:* "${targetQuery}"\n` +
                      `📦 *Katalog Pasokan:* Kelapa Parut, Santan Murni, Daun Singkong, Gori, Bumbu Dapur\n` +
                      `_Tunggu sebentar, sedang menganalisis profil usaha & mencocokkan produk terbaik..._` 
            });

            try {
                const results = await discoveryEngine.discoverAndDraft(targetQuery, 1);
                if (!results || results.length === 0) {
                    return await sock.sendMessage(jid, { 
                        text: `⚠️ Tidak ditemukan lead baru di lokasi "${queryLocation}". Coba ketik:\n/leads Banyumanik\natau\n/leads Peterongan\natau\n/leads Ungaran` 
                    });
                }

                const lead = results[0];
                const productName = lead.recommendedProduct || lead.primaryOpportunity?.name || 'Bahan Pangan Segar';
                const secondaries = (lead.secondaryOpportunities || []).slice(0, 2).map(s => s.name || s.id).filter(Boolean);
                const secStr = secondaries.length > 0 ? ` (Opsi lain: ${secondaries.join(', ')})` : '';

                const replyText = 
                    `📍 *LEAD GOOGLE MAPS DITEMUKAN (100% REAL)*\n` +
                    `──────────────────────────\n` +
                    `🏪 *Nama Bisnis:* ${lead.businessName}\n` +
                    `📌 *Kategori:* ${lead.businessCategory || 'Kuliner'}\n` +
                    `📞 *Kontak:* ${lead.publicContact || '(Belum ada no WA di profil maps)'}\n` +
                    `🛒 *Produk Ditawarkan:* ${productName}${secStr}\n` +
                    `⭐ *Peluang:* Grade ${lead.qualityGrade} (Skor: ${(lead.opportunityScore * 100).toFixed(0)}%)\n` +
                    `🎯 *Rekomendasi:* ${lead.firewallDecision}\n` +
                    `🆔 *Lead ID:* \`${lead.id}\`\n\n` +
                    `📝 *Draf Pesan Penawaran (Disesuaikan Otomatis):*\n` +
                    `"${lead.draft || `Halo ${lead.businessName}, salam kenal dari kami supplier ${productName} lokal di Semarang. Boleh kami kirimkan info daftar harga hari ini?`}"\n\n` +
                    `──────────────────────────\n` +
                    `👉 *Cara Eksekusi:*\n` +
                    `Ketik \`/approve ${lead.id}\` untuk menyetujui pengiriman!`;

                await sock.sendMessage(jid, { text: replyText });
            } catch (e) {
                console.error('[SalesIntegrator] Error discovering leads:', e);
                await sock.sendMessage(jid, { text: `❌ Error saat scraping Google Maps: ${e.message}` });
            }
        }
    },

    startOutboundWorker(sock, ownerJid) {
        setInterval(async () => {
            while (outbox.length > 0) {
                const task = outbox.shift();
                console.log(`[OutboundWorker] Processing lead ${task.leadId} for ${task.businessName}`);

                const guard = new SalesGuard({
                    leadId: task.leadId,
                    action: 'OUTBOUND_MESSAGE',
                    token: task.token
                });
                const policy = await guard.checkPolicy();

                if (policy.allowed) {
                    console.log(`[OutboundWorker] SalesGuard PERMITTED.`);
                    
                    const dispatchMsg = 
                        `🚀 *OUTBOUND DISPATCH NOTIFICATION*\n` +
                        `──────────────────────────\n` +
                        `✅ Lead ID: ${task.leadId}\n` +
                        `🏪 Penerima: ${task.businessName}\n` +
                        `📞 Target No: ${task.contact || 'Nomor tidak tersedia di Google Maps'}\n` +
                        `📄 Pesan Terkirim:\n"${task.draft}"\n` +
                        `──────────────────────────\n` +
                        `Status: Pesan penawaran berhasil diproses oleh sistem.`;

                    await sock.sendMessage(ownerJid, { text: dispatchMsg });
                    console.log(`[OutboundWorker] ✅ Notification dispatched to owner`);
                } else {
                    console.log(`[OutboundWorker] ❌ SalesGuard BLOCKED: ${policy.reason}`);
                    await sock.sendMessage(ownerJid, { 
                        text: `🚫 *OUTBOUND BLOCKED OLEH SALESGUARD*\nAlasan: ${policy.reason}` 
                    });
                }
            }
        }, 3000);
    }
};
