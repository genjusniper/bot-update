export class ProductTaxonomy {
    constructor() {
        this.aliasMap = {
            // Bawang
            "brambang": "bawang_merah",
            "bawang": "bawang_merah",
            "bawang merah": "bawang_merah",
            "bawang kupas": "bawang_merah",
            "bawang merah kupas": "bawang_merah",
            "brambang kupas": "bawang_merah",
            "bawang putih": "bawang_putih",
            "bawang putih kupas": "bawang_putih",
            "garlic": "bawang_putih",
            
            // Cabai
            "lombok": "cabai",
            "cabe": "cabai",
            "cabai rawit": "cabai",
            "cabe merah": "cabai",
            "lombok iris": "cabai",
            "lombok petik": "cabai",
            "cabe iris": "cabai",
            
            // Kelapa
            "kelapa parut": "kelapa_parut",
            "kelapa": "kelapa_parut",
            "santan": "kelapa_parut", // Technically related, often interchangeable as raw ingredient
            
            // Sayuran
            "daun ketela": "daun_singkong",
            "sayur singkong": "daun_singkong",
            "daun singkong": "daun_singkong",
            "pucuk ubi": "daun_singkong",
            "gori": "gori",
            "nangka muda": "gori",
            "tatal nangka": "gori",
            "cecek gori": "gori",
            "sayur gori": "gori",
            "sayur nangka": "gori",
            
            // Protein
            "telor": "telur",
            "endog": "telur",
            "tahu putih": "tahu",
            "tahu kuning": "tahu",
            "tahu pong": "tahu",
            "tempe daun": "tempe",
            "ikan teri": "ikan_asin",
            "gereh": "ikan_asin",
            
            // Buah/lain
            "gedang": "pisang",
            "pisang kepok": "pisang"
        };
    }

    normalize(term) {
        if (!term) return null;
        const lower = term.toLowerCase().trim();
        if (this.aliasMap[lower]) return this.aliasMap[lower];
        
        // Find partial matches if exact fails
        for (const [alias, standard] of Object.entries(this.aliasMap)) {
            if (lower.includes(alias) || lower.includes(standard)) return standard;
        }

        // Return lowercased space-to-underscore as fallback
        return lower.replace(/\\s+/g, '_');
    }
}
