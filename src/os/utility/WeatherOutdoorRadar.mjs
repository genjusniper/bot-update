// src/os/utility/WeatherOutdoorRadar.mjs
// ============================================================================
// SALIM OS - WEATHER & OUTDOOR RADAR
// Real-time weather, rain probability, and outdoor forecast via Open-Meteo
// ============================================================================

export class WeatherOutdoorRadar {
    static CITIES = {
        'semarang': { lat: -6.9932, lon: 110.4203, name: 'Semarang, Jawa Tengah' },
        'ungaran': { lat: -7.1396, lon: 110.4042, name: 'Ungaran, Kab. Semarang' },
        'salatiga': { lat: -7.3305, lon: 110.5084, name: 'Salatiga, Jawa Tengah' },
        'solo': { lat: -7.5755, lon: 110.8243, name: 'Surakarta / Solo' },
        'jogja': { lat: -7.7956, lon: 110.3695, name: 'Yogyakarta' },
        'yogyakarta': { lat: -7.7956, lon: 110.3695, name: 'Yogyakarta' },
        'wonosobo': { lat: -7.3625, lon: 109.9000, name: 'Wonosobo (Dieng/Sumbing)' },
        'magelang': { lat: -7.4706, lon: 110.2178, name: 'Magelang' },
        'jakarta': { lat: -6.2088, lon: 106.8456, name: 'DKI Jakarta' }
    };

    static interpretWeatherCode(code) {
        if (code === 0) return { desc: 'Cerah Berawan', icon: '☀️' };
        if (code >= 1 && code <= 3) return { desc: 'Sebagian Berawan', icon: '⛅' };
        if (code >= 45 && code <= 48) return { desc: 'Berkabut', icon: '🌫️' };
        if (code >= 51 && code <= 55) return { desc: 'Gerimis Ringan', icon: '🌦️' };
        if (code >= 61 && code <= 65) return { desc: 'Hujan', icon: '🌧️' };
        if (code >= 80 && code <= 82) return { desc: 'Hujan Deras / Lebat', icon: '⛈️' };
        if (code >= 95) return { desc: 'Hujan Disertai Petir', icon: '⚡' };
        return { desc: 'Berawan', icon: '☁️' };
    }

    /**
     * Gets weather forecast for city
     */
    static async getWeather(query = 'semarang') {
        const cleaned = query.toLowerCase().replace(/^!cuaca\s*/i, '').trim() || 'semarang';
        const cityData = this.CITIES[cleaned] || this.CITIES['semarang'];

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityData.lat}&longitude=${cityData.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&timezone=Asia%2FJakarta&forecast_days=1`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const curr = data.current;
            const weather = this.interpretWeatherCode(curr.weather_code);

            // Hourly rain check for next 6 hours
            const currentHour = new Date().getHours();
            const rainProbs = data.hourly?.precipitation_probability || [];
            const maxRainNextHours = Math.max(...rainProbs.slice(currentHour, currentHour + 6), 0);

            let advice = '';
            if (maxRainNextHours > 60) {
                advice = '🌧️ *Saran Salim:* Potensi hujan tinggi dalam beberapa jam ke depan. Jangan lupa siapkan jas hujan kalau mau antar santan/kelapa ke warteg, Gus!';
            } else if (curr.temperature_2m > 33) {
                advice = '🔥 *Saran Salim:* Cuaca lumayan terik. Perbanyak minum air putih biar stamina tetap prima!';
            } else {
                advice = '🌤️ *Saran Salim:* Cuaca kondusif dan nyaman untuk aktivitas harian maupun outdoor.';
            }

            return (
                `🌤️ *RADAR CUACA SALIM OS*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📍 Lokasi: *${cityData.name}*\n` +
                `${weather.icon} *Kondisi:* ${weather.desc}\n` +
                `🌡️ *Suhu:* ${curr.temperature_2m}°C\n` +
                `💧 *Kelembapan:* ${curr.relative_humidity_2m}%\n` +
                `💨 *Kecepatan Angin:* ${curr.wind_speed_10m} km/jam\n` +
                `☔ *Peluang Hujan (6 Jam ke depan):* ${maxRainNextHours}%\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `${advice}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `_Ketik !cuaca <kota> (contoh: !cuaca ungaran, !cuaca wonosobo)_`
            );
        } catch (err) {
            console.warn('[WeatherOutdoorRadar] Error fetching weather:', err.message);
            return `⚠️ Gagal mengambil radar cuaca: ${err.message}. Coba lagi beberapa saat, Gus.`;
        }
    }
}
