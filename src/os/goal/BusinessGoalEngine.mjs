/**
 * BusinessGoalEngine.mjs
 * 
 * Translates high-level business desires into structured execution DAGs:
 * USER GOAL -> BUSINESS GOAL -> BREAKDOWN -> PLAN -> TOOLS -> EXECUTE -> VERIFY -> MEASURE -> ADAPT
 */

export class BusinessGoalEngine {
    static GOAL_TEMPLATES = {
        'INCREASE_REPEAT_CUSTOMERS': {
            id: 'GOAL_REPEAT_CUSTOMERS',
            name: 'Meningkatkan Repeat Order Pelanggan Toko',
            subgoals: [
                { id: 'SUB_IDENTIFY_INACTIVE', objective: 'Mengidentifikasi pelanggan yang tidak order > 30 hari', tool: 'crm.findInactiveCustomers' },
                { id: 'SUB_SEGMENT_BUYERS', objective: 'Segmentasi pelanggan berdasarkan frekuensi & produk favorit', tool: 'analytics.segmentBuyers' },
                { id: 'SUB_PREPARE_OFFER', objective: 'Menyiapkan rekomendasi penawaran khusus / voucher pengingat', tool: 'crm.prepareReengagementOffer' },
                { id: 'SUB_DRAFT_MESSAGES', objective: 'Menyusun draf pesan personal untuk tiap segmen', tool: 'order.createDraft' },
                { id: 'SUB_REQUEST_APPROVAL', objective: 'Meminta persetujuan Bos Agus sebelum pengiriman', tool: 'approval.requestCampaignApproval' },
                { id: 'SUB_EXECUTE_CAMPAIGN', objective: 'Mengirimkan pesan penawaran yang sudah disetujui', tool: 'message.broadcast' },
                { id: 'SUB_MEASURE_RESPONSE', objective: 'Mengukur rasio respon dan pesanan masuk', tool: 'analytics.measureConversion' }
            ]
        },
        'OPTIMIZE_INVENTORY_RESTOCK': {
            id: 'GOAL_INVENTORY_RESTOCK',
            name: 'Pencegahan Kehabisan Stok & Pengadaan Otomatis',
            subgoals: [
                { id: 'SUB_CHECK_LOW_STOCK', objective: 'Pindai SKU yang mendekati batas buffer minimum', tool: 'inventory.checkLowStock' },
                { id: 'SUB_ESTIMATE_RUNOUT', objective: 'Hitung estimasi hari habis berdasarkan run rate 7 hari terakhir', tool: 'analytics.estimateDepletion' },
                { id: 'SUB_DRAFT_PO', objective: 'Buat draf Purchase Order ke suplier utama', tool: 'order.createPurchaseOrderDraft' },
                { id: 'SUB_APPROVAL_PO', objective: 'Kirim kartu approval nilai PO ke Bos Agus', tool: 'approval.requestPOApproval' }
            ]
        },
        'FINANCIAL_RECONCILIATION': {
            id: 'GOAL_FINANCIAL_RECON',
            name: 'Rekonsiliasi Harian Kas & Penjualan',
            subgoals: [
                { id: 'SUB_COLLECT_TX', objective: 'Kumpulkan semua transaksi masuk hari ini', tool: 'finance.getDailyTransactions' },
                { id: 'SUB_VERIFY_MUTATION', objective: 'Cocokkan nominal pesanan dengan mutasi rekening/kas', tool: 'finance.verifyReconciliation' },
                { id: 'SUB_REPORT_DISCREPANCY', objective: 'Laporkan ringkasan bersih dan selisih jika ada', tool: 'finance.generateReport' }
            ]
        }
    };

    /**
     * Parse natural language user request into a structured Business Goal
     */
    static parseGoal(text) {
        const clean = (text || '').trim().toLowerCase();

        if (/repeat|pelanggan.*(?:lama|pasif)|(?:nggak|tidak|belum)\s*order|loyalitas|re-?order|promosi\s*pelanggan/i.test(clean)) {
            return {
                matched: true,
                goal: this.GOAL_TEMPLATES.INCREASE_REPEAT_CUSTOMERS,
                rationale: 'Permintaan bertujuan mengaktifkan kembali pelanggan yang sudah lama tidak berbelanja.'
            };
        }

        if (/stok\s*habis|kulakan|restock|suplier|order\s*barang|tambah\s*stok/i.test(clean)) {
            return {
                matched: true,
                goal: this.GOAL_TEMPLATES.OPTIMIZE_INVENTORY_RESTOCK,
                rationale: 'Permintaan bertujuan memastikan kesinambungan pasokan barang tanpa kehabisan stok.'
            };
        }

        if (/rekap\s*kas|rekonsiliasi|laporan\s*keuangan|cek\s*selisih|tutup\s*buku/i.test(clean)) {
            return {
                matched: true,
                goal: this.GOAL_TEMPLATES.FINANCIAL_RECONCILIATION,
                rationale: 'Permintaan bertujuan mencocokkan arus kas fisik dengan data pesanan tercatat.'
            };
        }

        // Generic Ad-hoc Goal Breakdown
        return {
            matched: false,
            goal: {
                id: 'GOAL_ADHOC',
                name: text.slice(0, 50),
                subgoals: [
                    { id: 'SUB_DISCOVER', objective: 'Klarifikasi cakupan dan batasan tugas', tool: 'agent.clarify' },
                    { id: 'SUB_EVALUATE', objective: 'Analisis kelayakan dan risiko eksekusi', tool: 'policy.evaluate' },
                    { id: 'SUB_EXECUTE', objective: 'Jalankan tindakan terverifikasi', tool: 'agent.execute' }
                ]
            },
            rationale: 'Tujuan ad-hoc dengan alur eksplorasi terpandu.'
        };
    }
}
