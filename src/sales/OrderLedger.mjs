// src/sales/OrderLedger.mjs
// Database rekapan pesanan harian

import fs from 'fs/promises';
import path from 'path';

export class OrderLedger {
    
    static getLedgerPath() {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return path.resolve(process.cwd(), 'data', 'orders', `order_${yyyy}_${mm}_${dd}.json`);
    }

    static async saveOrder(orderJson) {
        const filePath = this.getLedgerPath();
        let currentData = { date: new Date().toISOString().split('T')[0], orders: [] };
        
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            const raw = await fs.readFile(filePath, 'utf8');
            currentData = JSON.parse(raw);
        } catch (e) {
            // File doesn't exist yet, which is fine
        }

        // Generate unique local ID if missing
        if (!orderJson.order_id) {
            orderJson.order_id = `ORD-${Math.floor(Math.random() * 1000)}`;
        }
        orderJson.timestamp = new Date().toISOString();

        currentData.orders.push(orderJson);

        await fs.writeFile(filePath, JSON.stringify(currentData, null, 2), 'utf8');
        return orderJson;
    }

    static async getTodayOrders() {
        const filePath = this.getLedgerPath();
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch (e) {
            return { orders: [] };
        }
    }
}
