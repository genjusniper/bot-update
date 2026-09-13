// src/platform/core/UniversalRequestEngine.mjs
// ============================================================================
// SALIM AI OPERATING SYSTEM - UNIVERSAL REQUEST ENGINE ("REQUEST ANYTHING")
// Natural business command decomposition, execution DAG, and outcome reporter
// ============================================================================

import { ToolActionRegistry } from '../tools/ToolActionRegistry.mjs';
import { AIVerificationEngine } from '../engine/AIVerificationEngine.mjs';
import { ActionPermissionEngine } from '../policy/ActionPermissionEngine.mjs';
import { DecisionAuditTrail } from '../audit/DecisionAuditTrail.mjs';

export class UniversalRequestEngine {
    /**
     * Identifies if incoming text is a business command/request
     */
    static isBusinessRequest(text = '') {
        const lower = text.toLowerCase().trim();
        const patterns = [
            /(?:cari|cek|lihat).*?(?:pelanggan|customer).*?(?:belum|lama|nggak|tidak).*?(?:order|beli|pesan)/i,
            /(?:cek|lihat|sisa)\s+stok\s+/i,
            /(?:ubah|ganti)\s+harga\s+/i,
            /(?:bikinin|buatkan|buat)\s+(?:draf\s+)?(?:pesanan|order)\s+/i,
            /(?:refund|kembalikan\s+dana|retur)\s+/i,
            /(?:laporan|rekap)\s+(?:penjualan|omzet|bisnis)/i
        ];
        return patterns.some(p => p.test(lower));
    }

    /**
     * Decomposes natural language request into Intent, Tools, and Parameters
     */
    static decompose(text = '') {
        const lower = text.toLowerCase().trim();

        // 1. Inactive customers query
        if (/(?:cari|cek|lihat).*?(?:pelanggan|customer).*?(?:belum|lama|nggak|tidak).*?(?:order|beli|pesan)/i.test(lower)) {
            return {
                intent: 'CRM_INACTIVE_CUSTOMERS',
                toolName: 'crm.findInactiveCustomers',
                params: { days: 14 }
            };
        }

        // 2. Inventory check
        if (/(?:cek|lihat|sisa)\s+stok\s+/i.test(lower)) {
            const itemMatch = text.match(/(?:cek|lihat|sisa)\s+stok\s+(.+)/i);
            const item = itemMatch ? itemMatch[1].trim() : 'Santan Kelapa';
            return {
                intent: 'INVENTORY_CHECK',
                toolName: 'inventory.checkStock',
                params: { item }
            };
        }

        // 3. Change product price
        if (/(?:ubah|ganti)\s+harga\s+/i.test(lower)) {
            const match = text.match(/(?:ubah|ganti)\s+harga\s+(.+?)\s+(?:jadi|menjadi|=)\s*([0-9.,]+)/i);
            const item = match ? match[1].trim() : 'Produk';
            const price = match ? parseInt(match[2].replace(/\D/g, ''), 10) : 0;
            return {
                intent: 'CHANGE_PRICE',
                toolName: 'product.changePrice',
                params: { item, newPrice: price }
            };
        }

        // 4. Create Order Draft
        if (/(?:bikinin|buatkan|buat)\s+(?:draf\s+)?(?:pesanan|order)\s+/i.test(lower)) {
            const match = text.match(/(?:pesanan|order)\s+(?:buat|untuk)?\s*([^0-9,]+)(.*)/i);
            const customerName = match ? match[1].trim() : 'Pelanggan';
            return {
                intent: 'CREATE_ORDER_DRAFT',
                toolName: 'order.createDraft',
                params: {
                    customerName,
                    items: [{ name: 'Santan Kelapa Murni', qty: 10, price: 15000 }]
                }
            };
        }

        // 5. Refund Request
        if (/(?:refund|kembalikan\s+dana)\s+/i.test(lower)) {
            const match = text.match(/(?:refund|dana)\s*([0-9.,]+)?\s*(?:buat|untuk)?\s*(.*)/i);
            const amount = match && match[1] ? parseInt(match[1].replace(/\D/g, ''), 10) : 50000;
            const customer = match && match[2] ? match[2].trim() : 'Pelanggan';
            return {
                intent: 'PROCESS_REFUND',
                toolName: 'payment.requestRefund',
                params: { amount, customerName: customer, reason: 'Komplain Pelanggan' }
            };
        }

        return { intent: 'GENERAL_INQUIRY', toolName: null, params: {} };
    }

