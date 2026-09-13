import fs from 'fs';
import path from 'path';

export class ProductCatalog {
    constructor(catalogPath) {
        this.catalogPath = catalogPath || './data/catalog.json';
        this.catalog = [];
        this.loadCatalog();
    }

    loadCatalog() {
        try {
            const raw = fs.readFileSync(this.catalogPath, 'utf-8');
            this.catalog = JSON.parse(raw);
        } catch (e) {
            console.warn("[ProductCatalog] Gagal membaca katalog, menggunakan array kosong.", e.message);
            this.catalog = [];
        }
    }

    getAvailableProducts() {
        return this.catalog.filter(p => p.available_today);
    }

    getProductById(id) {
        return this.catalog.find(p => p.id === id);
    }

    formatForAI() {
        const available = this.getAvailableProducts();
        return available.map(p => `- ${p.id}: ${p.name} (Cocok untuk: ${p.tags.join(', ')})`).join('\\n');
    }
}
