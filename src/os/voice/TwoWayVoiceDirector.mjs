// src/os/voice/TwoWayVoiceDirector.mjs
// Two-Way Conversational Voice Note Director for Salim OS
// Handles voice-in, voice-out conversational loop for true hands-free audio companion

import { VoiceSynthesizer } from '../../multimodal/VoiceSynthesizer.mjs';

export class TwoWayVoiceDirector {
    /**
     * Determines if the interaction should be responded to with a Voice Note
     * @param {string} text 
     * @param {boolean} hasAudioAttachment 
     * @param {boolean} isOwner 
     * @returns {boolean}
     */
    static shouldReplyWithVoice(text = '', hasAudioAttachment = false, isOwner = false) {
        if (!isOwner) return false;
        if (hasAudioAttachment) return true;
        const clean = text.trim().toLowerCase();
        return /^[!/](?:vn|voice|suara|audio)\b/i.test(clean);
    }

    /**
     * Cleans markdown and formatting for natural spoken TTS
     * @param {string} text 
     * @returns {string}
     */
    static prepareScriptForSpeech(text = '') {
        if (!text) return '';
        let s = text;

        // Remove code blocks and URLs
        s = s.replace(/```[\s\S]*?```/g, '');
        s = s.replace(/`([^`]+)`/g, '$1');
        s = s.replace(/https?:\/\/[^\s]+/g, 'tautan web');

        // Remove bold, italic, strikethrough markdown
        s = s.replace(/[*_~]/g, '');

        // Remove bullet point symbols and decorative lines
        s = s.replace(/^[•\-–—]\s*/gm, '');
        s = s.replace(/^[#]+\s*/gm, '');
        s = s.replace(/━+/g, '');
        s = s.replace(/═+/g, '');
        s = s.replace(/─+/g, '');

        // Remove common emojis
        s = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');

        // Normalize whitespaces
        s = s.replace(/\n+/g, '. ').replace(/\s{2,}/g, ' ').trim();

        // Limit speech to ~400 characters (approx 25-30s audio) for snappy conversational flow
        if (s.length > 400) {
            const cut = s.substring(0, 390);
            const lastPeriod = cut.lastIndexOf('.');
            s = (lastPeriod > 100 ? cut.substring(0, lastPeriod + 1) : cut) + ' Selengkapnya sudah saya tulis di pesan teks ya Bos.';
        }

        return s;
    }

    /**
     * Generates a Voice Note PTT audio buffer from AI response text
     * @param {string} text 
     * @returns {Promise<Buffer | null>}
     */
    static async generateVoiceBuffer(text) {
        const speechScript = this.prepareScriptForSpeech(text);
        if (!speechScript || speechScript.length < 3) return null;

        try {
            return await VoiceSynthesizer.synthesizeVoiceNote(speechScript);
        } catch (err) {
            console.warn('[TwoWayVoice] ⚠️ Voice synthesis failed:', err.message);
            return null;
        }
    }
}
