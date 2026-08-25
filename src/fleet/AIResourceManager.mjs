// src/fleet/AIResourceManager.mjs — PATCHED V13.7
// Legacy wrapper yang di-redirect ke AIGatewayObservable yang valid
// JANGAN HAPUS FILE INI — masih bisa di-import oleh modul lama
import { AIGatewayObservable } from '../resilience/AIGatewayObservable.mjs';

let _gwInstance = null;
function getGW() {
    if (!_gwInstance) _gwInstance = new AIGatewayObservable();
    return _gwInstance;
}

export class AIResourceManager {
    constructor() {
        this.gw = getGW();
    }

    async generateText(systemPrompt, inputPayload, fallbackToOffline = true, attempt = 0) {
        let contents = [];
        if (typeof inputPayload === 'string') {
            contents = [{ role: 'user', parts: [{ text: inputPayload }] }];
        } else if (Array.isArray(inputPayload)) {
            contents = inputPayload;
        } else {
            contents = [{ role: 'user', parts: [{ text: String(inputPayload) }] }];
        }
        const result = await this.gw.generate(systemPrompt, contents);
        if (result.success) return result.text;
        return 'Bentar, agak nge-lag tadi. Coba ulangi lagi ya!';
    }

    offlineFallback() {
        return 'Bentar, agak nge-lag tadi. Coba ulangi lagi ya!';
    }
}
