// src/os/outdoor/MountainCopilot.mjs
// Mountain Summit Weather, Expedition Packing & Emergency Copilot for Salim OS
// Integrated with Open-Meteo real-time satellite data (Zero API Keys needed)

export class MountainCopilot {
    static MOUNTAINS = {
        'lawu': { name: 'Gunung Lawu', alt: 3265, lat: -7.627, lon: 111.192, desc: 'Puncak Hargo Dumilah' },
        'prau': { name: 'Gunung Prau', alt: 2590, lat: -7.189, lon: 109.923, desc: 'Puncak Dieng' },
        'merbabu': { name: 'Gunung Merbabu', alt: 3145, lat: -7.454, lon: 110.439, desc: 'Puncak Triangulasi / Kenteng Songo' },
        'sindoro': { name: 'Gunung Sindoro', alt: 3153, lat: -7.301, lon: 109.998, desc: 'Puncak Kledung' },
        'sumbing': { name: 'Gunung Sumbing', alt: 3371, lat: -7.384, lon: 110.070, desc: 'Puncak Rajawali' },
        'slamet': { name: 'Gunung Slamet', alt: 3432, lat: -7.242, lon: 109.208, desc: 'Atap Jawa Tengah' },
        'mongkrang': { name: 'Bukit Mongkrang', alt: 2194, lat: -7.643, lon: 111.198, desc: 'Tawangmangu' },
        'bromo': { name: 'Gunung Bromo', alt: 2329, lat: -7.942, lon: 112.953, desc: 'Taman Nasional Bromo Tengger Semeru' },
        'ungaran': { name: 'Gunung Ungaran', alt: 2050, lat: -7.182, lon: 110.334, desc: 'Puncak Botondo' },
        'andong': { name: 'Gunung Andong', alt: 1726, lat: -7.386, lon: 110.364, desc: 'Magelang' }
    };

    /**
     * Resolves mountain key from user query
     */
    static resolveMountain(query) {
        if (!query) return null;
        const clean = query.toLowerCase().replace(/^(?:gunung|bukit|gn|g\.)\s+/i, '').trim();
        for (const [k, v] of Object.entries(this.MOUNTAINS)) {
            if (clean.includes(k) || k.includes(clean)) {
                return v;
            }
        }
        return null;
    }

