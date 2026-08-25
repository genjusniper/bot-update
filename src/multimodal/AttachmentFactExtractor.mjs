// src/multimodal/AttachmentFactExtractor.mjs
// Privacy Firewall & Fact Extractor for Photos and Voice Notes

import { MemoryOS } from '../memory/MemoryOS.mjs';

export class AttachmentFactExtractor {
    static async extractAndPersistFacts(chatId, userMessage, aiResponse, attachmentType = 'PHOTO') {
        const text = `${userMessage}\n${aiResponse}`;

        // 1. Detect Hardware / Gadget mentions in vision
        const pcMatch = text.match(/(rtx\s?\d{3,4}|gtx\s?\d{3,4}|ram\s?\d{1,2}gb|intel\s?i\d|ryzen\s?\d|ssd\s?\d{3,4}gb|motherboard)/i);
        if (pcMatch) {
            await MemoryOS.recordSemantic(chatId, 'spesifikasi_pc', pcMatch[0]);
            console.log(`[AttachmentFactExtractor] 🧠 Saved Hardware Fact for ${chatId}: ${pcMatch[0]}`);
        }

        // 2. Detect Product / Brand mentions
        const productMatch = text.match(/(sepatu\s?[a-z0-9]+|laptop\s?[a-z0-9]+|hp\s?[a-z0-9]+|motor\s?[a-z0-9]+)/i);
        if (productMatch) {
            await MemoryOS.recordSemantic(chatId, 'barang_dimiliki', productMatch[0]);
            console.log(`[AttachmentFactExtractor] 🧠 Saved Product Fact for ${chatId}: ${productMatch[0]}`);
        }

        // 3. Privacy Firewall: Ensure NO raw media buffers are saved to persistent json
        return true;
    }
}
