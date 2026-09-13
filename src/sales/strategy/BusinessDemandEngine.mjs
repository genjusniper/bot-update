import { ProductTaxonomy } from './ProductTaxonomy.mjs';

export class BusinessDemandEngine {
    constructor() {
        this.taxonomy = new ProductTaxonomy();

        this.CATEGORY_PRIORS = {
            'WARTEG': ['daun_singkong', 'gori', 'tempe', 'tahu', 'bawang_merah', 'cabai', 'telur'],
            'WARUNG_PADANG': ['daun_singkong', 'gori', 'kelapa_parut', 'cabai', 'bawang_merah', 'bawang_putih'],
            'GUDEG': ['gori', 'telur', 'tahu', 'kelapa_parut', 'bawang_merah'],
            'LODEH': ['gori', 'daun_singkong', 'tempe', 'kelapa_parut'],
            'WARMINDO': ['telur', 'cabai', 'bawang_merah', 'bawang_putih'],
            'ANGKRINGAN': ['tempe', 'tahu', 'telur', 'bawang_putih'],
            'GORENGAN': ['tahu', 'tempe', 'pisang', 'cabai', 'bawang_putih'],
            'PENYETAN': ['cabai', 'bawang_putih', 'bawang_merah', 'tempe', 'tahu', 'telur'],
            'SOTO': ['bawang_putih', 'bawang_merah', 'telur'],
            'BAKSO': ['bawang_putih', 'bawang_merah', 'tahu', 'telur'],
            'GULAI': ['gori', 'kelapa_parut', 'cabai', 'bawang_merah', 'bawang_putih'],
            'CATERING': ['daun_singkong', 'gori', 'bawang_merah', 'bawang_putih', 'cabai', 'telur', 'tahu', 'tempe'],
            'RESTORAN': ['daun_singkong', 'gori', 'bawang_merah', 'bawang_putih', 'cabai', 'kelapa_parut', 'telur'],
            'RUMAH_MAKAN': ['daun_singkong', 'gori', 'bawang_merah', 'cabai', 'tahu', 'tempe', 'kelapa_parut'],
            'KAFE': ['pisang', 'telur', 'tahu'],
            'KULINER_UMUM': ['daun_singkong', 'gori', 'bawang_merah', 'cabai', 'bawang_putih', 'tahu', 'tempe']
        };

        this.MENU_HINTS = {
            'ayam geprek': ['cabai', 'bawang_putih'],
            'telur balado': ['telur', 'cabai', 'bawang_merah', 'bawang_putih'],
            'sayur lodeh': ['gori', 'kelapa_parut', 'tempe'],
            'gudeg': ['gori', 'telur'],
            'gulai nangka': ['gori', 'kelapa_parut'],
            'sayur singkong': ['daun_singkong'],
            'daun singkong': ['daun_singkong'],
            'gori': ['gori'],
            'tempe mendoan': ['tempe'],
            'tahu goreng': ['tahu'],
            'rendang': ['kelapa_parut', 'cabai', 'bawang_merah', 'bawang_putih'],
            'gulai': ['gori', 'kelapa_parut', 'cabai'],
            'sambal': ['cabai', 'bawang_merah', 'bawang_putih'],
            'pisang goreng': ['pisang'],
            'pecel': ['tempe', 'tahu', 'bawang_putih']
        };
    }

