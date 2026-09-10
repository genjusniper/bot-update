// src/core/interaction/InteractionModeEngine.mjs
// Central interaction classifier defining the holistic mode of the ongoing conversation

export class InteractionModeEngine {
    static MODES = Object.freeze({
        CASUAL: 'Casual',
        BANTER: 'Banter',
        DEEP_TALK: 'Deep Talk',
        VENTING: 'Venting',
        PROBLEM_SOLVING: 'Problem Solving',
        STORYTELLING: 'Storytelling',
        ASKING: 'Asking',
        INFORMATIONAL: 'Informational',
        CUSTOMER: 'Customer',
        GROUP: 'Group',
        CLOSING: 'Closing',
        MINIMAL: 'Silent/Minimal'
    });

    /**
     * Resolves the primary Interaction Mode
     * @param {Object} params
     * @param {string} params.text
     * @param {Object} params.fusedSnapshot
     * @param {Object} params.roomState - from ReadTheRoomEngine
     * @param {Object} params.sharing - from SharingDetectionEngine
     * @param {boolean} [params.isGroup=false]
     * @returns {Object} { mode: string, description: string }
     */
    static resolve({ text = '', fusedSnapshot = {}, roomState = {}, sharing = {}, isGroup = false }) {
        const lower = (text || '').toLowerCase().trim();
        const dims = fusedSnapshot.dimensions || {};

        // 1. Group override
        if (isGroup) {
            return {
                mode: this.MODES.GROUP,
                description: 'Percakapan dalam grup: jaga privasi dan tidak memonopoli percakapan.'
            };
        }

        // 2. Customer relationship
        if (dims.relationshipTier === 'CUSTOMER' || dims.relationshipTier === 'CLIENT_VIP') {
            return {
                mode: this.MODES.CUSTOMER,
                description: 'Interaksi komersial: sopan, profesional, tanpa lelucon akrab berlebih.'
            };
        }

        // 3. Conversation Closure
        if (/\b(makasih|terima kasih|suwun|matur nuwun|yowis|bye|duluan)\b/i.test(lower) && lower.split(/\s+/).length <= 5) {
            return {
                mode: this.MODES.CLOSING,
                description: 'Penutupan percakapan: jawab singkat 1-3 kata tanpa membuka topik baru.'
            };
        }

        // 4. Minimal / Cuek input
        if (lower.split(/\s+/).length <= 2 && /^(oh|ya|ok|oke|sip|hmm|yoi|yo)$/i.test(lower)) {
            return {
                mode: this.MODES.MINIMAL,
                description: 'Input sangat minim: jangan membalas dengan esai panjang, cukup respon sepadan.'
            };
        }

        // 5. Venting / Curhat
        if (roomState.state === 'VENTING' || dims.conversationState === 'VENTING' || dims.intent === 'CURHAT') {
            return {
                mode: this.MODES.VENTING,
                description: 'Curhat/Venting: dengarkan dengan empati, tahan pemberian solusi instan.'
            };
        }

        // 6. Banter / Ceng-cengan
        if (roomState.state === 'JOKING' || (dims.relationshipTier === 'CLOSE_FRIEND' && /\b(wkwk|bro|lur|mancing|koplak)\b/i.test(lower))) {
            return {
                mode: this.MODES.BANTER,
                description: 'Banter santai sesama teman: nada santai, boleh deadpan humor, akrab.'
            };
        }

        // 7. Storytelling (user sharing an experience)
        if (sharing.isSharing) {
            return {
                mode: this.MODES.STORYTELLING,
                description: 'User sedang bercerita: tanggapi dengan rasa ingin tahu wajar ("terus gimana?").'
            };
        }

        // 8. Problem Solving / High Urgency
        if (roomState.state === 'SERIOUS' || dims.urgency >= 0.7 || sharing.isAdviceRequest) {
            return {
                mode: this.MODES.PROBLEM_SOLVING,
                description: 'Pemecahan masalah / teknis: langsung ke solusi inti tanpa basa-basi.'
            };
        }

        // 9. Deep Talk
        if (lower.length > 80 && /makna|tujuan|arah|capek hidup|bingung masa depan|pilihan/i.test(lower)) {
            return {
                mode: this.MODES.DEEP_TALK,
                description: 'Refleksi mendalam: berikan respon berbobot dan menenangkan pikiran.'
            };
        }

        // 10. Asking / Information Query
        if (dims.intent === 'QUERY' || dims.intent === 'REQUEST' || lower.includes('?')) {
            return {
                mode: this.MODES.ASKING,
                description: 'Pertanyaan eksplisit: jawab ringkas dan jelas.'
            };
        }

        return {
            mode: this.MODES.CASUAL,
            description: 'Obrolan santai harian: gaya natural, tidak kaku, bahasa manusia.'
        };
    }
}
