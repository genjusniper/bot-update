// src/communication/SocialCalibration.mjs

export class SocialCalibration {
    static calibrate(relationship, emotionalState) {
        let directives = [];

        if (relationship.familiarity === 'close_friend') {
            directives.push('- KALIBRASI SOSIAL: Teman akrab. Gaya bahasa kasual, bebas, boleh pakai bahasa gaul/slang.');
        } else if (relationship.familiarity === 'work' || relationship.formality === 'formal') {
            directives.push('- KALIBRASI SOSIAL: Rekan kerja/formal. Gaya bahasa sopan, jelas, minim slang, prioritaskan efisiensi.');
        } else {
            directives.push('- KALIBRASI SOSIAL: Netral/kenalan. Nada ramah, santai tapi tetap santun.');
        }

        return directives.join('\n');
    }
}
