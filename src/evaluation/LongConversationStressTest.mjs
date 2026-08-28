// src/evaluation/LongConversationStressTest.mjs
// LongConversationStressTest: Simulates 100 turns across 10 distinct social phases and flags failure moments

export class LongConversationStressTest {
    static getPhases() {
        return [
            { name: 'casual', turns: ["halo bro", "lagi dimana", "sibuk gak", "temenin nongkrong yuk", "tempat biasa ya"] },
            { name: 'humor', turns: ["lu kok lemes amat wkwk", "kurang kopi kayaknya 😂", "halu terus lu", "muka lu kayak bakso urat wkwk", "bisa aja ngelesnya"] },
            { name: 'serius', turns: ["eh besok ada meeting penting jam 9", "jangan telat ya", "siapin materinya", "lu setuju gak resign mendadak?", "emang bos lu seburuk itu ya?"] },
            { name: 'curhat', turns: ["pusing gue ditagih utang mulu", "ditambah gajian telat lagi", "pengen resign rasanya", "stres banget kepala mau pecah", "mana gak ada pacar lagi 😭"] },
            { name: 'silence_test', turns: ["wkwk", "oke", "sip", "yaudah", "yowes"] },
            { name: 'comeback', turns: ["eh btw kemarin lu kemana", "jadi beli motor gak", "kemarin katanya mau nyari barang itu", "jadi nemu tempatnya?", "lupa gue nanya"] },
            { name: 'topic_switch', turns: ["eh kucingku melahirkan kemarin", "anaknya lucu-lucu bener", "tapi sekarang pusing ngurusnya", "btw besok cuaca cerah gak ya", "mager keluar kalau hujan"] },
            { name: 'misunderstanding', turns: ["dia sing Ulfa apa Melinda?", "iya yang kemarin lu sebut", "lha kok bingung", "yaudah bebas", "skip aja"] },
            { name: 'correction', turns: ["besok jam 8 kumpul ya", "eh sori jam 9 deng!", "jangan sampai telat", "iya salah jam", "siap bos"] },
            { name: 'ending', turns: ["gue tidur dulu ya", "capek banget hari ini", "dah bro", "sampai besok", "bye"] }
        ];
    }

    static analyzeFailureMoments(logs) {
        const failures = [];

        logs.forEach((log, index) => {
            const agent = log.agent || '';
            const user = log.user || '';
            const wordCount = agent.split(/\s+/).filter(Boolean).length;
            const qCount = (agent.match(/\?/g) || []).length;
            const hasExclamation = agent.includes('!');

            // 1. Overtalk Failure (Bot talks > 2.5x user when user is brief)
            const userWordCount = user.split(/\s+/).filter(Boolean).length;
            if (userWordCount < 5 && wordCount > 15 && wordCount > userWordCount * 2.5) {
                failures.push({
                    turn: index + 1,
                    user,
                    agent,
                    reason: 'OVERTALK_VIOLATION',
                    detail: `Bot spoke ${wordCount} words for user's ${userWordCount} words.`
                });
            }

            // 2. Interrogation Failure (Too many questions)
            if (qCount > 1) {
                failures.push({
                    turn: index + 1,
                    user,
                    agent,
                    reason: 'INTERROGATION_VIOLATION',
                    detail: `Bot asked ${qCount} questions in a single response.`
                });
            }

            // 3. Exclamation Mark Failure (Robotic punctuation)
            if (hasExclamation) {
                failures.push({
                    turn: index + 1,
                    user,
                    agent,
                    reason: 'EXCLAMATION_PUNCTUATION_VIOLATION',
                    detail: `Bot used exclamation mark (!) which is strictly banned.`
                });
            }

            // 4. Emotional Mismatch (Laughter during venting/curhat)
            const userIsSad = Boolean(user.toLowerCase().match(/(pusing|stres|utang|gajian|telat|resign|sedih|nangis|kecewa|sakit)/i));
            if (userIsSad && agent.toLowerCase().includes('wkwk')) {
                failures.push({
                    turn: index + 1,
                    user,
                    agent,
                    reason: 'EMOTIONAL_MISMATCH_VIOLATION',
                    detail: `Bot laughed (wkwk) while user was venting/sad.`
                });
            }
        });

        return failures;
    }
}
