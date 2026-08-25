// src/fleet/LightweightRouter.mjs
// V13.7 — Expanded local fast-path: more Jawa/Indo casual words covered

export class LightweightRouter {
    static lookup = {
        'p': ['Oit, ngopo?', 'Yo, ada apa bro?', 'P juga wkwk, ada apa?', 'Oyy, nyari siapa?'],
        'oi': ['Oitt!', 'Yo! Piye kabare?', 'Oyy, ada apa nih?', 'Yo bro!'],
        'oy': ['Oitt!', 'Yo! Ada apa?', 'Oy juga, piye bro?'],
        'yo': ['Yo! Ada apa bro?', 'Yo, piye kabare?', 'Yo gaes!'],
        'halo': ['Halo juga bro! Ada apa?', 'Hai! Gimana nih?', 'Halo, siap dengerin!'],
        'hai': ['Hai juga! Gimana?', 'Hei! Ada yang bisa dibantu?', 'Hai, piye?'],
        'wkwk': ['Wkwkwk 😂', 'Malah ketawa lu 😂', 'Haha ngakak 😂'],
        'wkwkwk': ['Wkwkwkwk 😂', 'Njir ketawa terus 😂', 'Parah deh wkwk'],
        'haha': ['Hahaha! 😄', 'Wkwk beneran lucu ya', 'Ngakak gue juga 😂'],
        'anjir': ['Wkwk parah emang', 'Njir kaget gue 😂', 'Bisa-bisanya wkwk'],
        'lah': ['Lah ngopo to? Wkwk', 'Lah kok gitu? 😂', 'Lah kenapa emangnya?'],
        'gas': ['Gasskeun!', 'Gas poll! 🔥', 'Gas, jangan kasih kendor!'],
        'gaskeun': ['Gas poll! 🔥', 'Gasss! Semangat!', 'Siap gassss! 💪'],
        'sip': ['Sipp 👍', 'Oke sip!', 'Mantap!'],
        'siap': ['Siap bro! 💪', 'Siap gaes!', 'Oke siap!'],
        'ok': ['Ok bro!', 'Oke siap!', 'Ok noted!'],
        'oke': ['Oke bro!', 'Sip, oke!', 'Oke noted!'],
        'mantap': ['Mantap jiwa! 🔥', 'Mantap bro!', 'Keren banget 👍'],
        'keren': ['Keren banget! 🔥', 'Mantap bro!', 'Top markotop!'],
        'otw': ['Otw gas! 🏃', 'Sip otw!', 'Otw bro!'],
        'thx': ['Sama-sama bro!', 'Sip, santai aja!', 'Oke bro, no problem!'],
        'thanks': ['Sama-sama!', 'No problem bro!', 'Santai aja 😄'],
        'makasih': ['Sama-sama bro!', 'Santai wae bro!', 'Oke, no problem!'],
        'suwun': ['Sami-sami bro!', 'Santai wae!', 'Nggih, sami-sami!'],
        'noted': ['Sip, noted! ✅', 'Ok noted bro!', 'Catat!'],
        'nggih': ['Nggih bro 🙏', 'Inggih, monggo!', 'Nggih, sip!'],
        'monggo': ['Monggo bro!', 'Mangga, lanjut!', 'Monggo dipersilahkan!'],
    };

    static route(message) {
        const clean = (message || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (this.lookup[clean]) {
            const list = this.lookup[clean];
            const chosen = list[Math.floor(Math.random() * list.length)];
            return { handled: true, response: chosen, source: 'LIGHTWEIGHT_ROUTER' };
        }
        return { handled: false, response: null };
    }
}
