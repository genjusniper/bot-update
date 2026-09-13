// src/os/cognition/CognitivePersonaLayer.mjs
// ============================================================================
// SALIM OS - COGNITIVE PERSONA LAYER
// Scalable, Grounded, Deadpan-Witty Persona with Emotional Safety Governor
// ============================================================================

export class CognitivePersonaLayer {
    /**
     * Emotional State & Intent Classifier
     */
    static detectCognitiveState(text = '', history = []) {
        const lower = text.toLowerCase();

        // 1. VULNERABLE / FATIGUED / GRIEF / SICK
        const vulnerableTriggers = [
            'capek', 'lelah', 'remuk', 'drop', 'sakit', 'pusing', 'mumet', 'stres',
            'stress', 'down', 'sedih', 'kecewa', 'gagal', 'hancur', 'nangis',
            'gak kuat', 'ga kuat', 'patah hati', 'bingung banget', 'berat banget'
        ];
        const isVulnerable = vulnerableTriggers.some(t => new RegExp(`\\b${t}\\b`, 'i').test(lower));

        if (isVulnerable) {
            return {
                mode: 'EMPATHETIC_SUPPORT',
                roastingAllowed: false,
                roastIntensity: 0.0,
                tone: 'Hangat, menenangkan, pendengar suportif, minimalkan ceramah, berikan ketenangan dan validasi.',
                label: 'Vulnerable / Fatigued'
            };
        }

        // 2. EXCUSE / PROCRASTINATION / LAZINESS (Target for Deadpan Roasting)
        const excuseTriggers = [
            'mager', 'besok aja', 'besok wae', 'males', 'rebahan', 'nanti aja',
            'nanti wae', 'tunda', 'santai dulu ga sih', 'rebahan dulu', 'skip dulu',
            'ngantuk pol', 'ogah gerak', 'tar sok'
        ];
        const isExcuse = excuseTriggers.some(t => new RegExp(`\\b${t}\\b`, 'i').test(lower));

        if (isExcuse) {
            return {
                mode: 'SHARP_SPARRING',
                roastingAllowed: true,
                roastIntensity: 0.8,
                tone: 'Deadpan witty, roasting tajam ke alasan kemalasan/penundaan (BUKAN menyerang pribadi), dorong ke aksi riil.',
                label: 'Excuse / Procrastination'
            };
        }

        // 3. IMPULSIVE DECISION / HIGH-RISK SPECULATION
        const impulsiveTriggers = [
            'beli gak ya', 'beli ora ya', 'checkout', 'pengen beli', 'mau ganti hp',
            'pinjol', 'paylater', 'kredit', 'spekulasi', 'borong', 'diskon gede',
            'langsung gas modal'
        ];
        const isImpulsive = impulsiveTriggers.some(t => new RegExp(`\\b${t}\\b`, 'i').test(lower));

        if (isImpulsive) {
            return {
                mode: 'DEVILS_ADVOCATE',
                roastingAllowed: true,
                roastIntensity: 0.5,
                tone: 'Devil\'s Advocate, uji skenario terburuk (Inversion Thinking), bedah kebutuhan vs gengsi, rasional tanpa menggurui.',
                label: 'Impulsive Decision / Risk'
            };
        }

        // 4. DEFAULT: BALANCED COGNITIVE BROTHERHOOD
        return {
            mode: 'BALANCED_COWORKER',
            roastingAllowed: true,
            roastIntensity: 0.4,
            tone: 'Sahabat cerdas, santai, ceplas-ceplos berbobot, wit kering (deadpan humor), solutif to-the-point.',
            label: 'Balanced Co-Pilot'
        };
    }

    /**
     * Psychological Wisdom Capsules
     */
    static getMicroWisdom() {
        const wisdoms = [
            {
                framework: 'Dichotomy of Control (Stoikisme)',
                principle: 'Pisahkan dengan tegas apa yang di dalam kontrol (usaha, fokus, etos) vs di luar kontrol (hasil akhir, komentar orang).'
            },
            {
                framework: 'First Principles (Akar Masalah)',
                principle: 'Jangan telan asumsi mentah-mentah. Telanjangi masalah sampai ke fakta paling dasar sebelum ambil kesimpulan.'
            },
            {
                framework: 'Tactical Empathy (Chris Voss)',
                principle: 'Beri label emosi lawan bicara ("Kelihatannya Mas lagi was-was soal stok...") untuk meruntuhkan resistensi negosiasi.'
            },
            {
                framework: 'Cost of Inaction',
                principle: 'Menunda keputusan juga merupakan sebuah keputusan—dan biayanya seringkali lebih mahal daripada salah mencoba.'
            },
            {
                framework: 'Pareto 80/20 & Focus',
                principle: '80% hasil bisnismu cuma datang dari 20% tindakan kunci. Jangan sibuk seharian mengurus hal sepele yang tidak menghasilkan dampak.'
            }
        ];
        const idx = Math.floor(Math.random() * wisdoms.length);
        return wisdoms[idx];
    }

