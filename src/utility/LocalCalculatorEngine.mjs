// src/utility/LocalCalculatorEngine.mjs
// Instant Local Mathematical & Percentage Calculator (<1ms, Zero Token Cost)

export class LocalCalculatorEngine {
    static isMathQuery(message) {
        const text = (message || '').trim().toLowerCase();
        return Boolean(
            text.match(/^(hitung|itung|berapa|kalkulator)\s+/i) ||
            text.match(/\d+\s*(%|persen|\+|\-|\*|\/|x|kali|bagi|tambah|kurang)\s*\d+/i) ||
            text.match(/\d+%\s*(dari|of)\s*\d+/i)
        );
    }

    static calculate(message) {
        const text = (message || '').trim().toLowerCase();

        // 1. Percentage of amount: e.g. "17% dari 350 ribu" or "itung 17% dari 350.000"
        const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:%|persen)\s*(?:dari|of)\s*([\d\.\,]+(?:\s*(?:ribu|jt|juta|k|m))?)/i);
        if (percentMatch) {
            const percent = parseFloat(percentMatch[1]);
            const rawAmount = percentMatch[2].replace(/\./g, '').replace(/,/g, '');
            let amount = parseFloat(rawAmount);

            if (percentMatch[2].includes('ribu') || percentMatch[2].includes('k')) {
                amount = parseFloat(rawAmount) * 1000;
            } else if (percentMatch[2].includes('juta') || percentMatch[2].includes('jt') || percentMatch[2].includes('m')) {
                amount = parseFloat(rawAmount) * 1000000;
            }

            if (!isNaN(percent) && !isNaN(amount)) {
                const result = (percent / 100) * amount;
                return {
                    handled: true,
                    result: `Hasil hitungan: ${percent}% dari ${amount.toLocaleString('id-ID')} adalah ${result.toLocaleString('id-ID')} 🧮`
                };
            }
        }

        // 2. Simple arithmetic: e.g. "150000 * 4", "500 ribu / 4", "150.000 + 45.000"
        let cleanExpr = text
            .replace(/^(hitung|itung|berapa|kalkulator)\s+/i, '')
            .replace(/ribu|k/gi, '000')
            .replace(/juta|jt/gi, '000000')
            .replace(/kali|x/gi, '*')
            .replace(/bagi/gi, '/')
            .replace(/tambah/gi, '+')
            .replace(/kurang/gi, '-')
            .replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '')
            .trim();

        if (cleanExpr.length > 0 && cleanExpr.match(/^[\d\s\+\-\*\/\.\(\)]+$/)) {
            try {
                // Safe arithmetic evaluator
                const evalFn = new Function(`return (${cleanExpr})`);
                const result = evalFn();
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    return {
                        handled: true,
                        result: `Hasil hitungan: ${cleanExpr} = ${result.toLocaleString('id-ID')} 🧮`
                    };
                }
            } catch {
                return { handled: false };
            }
        }

        return { handled: false };
    }
}
