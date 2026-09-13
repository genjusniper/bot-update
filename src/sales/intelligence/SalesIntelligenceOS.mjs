// src/sales/intelligence/SalesIntelligenceOS.mjs

export class BusinessContextEngine {
    static buildContext(contact, history) {
        // Menggabungkan data mentah menjadi narasi konteks bisnis
        const now = Date.now();
        const daysSinceLastOrder = history.lastOrderAt ? Math.round((now - history.lastOrderAt) / 86400000) : null;
        
        return {
            businessType: contact.businessType,
            name: contact.name,
            avgVolume: history.averageLiters || 0,
            reorderPattern: history.orderFrequency ? `Tiap ${history.orderFrequency} hari` : 'Tidak tertebak',
            lastOrder: daysSinceLastOrder ? `${daysSinceLastOrder} hari lalu` : 'Belum pernah',
            previousObjection: history.previousObjection || null,
            status: contact.status
        };
    }
}

export class ProductFitEngine {
    static evaluate(businessType) {
        const fitMap = {
            'RM_PADANG': { fit: 'VERY_HIGH', products: ['Santan Murni (Bulk)'], angle: 'NEXT_DAY_SUPPLY' },
            'KATERING': { fit: 'VERY_HIGH', products: ['Santan Murni', 'Tempe Papan'], angle: 'BULK_EVENT_SUPPLY' },
            'WARTEG': { fit: 'HIGH', products: ['Santan Ecer', 'Tempe Papan'], angle: 'DAILY_RESTOCK' },
            'BURJO': { fit: 'MEDIUM', products: ['Tempe Papan/Ecer'], angle: 'SNACK_RESTOCK' },
            'GORENGAN': { fit: 'LOW', products: ['Tempe Ecer'], angle: 'SNACK_RESTOCK' },
            'LAUNDRY': { fit: 'NO_FIT', products: [], angle: 'SKIP' }
        };

        return fitMap[businessType] || { fit: 'UNKNOWN', products: [], angle: 'DISCOVERY' };
    }
}

export class MessageStrategyEngine {
    static determine(context) {
        if (context.status === 'NEW') return 'DISCOVERY_OPENING';
        if (context.previousObjection && context.previousObjection.includes('harga')) return 'VALUE_REFRAME';
        if (context.lastOrder === 'Belum pernah' || parseInt(context.lastOrder) > 30) return 'LOW_PRESSURE_REENGAGEMENT';
        if (context.avgVolume >= 15) return 'BULK_SUPPLY_CONFIRMATION';
        
        // Default untuk pelanggan rutin yang waktunya restok
        return 'REORDER_CONFIRMATION';
    }
}

export class InternalDataLeakGuard {
    static isSafe(message) {
        // Mendeteksi kebocoran kode internal (ALL_CAPS dengan underscore)
        const leakRegex = /\b[A-Z]{2,}_[A-Z_]+\b/;
        if (leakRegex.test(message)) return false;
        
        // Cek spesifik keyword teknis
        const technicalWords = ['expectedvalue', 'opportunity', 'productfit'];
        const lowerMsg = message.toLowerCase();
        if (technicalWords.some(w => lowerMsg.includes(w))) return false;

        return true;
    }
}

export class MessagePersonalizer {
    static mockAiGeneration(strategy, context, fit) {
        // Konversi businessType internal menjadi sebutan natural
        const naturalTypeMap = {
            'RM_PADANG': 'rumah makan Padang',
            'KATERING': 'katering',
            'WARTEG': 'warteg',
            'BURJO': 'warung burjo',
            'GORENGAN': 'usaha gorengan'
        };
        const naturalBizType = naturalTypeMap[context.businessType] || 'usaha kuliner';

        if (strategy === 'REORDER_CONFIRMATION') {
            return `"Malam ${context.name}, buat stok besok perlu ${fit.products[0]} lagi nggak? Kalau ada, sekalian saya catat biar nggak kelewat jadwal kirim subuh ya."`;
        }
        if (strategy === 'DISCOVERY_OPENING') {
            return `"Halo Pak/Bu dari ${context.name}, saya lihat usahanya ${naturalBizType}. Kami supplier tangan pertama. Biasanya untuk kebutuhan harian ambil ${fit.products[0]} perah atau kemasan? Barangkali kita bisa bantu suplai dengan harga pabrik."`;
        }
        if (strategy === 'VALUE_REFRAME') {
            return `"Malam ${context.name}, besok butuh suplai ${fit.products[0]}? Kemarin sempat bahas harga ya, kalau ambil rutin tiap ${context.reorderPattern} kita bisa sesuaikan lho. Gimana besok butuh berapa liter?"`;
        }
        return `"Malam ${context.name}, butuh suplai ${fit.products[0]} untuk besok?"`;
    }
}
