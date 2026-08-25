// src/agent/NaturalConversationEngine.mjs (Delegator to PersonalAIOS)
import { PersonalAIOS } from './PersonalAIOS.mjs';

let osInstance = null;

export class NaturalConversationEngine {
    constructor() {
        if (!osInstance) {
            osInstance = new PersonalAIOS();
        }
        this.os = osInstance;
    }

    async process(chatId, message, healthStats = {}) {
        if (!this.os) {
            this.os = new PersonalAIOS();
        }
        return await this.os.process(chatId, message);
    }
}
