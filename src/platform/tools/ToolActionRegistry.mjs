// src/platform/tools/ToolActionRegistry.mjs
// ============================================================================
// SALIM AI OPERATING SYSTEM - TOOL & ACTION REGISTRY
// Central registry for business capabilities with schema & permission checks
// ============================================================================

import { GranularPermissionPolicy } from '../policy/GranularPermissionPolicy.mjs';

export class ToolActionRegistry {
    static registry = new Map();

    static {
        // 1. Inventory Check Tool
        this.registerTool({
            name: 'inventory.checkStock',
            description: 'Memeriksa ketersediaan stok produk',
            riskLevel: 'LOW',
            requiredPermission: 'READ_PRODUCT',
            handler: async ({ item }) => {
                return { item: item || 'Santan Kelapa', stock: 45, unit: 'kg', status: 'IN_STOCK' };
            }
        });

        // 2. Change Product Price Tool
        this.registerTool({
            name: 'product.changePrice',
            description: 'Mengubah harga jual produk di katalog',
            riskLevel: 'HIGH',
            requiredPermission: 'CHANGE_PRICE',
            handler: async ({ item, newPrice }) => {
                return { success: true, item, newPrice, updatedAt: new Date().toISOString() };
            }
        });

        // 3. Find Inactive Customers Tool
        this.registerTool({
            name: 'crm.findInactiveCustomers',
            description: 'Mencari pelanggan yang belum melakukan pemesanan > 14 hari',
            riskLevel: 'LOW',
            requiredPermission: 'READ_CUSTOMER',
            handler: async ({ days = 14 }) => {
                return {
                    count: 3,
                    customers: [
                        { name: 'Warteg Jaya Bahari', phone: '08123456781', lastOrderDaysAgo: 18, favorite: 'Kelapa Kupas' },
                        { name: 'RM Padang Sederhana', phone: '08123456782', lastOrderDaysAgo: 21, favorite: 'Santan Murni' },
                        { name: 'Burjo Barokah', phone: '08123456783', lastOrderDaysAgo: 16, favorite: 'Daun Singkong' }
                    ]
                };
            }
        });

        // 4. Create Order Draft Tool
        this.registerTool({
            name: 'order.createDraft',
            description: 'Membuat draf pesanan baru untuk pelanggan',
            riskLevel: 'MEDIUM',
            requiredPermission: 'CREATE_ORDER',
            handler: async ({ customerName, items = [] }) => {
                return {
                    orderId: `ORD_${Date.now()}`,
                    customerName,
                    items,
                    totalEstimated: items.reduce((acc, it) => acc + (it.qty * it.price), 0),
                    status: 'DRAFT_CREATED'
                };
            }
        });

        // 5. Request Refund Tool
        this.registerTool({
            name: 'payment.requestRefund',
            description: 'Membuat permohonan pengembalian dana (refund) untuk pelanggan',
            riskLevel: 'HIGH',
            requiredPermission: 'PROCESS_REFUND',
            handler: async ({ customerName, amount, reason }) => {
                return { refundId: `REF_${Date.now()}`, customerName, amount, reason, status: 'PENDING_APPROVAL' };
            }
        });
    }

    /**
     * Registers a new capability tool
     */
    static registerTool({ name, description, riskLevel = 'LOW', requiredPermission, handler }) {
        if (!name || typeof handler !== 'function') {
            throw new Error('Tool name and valid handler function are required');
        }
        this.registry.set(name, { name, description, riskLevel, requiredPermission, handler });
    }

    /**
     * Executes a tool with permission evaluation
     */
    static async executeTool({ toolName, params = {}, role = 'AI_AGENT' }) {
        const tool = this.registry.get(toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' tidak terdaftar di dalam platform.`);
        }

        // Permission evaluation
        const policyRes = GranularPermissionPolicy.evaluate({
            role,
            permission: tool.requiredPermission,
            payload: params
        });

        if (policyRes.status === 'FORBIDDEN') {
            return { success: false, status: 'BLOCKED', reason: policyRes.reason };
        }

        if (policyRes.status === 'REQUIRES_APPROVAL') {
            return {
                success: false,
                status: 'REQUIRES_APPROVAL',
                reason: policyRes.reason,
                action: toolName,
                params
            };
        }

        // Execute handler
        try {
            const result = await tool.handler(params);
            return { success: true, status: 'EXECUTED', tool: toolName, result };
        } catch (err) {
            return { success: false, status: 'ERROR', error: err.message };
        }
    }
}