    /**
     * Fetches live satellite summit weather
     * @param {string} mountainQuery 
     * @returns {Promise<string>}
     */
    static async getSummitWeather(mountainQuery) {
        const mountain = this.resolveMountain(mountainQuery);
        if (!mountain) {
            const list = Object.values(this.MOUNTAINS).map(m => `• ${m.name} (${m.alt} mdpl)`).join('\n');
            return `❌ Gunung *"${mountainQuery}"* belum ada di database cepat. Pilihan yang tersedia:\n${list}\n\n_Contoh: \`!cuaca lawu\` atau \`!cuaca prau\`_`;
        }

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${mountain.lat}&longitude=${mountain.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1`;
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) throw new Error(`Weather service HTTP ${res.status}`);

            const data = await res.json();
            const cur = data.current || {};

            const temp = cur.temperature_2m !== undefined ? Math.round(cur.temperature_2m) : '--';
            const feelsLike = cur.apparent_temperature !== undefined ? Math.round(cur.apparent_temperature) : temp;
            const windSpeed = cur.wind_speed_10m !== undefined ? Math.round(cur.wind_speed_10m) : 0;
            const humidity = cur.relative_humidity_2m || 0;
            const precip = cur.precipitation || 0;

            // Hourly max rain probability
            const hourlyProb = data.hourly?.precipitation_probability || [];
            const maxRainProb = hourlyProb.length > 0 ? Math.max(...hourlyProb.slice(0, 12)) : 0;

            let condition = 'Cerah / Berawan';
            let conditionIcon = '⛅';
            if (precip > 2 || maxRainProb > 60) {
                condition = 'Potensi Hujan / Basah';
                conditionIcon = '🌧️';
            } else if (windSpeed > 30) {
                condition = 'Angin Kencang (Waspada Badai)';
                conditionIcon = '💨';
            } else if (temp < 8) {
                condition = 'Sangat Dingin (Risiko Hipotermia)';
                conditionIcon = '❄️';
            }

            let advice = 'Kondisi relatif standar. Pastikan bawa jaket windproof dan jas hujan.';
            if (temp < 7) {
                advice = 'Suhu sangat dingin! Wajib bawa sleeping bag thermal, jaket tebal/down jacket, sarung tangan polar, dan kaos kaki cadangan.';
            } else if (maxRainProb > 50) {
                advice = 'Peluang hujan tinggi! Bungkus semua pakaian & sleeping bag dengan trash bag tebal di dalam carrier (waterproofing mutlak).';
            } else if (windSpeed > 25) {
                advice = 'Angin di punggungan kencang! Pilih area camp terlindung dari angin (hindari pasang tenda tepat di bibir tebing).';
            }

            return (
                `🏔️ *SATELIT CUACA PUNCAK: ${mountain.name.toUpperCase()}*\n` +
                `📍 *Elevasi:* ${mountain.alt} mdpl (${mountain.desc})\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `${conditionIcon} *Kondisi:* ${condition}\n` +
                `🌡️ *Suhu Puncak:* ${temp}°C _(Terasa seperti: ${feelsLike}°C)_\n` +
                `💨 *Kecepatan Angin:* ${windSpeed} km/jam\n` +
                `💧 *Kelembapan:* ${humidity}%\n` +
                `🌧️ *Peluang Hujan:* ${maxRainProb}%\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💡 *Rekomendasi Safety Salim OS:*\n_${advice}_\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `_Ketik \`!packing\` untuk ceklist logistik atau \`!sopgunung\` untuk darurat._`
            );
        } catch (err) {
            console.error('[MountainCopilot] ❌ Weather error:', err.message);
            return `❌ Gagal mengambil data cuaca puncak satelit untuk ${mountain.name}: ${err.message}`;
        }
    }

    /**
     * Calculates gear and food logistics checklist
     */
    static getPackingChecklist(durationDays = 2, teamSize = 4) {
        const d = Math.max(1, parseInt(durationDays, 10) || 2);
        const p = Math.max(1, parseInt(teamSize, 10) || 4);

        const tentsNeeded = Math.ceil(p / 4);
        const gasCansNeeded = Math.ceil((p * d * 0.4));
        const waterMinLitersPerPerson = d * 2.5;

        return (
            `🎒 *CHECKLIST LOGISTIK PENDAKIAN (${d} HARI, ${p} ORANG)*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `⛺ *Tenda & Shelter:* ${tentsNeeded} Unit (Kapasitas 4 orang)\n` +
            `🔥 *Alat Masak:* ${Math.ceil(p / 4)} set Nesting + Kompor Ultralight\n` +
            `⛽ *Bahan Bakar:* Minimal ${gasCansNeeded} Tabung Gas Kaleng (Hi-Cook/Canister)\n` +
            `💧 *Air Minum:* Min. ${waterMinLitersPerPerson} Liter per orang (Total tim: ${waterMinLitersPerPerson * p} Liter)\n\n` +
            `👕 *Personal Layering (Wajib per orang):*\n` +
            `• 1x Pakaian jalan (quick-dry)\n` +
            `• 1x Pakaian tidur kering (disimpan di trash bag)\n` +
            `• 1x Jaket Windproof/Gore-Tex + 1x Jaket Hangat (Fleece/Down)\n` +
            `• 1x Jas Hujan (Ponco/Setelan)\n` +
            `• Sleeping Bag + Matras Thermal (Alumunium foil)\n` +
            `• Headlamp + Baterai cadangan\n\n` +
            `🩹 *P3K & Emergency:* Survival blanket (wajib 1/orang), Tolak Angin, Paracetamol, Oralit, Betadine, Koyo.\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Pack smart, go light, and safety always first Bos!_`
        );
    }

    /**
     * Mountain Emergency Guidelines (SOP Darurat)
     */
    static getEmergencySOP() {
        return (
            `🚨 *SOP DARURAT MEDIS & PENDAKIAN GUNUNG*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🥶 *1. PENANGANAN HIPOTERMIA (Kedinginan Parah):*\n` +
            `• Segera ganti pakaian basah dengan pakaian kering di dalam tenda tertutup.\n` +
            `• Bungkus tubuh korban dengan *Emergency Survival Blanket* (sisi perak menghadap tubuh).\n` +
            `• Masukkan ke dalam Sleeping Bag kering, berikan matras alas dobel dari tanah dingin.\n` +
            `• Beri minuman manis hangat (teh manis/cokelat), JANGAN beri kopi pekat atau alkohol!\n` +
            `• Lakukan skin-to-skin contact jika korban sudah mulai tidak sadar / menggigil hebat.\n\n` +
            `🌫️ *2. DISORIENTASI / TERSESAT KABUT TEBAL:*\n` +
            `• Prisip S.T.O.P: *Stop* (berhenti berjalan), *Think* (tenang), *Observe* (amati arah mata angin/tanda jalur), *Plan* (buat rencana aman).\n` +
            `• Jangan memaksakan turun ke lembah/jurang curam saat kabut!\n` +
            `• Bertahan di jalur punggungan aman sampai kabut terbuka atau bantuan datang.\n\n` +
            `⚡ *3. BADAI PETIR DI PUNCAK:*\n` +
            `• Segera turun dari puncak terbuka atau punggungan tertinggi.\n` +
            `• Jauhi pohon tunggal yang tinggi dan tiang besi.\n` +
            `• Lepas trekking pole atau benda logam tinggi dari tas.\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Simpan pesan ini untuk panduan keselamatan darurat tim!_`
        );
    }
}