    inferDemand(lead, evidenceList) {
        let potentialIngredients = new Map();
        let unknowns = ['volume', 'frequency', 'current_supplier', 'price_point'];
        let overallConfidence = 0.5; // Baseline
        
        // Helper to add or upgrade demand signal
        const addDemand = (rawProduct, signal, classification, reason, evId, conf) => {
            const product = this.taxonomy.normalize(rawProduct) || rawProduct;
            const signalLevels = { 'DIRECT': 5, 'STRONG_INFERENCE': 4, 'MODERATE_INFERENCE': 3, 'WEAK_INFERENCE': 2, 'UNKNOWN': 1 };
            
            if (!potentialIngredients.has(product) || signalLevels[signal] > signalLevels[potentialIngredients.get(product).demandSignal]) {
                potentialIngredients.set(product, {
                    product,
                    demandSignal: signal,
                    classification,
                    reason,
                    evidenceIds: [evId],
                    confidence: conf
                });
            } else {
                potentialIngredients.get(product).evidenceIds.push(evId);
            }
        };

        // 1. Process Evidence (DIRECT_TRANSACTION > DIRECT_MENU > BUSINESS_DESCRIPTION > CATEGORY_PRIOR)
        for (const ev of evidenceList) {
            const valLower = ev.normalizedValue ? ev.normalizedValue.toLowerCase() : "";
            
            // DIRECT TRANSACTION
            if (ev.domain === 'demand' && ev.sourceType === 'MANUAL_SURVEY' && valLower.includes('belanja')) {
                // Mock parse explicit purchase
                const match = this.taxonomy.normalize(valLower);
                if (match) addDemand(match, 'DIRECT', 'FACT', `Explicit survey data: ${ev.rawValue}`, ev.evidenceId, 0.9);
            }
            
            // DIRECT MENU
            if (ev.domain === 'menu') {
                for (const [menu, ingredients] of Object.entries(this.MENU_HINTS)) {
                    if (valLower.includes(menu)) {
                        ingredients.forEach(ing => {
                            addDemand(ing, 'STRONG_INFERENCE', 'INFERENCE', `Menu teridentifikasi: ${menu}`, ev.evidenceId, 0.8);
                        });
                    }
                }
                // Check direct ingredient mentions in menu desc
                const words = valLower.split(/[\s,]+/);
                for (const w of words) {
                    const norm = this.taxonomy.normalize(w);
                    if (norm) addDemand(norm, 'STRONG_INFERENCE', 'INFERENCE', `Disebutkan dalam menu: ${w}`, ev.evidenceId, 0.75);
                }
            }

            // BUSINESS DESCRIPTION
            if (ev.domain === 'description') {
                if (valLower.includes('lauk rumahan')) {
                    addDemand('telur', 'MODERATE_INFERENCE', 'INFERENCE', 'Deskripsi: lauk rumahan', ev.evidenceId, 0.6);
                    addDemand('tempe', 'MODERATE_INFERENCE', 'INFERENCE', 'Deskripsi: lauk rumahan', ev.evidenceId, 0.6);
                }
            }
        }

        // 2. Process Category Prior
        // Normalize Category
        let businessType = 'KULINER_UMUM';
        let catLower = ((lead.businessCategory || "") + " " + (lead.businessName || "")).toLowerCase();
        
        if (catLower.includes('gudeg')) businessType = 'GUDEG';
        else if (catLower.includes('lodeh')) businessType = 'LODEH';
        else if (catLower.includes('padang') || catLower.includes('minang')) businessType = 'WARUNG_PADANG';
        else if (catLower.includes('warteg') || catLower.includes('bahari')) businessType = 'WARTEG';
        else if (catLower.includes('warmindo') || catLower.includes('burjo')) businessType = 'WARMINDO';
        else if (catLower.includes('angkringan') || catLower.includes('kucingan')) businessType = 'ANGKRINGAN';
        else if (catLower.includes('gorengan')) businessType = 'GORENGAN';
        else if (catLower.includes('penyet') || catLower.includes('sambal') || catLower.includes('geprek')) businessType = 'PENYETAN';
        else if (catLower.includes('soto')) businessType = 'SOTO';
        else if (catLower.includes('bakso')) businessType = 'BAKSO';
        else if (catLower.includes('gulai')) businessType = 'GULAI';
        else if (catLower.includes('catering') || catLower.includes('katering')) businessType = 'CATERING';
        else if (catLower.includes('restoran') || catLower.includes('resto')) businessType = 'RESTORAN';
        else if (catLower.includes('rumah makan') || catLower.includes('rm ') || catLower.includes('warung')) businessType = 'RUMAH_MAKAN';
        else if (catLower.includes('cafe') || catLower.includes('kafe') || catLower.includes('kopi')) businessType = 'KAFE';

        const priors = this.CATEGORY_PRIORS[businessType] || this.CATEGORY_PRIORS['KULINER_UMUM'];
        priors.forEach((ing, idx) => {
            // Give higher prior confidence to items ranked earlier in the prior list
            const priorityConf = Math.max(0.30, 0.45 - (idx * 0.02));
            addDemand(ing, 'WEAK_INFERENCE', 'INFERENCE', `Kategori bisnis: ${businessType}`, `EV-PRIOR-${idx+1}`, priorityConf);
        });

        const ingredientsArray = Array.from(potentialIngredients.values());

        // Calculate overall baseline confidence of our understanding
        if (ingredientsArray.some(i => i.demandSignal === 'DIRECT')) overallConfidence = 0.9;
        else if (ingredientsArray.some(i => i.demandSignal === 'STRONG_INFERENCE')) overallConfidence = 0.7;
        else if (ingredientsArray.some(i => i.demandSignal === 'MODERATE_INFERENCE')) overallConfidence = 0.5;
        else if (ingredientsArray.some(i => i.demandSignal === 'WEAK_INFERENCE')) overallConfidence = 0.3;
        else overallConfidence = 0.1;

        return {
            businessProfile: {
                inferredType: businessType
            },
            demandProfile: {
                categories: [businessType],
                potentialIngredients: ingredientsArray
            },
            evidence: evidenceList,
            unknowns,
            confidence: overallConfidence
        };
    }
}