    /**
     * Executes the business request end-to-end with validation, permissions, and audit
     */
    static async processRequest({ tenantId = 'tenant_agus_master', text = '', role = 'AI_AGENT', chatId = '' }) {
        const start = Date.now();
        const plan = this.decompose(text);

        if (!plan.toolName) {
            return null; // Let normal conversation brain handle general inquiries
        }

        // 1. PRE-FLIGHT VERIFICATION
        const preCheck = AIVerificationEngine.verifyPreconditions(plan.toolName, plan.params);
        if (!preCheck.passed) {
            return `⚠️ *Gagal Memproses Permintaan:*\n${preCheck.error}`;
        }

        // 2. TOOL EXECUTION WITH POLICY EVALUATION
        const execRes = await ToolActionRegistry.executeTool({
            toolName: plan.toolName,
            params: plan.params,
            role
        });

        const latencyMs = Date.now() - start;

        // 3. HANDLE REQUIRES APPROVAL
        if (execRes.status === 'REQUIRES_APPROVAL') {
            const permEval = ActionPermissionEngine.evaluateAction({
                tenantId,
                actionType: plan.intent,
                payload: plan.params
            });

            DecisionAuditTrail.recordTrace({
                tenantId,
                chatId,
                customerQuery: text,
                intent: plan.intent,
                model: 'UniversalRequestEngine',
                ragEvidence: [plan.toolName],
                policyVerdict: 'REQUIRES_APPROVAL',
                outputGenerated: permEval.approvalCard || 'Pending Approval',
                latencyMs
            });

            return (
                permEval.approvalCard ||
                `⚠️ *Aksi Membutuhkan Persetujuan Human:*\nTindakan *${plan.intent}* bernilai tinggi dan harus diizinkan pemilik bisnis.`
            );
        }

        // 4. HANDLE SUCCESSFUL EXECUTION
        if (execRes.success && execRes.result) {
            let outputMsg = '';
            if (plan.intent === 'CRM_INACTIVE_CUSTOMERS') {
                const list = execRes.result.customers.map((c, i) => `${i + 1}. *${c.name}* (Terakhir order ${c.lastOrderDaysAgo} hari lalu) - Fav: _${c.favorite}_`).join('\n');
                outputMsg = `📊 *HASIL ANALISIS PELANGGAN NON-AKTIF*\n━━━━━━━━━━━━━━━━━━\nDitemukan *${execRes.result.count} pelanggan* yang perlu di-follow up:\n\n${list}\n━━━━━━━━━━━━━━━━━━\n_Saran: Mau Salim buatkan draf pesan WhatsApp follow-up untuk mereka?_`;
            } else if (plan.intent === 'INVENTORY_CHECK') {
                outputMsg = `📦 *INFORMASI STOK PRODUK*\n━━━━━━━━━━━━━━━━━━\nProduk: *${execRes.result.item}*\nSisa Stok: *${execRes.result.stock} ${execRes.result.unit}*\nStatus: *${execRes.result.status}* ✅`;
            } else if (plan.intent === 'CREATE_ORDER_DRAFT') {
                outputMsg = `📝 *DRAF PESANAN BERHASIL DIBUAT*\n━━━━━━━━━━━━━━━━━━\nID Pesanan: \`${execRes.result.orderId}\`\nPelanggan: *${execRes.result.customerName}*\nTotal Estimasi: *Rp ${execRes.result.totalEstimated.toLocaleString('id-ID')}*\nStatus: *${execRes.result.status}*`;
            } else {
                outputMsg = `✅ Permintaan *${plan.intent}* berhasil dieksekusi:\n${JSON.stringify(execRes.result)}`;
            }

            DecisionAuditTrail.recordTrace({
                tenantId,
                chatId,
                customerQuery: text,
                intent: plan.intent,
                model: 'UniversalRequestEngine',
                ragEvidence: [plan.toolName],
                policyVerdict: 'PERMITTED',
                outputGenerated: outputMsg,
                latencyMs
            });

            return outputMsg;
        }

        return `⚠️ Tindakan gagal: ${execRes.reason || 'Terjadi kesalahan sistem'}`;
    }
}
