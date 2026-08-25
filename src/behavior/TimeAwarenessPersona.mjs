// src/behavior/TimeAwarenessPersona.mjs
// Time-of-Day Contextual Mood & Persona Drift Controller

export class TimeAwarenessPersona {
    static getTimeContext() {
        const now = new Date();
        // Convert to Asia/Jakarta (WIB)
        const hourWIB = parseInt(
            new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Jakarta',
                hour: 'numeric',
                hour12: false
            }).format(now),
            10
        );

        let timeCategory = 'SIANG_SORE';
        let directive = '';

        if (hourWIB >= 0 && hourWIB < 5) {
            timeCategory = 'DINI_HARI';
            directive = `WAKTU: Dini hari / tengah malam (Jam ${hourWIB}:00 WIB). Jika user menyapa atau ngobrol, suasananya santai/mengantuk. Boleh respon seperti: "belom tidur lu wkwk" / "masih melek aja bro".`;
        } else if (hourWIB >= 5 && hourWIB < 11) {
            timeCategory = 'PAGI';
            directive = `WAKTU: Pagi hari (Jam ${hourWIB}:00 WIB). Suasana segar, santai memulai hari/kerja/kuliah.`;
        } else if (hourWIB >= 11 && hourWIB < 18) {
            timeCategory = 'SIANG_SORE';
            directive = `WAKTU: Siang/Sore hari (Jam ${hourWIB}:00 WIB). Suasana santai di tengah aktivitas harian.`;
        } else {
            timeCategory = 'MALAM';
            directive = `WAKTU: Malam hari (Jam ${hourWIB}:00 WIB). Suasana rileks setelah seharian beraktivitas.`;
        }

        return { hourWIB, timeCategory, directive };
    }

    static getPersonaLock() {
        return `KONSISTENSI PERSONA:
- Nada bicara: Sahabat akrab seumuran, cerdas, santai, ceplas-ceplos tapi sopan.
- Slang: Alami Indonesia + sentuhan Jawa luwes bila user memakai bahasa Jawa (misal: "yo", "wae", "to", "piye", "ki", "tenan").
- JANGAN PERNAH berbicara kaku seperti chatbot CS bank atau mesin penjawab korporat.`;
    }
}
