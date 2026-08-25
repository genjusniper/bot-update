// src/agent/NaturalConversationEngine.mjs (Delegator to PersonalAIOS)
import { PersonalAIOS } from './PersonalAIOS.mjs';

const osInstance = new PersonalAIOS();

export class NaturalConversationEngine {
    constructor(aiGateway) {
        this.os = osInstance;
    }

    async process(chatId, message, healthStats = {}) {
        return await this.os.process(chatId, message);
    }
}