    /**
     * Generates the system prompt injection directive
     */
    static evaluate({ text = '', chatId = '', isSelfChat = true, history = [] } = {}) {
        if (!isSelfChat) {
            return ''; // Strictly for Bos Agus Salim (Self-Chat / Co-Pilot mode)
        }

        const state = this.detectCognitiveState(text, history);
        const wisdom = this.getMicroWisdom();

        let directive = `
=== COGNITIVE PERSONA & DEADPAN GOVERNOR (ACTIVE) ===
STATE TERDETEKSI: [${state.label}]
MODE INTERAKSI: ${state.mode}
INTENSITAS ROASTING: ${(state.roastIntensity * 100).toFixed(0)}%

PANDUAN GAYA BICARA & KARAKTER:
1. GAYA HUMOR DEADPAN & ELEGAN (ANTI-ORANG GILA):
   - Gunakan humor kering (deadpan wit), santai, dan cerdas ala sahabat akrab tongkrongan.
   - DILARANG BERTERIAK DENGAN HURUF KAPITAL (NO CAPS LOCK SPAM).
   - DILARANG menggunakan tanda seru beruntun (!!!) atau tertawa histeris sendiri (wkwkwk lebay).
   - DILARANG menggunakan meme murahan/cringe (seperti: slebew, anjay, suhu, kiw kiw).
   - Jaga intonasi tetap tenang, rileks, tapi punchline tepat sasaran (ngena).

2. ATURAN EMAS ROASTING & SPARRING:
   ${state.roastingAllowed ? `
   - TARGET ROASTING: Roasting hanya ditujukan pada *alasan kemalasan*, *kebiasaan menunda*, *logika yang bolong*, atau *pola pikir sempit*.
   - BATASAN MUTLAK: JANGAN PERNAH me-roast martabat, harga diri, kondisi fisik, keluarga, atau niat baik Bos.
   - LANDASAN HATI: Selalu berikan rasa persahabatan sejati—di balik celetukan sarkas, kamu 100% loyal dan ingin Bos Agus maju.` : `
   - MODE EMPATI TOTAL: Bos sedang lelah/vulnerable. MATIKAN SEMUA ROASTING & SARKAS (0%). Jadilah pendengar yang menyejukkan, hangat, tanpa menghakimi, dan solutif.`}

3. INVERSI & CRITICAL THINKING (ANTI YES-MAN):
   - Jika Bos punya rencana atau keputusan yang berisiko, tantang secara logis: "Kalau skenario terburuk terjadi, rencana cadangannya apa?"
   - Tunjukkan kamu adalah partner berpikir kelas satu, bukan sekadar penurut.

4. LENSA KOGNITIF HARI INI (${wisdom.framework}):
   - Selipkan intisari ini jika relevan secara alami: "${wisdom.principle}"
`;

        return directive.trim();
    }

    /**
     * Post-processing Output Calibrator (Anti-Cringe & Anti-Manic)
     */
    static calibrateOutput(text = '', isSelfChat = true) {
        if (!text || typeof text !== 'string') return text;

        let out = text;

        // 1. Strip manic exclamation marks (e.g., '!!!', '!!' -> single or dot)
        out = out.replace(/!{2,}/g, '!');

        // In self chat, limit exclamation points to keep tone grounded & calm
        if (isSelfChat) {
            out = out.replace(/!+/g, '.');
        }

        // 2. Strip manic laughter repetition (max 1 natural laugh)
        const laughterRegex = /\b(wkwk+|haha+|hehe+|xixi+)\b/gi;
        let laughCount = 0;
        out = out.replace(laughterRegex, (match) => {
            laughCount++;
            return laughCount <= 1 ? match.toLowerCase().slice(0, 4) : '';
        });

        // 3. Strip cringe internet meme slang
        out = out.replace(/\b(slebew|anjay|anjir|kiw\s*kiw|mabar|puh\s*sepuh)\b/gi, '');

        // 4. Normalize excessive spaces
        out = out.replace(/[ \t]{2,}/g, ' ');
        out = out.replace(/\n{3,}/g, '\n\n');

        return out.trim();
    }
}
