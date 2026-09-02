// src/sales/ProactiveSalesEngine.mjs

import { OrderLedger } from './OrderLedger.mjs';
import { ContactPolicyEngine } from '../security/copilot/ContactPolicyEngine.mjs';

export class ProactiveSalesEngine {
    
    /**
     * Dapatkan daftar target (pelanggan setia yang belum order hari ini)
     */
    static async getFollowUpTargets() {
        const policyData = await ContactPolicyEngine.loadPolicy();
        const contacts = policyData.contacts || {};
        
        const targets = [];

        for (const [chatId, data] of Object.entries(contacts)) {
            // Hanya targetkan kontak yang statusnya 'AUTO' (Pelanggan yang dikenal)
            if (data.policy === 'AUTO') {
                const isOrdered = await OrderLedger.hasOrderedToday(chatId);
                
                if (!isOrdered) {
                    targets.push({
                        chatId: chatId,
                        name: data.name || 'Bu'
                    });
                }
            }
        }

        return targets;
    }

    /**
     * Hasilkan pesan follow-up kasual ala Mas Agus
     */
    static generateMessage(customerName) {
        // Karena Mas Agus pilih Opsi B secara default (Template Cerdas), 
        // kita acak biar tidak terlihat kaku/robotik.
        const templates = [
            `Malam ${customerName}, besok subuh butuh santan berapa liter? Biar direkap sekalian mumpung stok masih ada.`,
            `Halo ${customerName}, besok jadi dikirimin santan sama tempe kah? Kabarin ya kalau butuh, ini lagi ngerekap.`,
            `${customerName} malam, besok order santan nggak nih? Biar saya pisahin dari sekarang.`,
            `Malam ${customerName}. Gimana besok, butuh santan berapa liter buat warung?`
        ];
        const randIndex = Math.floor(Math.random() * templates.length);
        return templates[randIndex];
    }
}
