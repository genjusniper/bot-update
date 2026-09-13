export class MotherSupplyCatalog {
    constructor() {
        this.inventory = [
            {
                supplyId: "tahu",
                productName: "Tahu Putih",
                aliases: ["tahu putih", "tahu mentah", "tahu"],
                category: "PROTEIN_NABATI",
                available: "AVAILABLE",
                sourcingMode: "PASAR_PAGI",
                freshnessClass: "DAILY_PERISHABLE",
                estimatedAvailability: 100,
                price: 15000,
                margin: 3000,
                notes: "Bahan olahan tahu harian"
            },
            {
                supplyId: "tempe",
                productName: "Tempe Kedelai",
                aliases: ["tempe daun", "tempe bungkus", "tempe"],
                category: "PROTEIN_NABATI",
                available: "AVAILABLE",
                sourcingMode: "PASAR_PAGI",
                freshnessClass: "DAILY_PERISHABLE",
                estimatedAvailability: 100,
                price: 12000,
                margin: 2500,
                notes: "Tempe pasokan warung"
            },
            {
                supplyId: "telur",
                productName: "Telur Ayam",
                aliases: ["telur", "telor", "endog"],
                category: "PROTEIN_HEWANI",
                available: "AVAILABLE",
                sourcingMode: "AGEN",
                freshnessClass: "WEEKLY",
                estimatedAvailability: 300,
                price: 28000,
                margin: 2000,
                notes: "Kiloan pasar"
            },
            {
                supplyId: "daun_singkong",
                productName: "Daun Singkong",
                aliases: ["pucuk ubi", "daun singkong", "godong telo"],
                category: "SAYURAN",
                available: "AVAILABLE",
                sourcingMode: "PASAR_PAGI",
                freshnessClass: "DAILY_PERISHABLE",
                estimatedAvailability: 50,
                price: 10000,
                margin: 3000,
                notes: "Ikat sayur harian"
            },
            {
                supplyId: "gori",
                productName: "Gori Cacah",
                aliases: ["gori", "gori cacah", "cecek gori", "tatal gori", "nangka muda"],
                category: "SAYURAN",
                available: "AVAILABLE",
                sourcingMode: "PASAR_PAGI",
                freshnessClass: "DAILY_PERISHABLE",
                estimatedAvailability: 50,
                price: 12000,
                margin: 3000,
                notes: "Siap masak untuk lodeh, gulai, gudeg"
            },
            {
                supplyId: "bawang_merah",
                productName: "Bawang Merah Kupas",
                aliases: ["brambang", "bawang merah", "brambang kupas", "bawang merah kupas"],
                category: "BUMBU",
                available: "AVAILABLE",
                sourcingMode: "AGEN",
                freshnessClass: "MONTHLY",
                estimatedAvailability: 100,
                price: 35000,
                margin: 5000,
                notes: "Kupasan siap olah"
            },
            {
                supplyId: "bawang_putih",
                productName: "Bawang Putih Kupas",
                aliases: ["garlic", "bawang putih", "bawang putih kupas", "bawang kating"],
                category: "BUMBU",
                available: "AVAILABLE",
                sourcingMode: "AGEN",
                freshnessClass: "MONTHLY",
                estimatedAvailability: 100,
                price: 40000,
                margin: 6000,
                notes: "Kupasan siap olah"
            },
            {
                supplyId: "cabai",
                productName: "Lombok / Cabai",
                aliases: ["lombok", "cabe", "lombok iris", "cabai rawit", "cabe merah", "cabe keriting"],
                category: "BUMBU",
                available: "AVAILABLE",
                sourcingMode: "PASAR_PAGI",
                freshnessClass: "WEEKLY",
                estimatedAvailability: 50,
                price: 60000,
                margin: 8000,
                notes: "Pasokan lombok pasar"
            },
            {
                supplyId: "kelapa_parut",
                productName: "Kelapa Parut",
                aliases: ["kelapa", "santan", "kelapa parut"],
                category: "BAHAN_MASAK",
                available: "AVAILABLE",
                sourcingMode: "PASAR_PAGI",
                freshnessClass: "DAILY_PERISHABLE",
                estimatedAvailability: 50,
                price: 15000,
                margin: 3000,
                notes: "Parutan harian"
            },
            {
                supplyId: "ikan_asin",
                productName: "Ikan Asin",
                aliases: ["gereh", "ikan asin"],
                category: "PROTEIN_HEWANI",
                available: "OUT_OF_STOCK",
                sourcingMode: "AGEN",
                freshnessClass: "MONTHLY",
                estimatedAvailability: 0,
                price: 70000,
                margin: 10000,
                notes: "Stok kosong"
            },
            {
                supplyId: "pisang",
                productName: "Pisang Kepok",
                aliases: ["gedang", "pisang kepok", "pisang"],
                category: "BUAH",
                available: "AVAILABLE",
                sourcingMode: "PASAR_PAGI",
                freshnessClass: "WEEKLY",
                estimatedAvailability: 30,
                price: 25000,
                margin: 5000,
                notes: "Olahan gorengan"
            }
        ];
    }

    getAllItems() {
        return this.inventory;
    }

    getItem(supplyId) {
        return this.inventory.find(i => i.supplyId === supplyId);
    }
}
