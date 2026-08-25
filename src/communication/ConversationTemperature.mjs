// src/communication/ConversationTemperature.mjs

export class ConversationTemperature {
    static getContext(momentum, relationship) {
        const now = new Date();
        const hour = (now.getUTCHours() + 7) % 24; // WIB (UTC+7)
        const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

        let timeOfDay = 'siang';
        if (hour >= 5 && hour < 11) timeOfDay = 'pagi';
        else if (hour >= 11 && hour < 15) timeOfDay = 'siang';
        else if (hour >= 15 && hour < 18) timeOfDay = 'sore';
        else timeOfDay = 'malam';

        const isWeekend = (day === 0 || day === 6);

        // Conversation Temperature (0 = Formal/Stiff, 50 = Normal Friendly, 100 = Hyper/Playful)
        let temperature = 50;
        if (relationship.familiarity === 'close_friend') temperature += 25;
        if (momentum.energy > 0.8) temperature += 15;
        if (momentum.emotionalIntensity > 0.7) temperature -= 30; // drop temperature when user is emotional

        temperature = Math.max(10, Math.min(100, temperature));

        return {
            timeOfDay,
            isWeekend,
            temperature,
            directive: `KONTEKS WAKTU & SUHU OBROLAN: Waktu ${timeOfDay} (${isWeekend ? 'Akhir Pekan/Santai' : 'Hari Kerja'}). Suhu obrolan: ${temperature}/100.`
        };
    }
}
