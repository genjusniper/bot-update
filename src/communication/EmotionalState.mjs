// src/communication/EmotionalState.mjs

export class EmotionalState {
    static evaluate(message, perception, momentum) {
        const text = (message || '').toLowerCase();
        
        let state = {
            energy: momentum.energy || 0.7,
            seriousness: 0.3,
            engagement: momentum.engagement || 0.7,
            frustration: 0.1,
            humor_tolerance: 0.8,
            social_distance: 'close'
        };

        if (perception.emotion === 'frustrated' || perception.emotion === 'sad') {
            state.seriousness = 0.85;
            state.frustration = 0.75;
            state.humor_tolerance = 0.20; // Drastically lower humor tolerance
        } else if (perception.emotion === 'excited' || perception.emotion === 'happy') {
            state.seriousness = 0.15;
            state.humor_tolerance = 0.95;
        }

        return state;
    }

    static formatDirectives(state) {
        let lines = [];
        if (state.seriousness > 0.6) {
            lines.push('- TINGKAT KESERIUSAN TINGGI: Fokus menjawab dengan empati atau substansi, minimalkan lelucon.');
        }
        if (state.humor_tolerance < 0.3) {
            lines.push('- HUMOR TOLERANCE RENDAH: Dilarang membuat candaan atau sarkasme pada turn ini.');
        }
        return lines.join('\n');
    }
}
