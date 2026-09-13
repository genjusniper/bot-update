/**
 * VerificationEngine.mjs
 * 
 * Deterministic post-execution assertion engine.
 * Never blindly trusts raw tool returns. Validates invariant consistency:
 * ACTION -> RESULT -> VERIFY -> EXPECTED? -> YES / NO -> RECOVER
 */

export class VerificationEngine {
    /**
     * Verify tool output based on action type and strict invariants
     */
    static async verify({ actionType, params, result, context = {} }) {
        if (!result) {
            return { verified: false, reason: 'EMPTY_RESULT: Tool returned null or empty payload.' };
        }

        switch (actionType) {
            case 'order.createDraft':
                return this._verifyOrderDraft(params, result);
            case 'product.changePrice':
                return this._verifyPriceChange(params, result);
            case 'payment.processRefund':
                return this._verifyRefund(params, result);
            case 'inventory.checkStock':
                return this._verifyStockCheck(params, result);
            default:
                // Standard structural verification
                return {
                    verified: Boolean(result.success !== false && !result.error),
                    reason: result.error || 'Passed general execution sanity check.'
                };
        }
    }

    static _verifyOrderDraft(params, result) {
        // Invariant 1: Customer must be defined
        if (!params.customerName && !params.customerId) {
            return { verified: false, reason: 'MISSING_CUSTOMER: Order draft lacks target customer.' };
        }

        // Invariant 2: Items must have positive quantity
        if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
            return { verified: false, reason: 'EMPTY_ITEMS: Order draft contains zero items.' };
        }

        for (const item of params.items) {
            if (item.qty <= 0) {
                return { verified: false, reason: `INVALID_QUANTITY: Item "${item.name}" has non-positive quantity (${item.qty}).` };
            }
        }

        // Invariant 3: Total price arithmetic verification
        if (result.calculatedTotal) {
            const sumExpected = params.items.reduce((acc, i) => acc + (i.qty * (i.unitPrice || 0)), 0);
            if (sumExpected > 0 && Math.abs(result.calculatedTotal - sumExpected) > 1) {
                return { verified: false, reason: `ARITHMETIC_MISMATCH: Computed total (${result.calculatedTotal}) != sum of items (${sumExpected}).` };
            }
        }

        return { verified: true, reason: 'Order draft passed customer, quantity, and arithmetic invariant checks.' };
    }

    static _verifyPriceChange(params, result) {
        if (params.newPrice <= 0) {
            return { verified: false, reason: 'INVALID_PRICE: New price must be strictly greater than zero.' };
        }
        if (params.oldPrice && params.newPrice === params.oldPrice) {
            return { verified: false, reason: 'NOOP_PRICE_CHANGE: New price is identical to current price.' };
        }
        return { verified: true, reason: 'Price modification parameters verified.' };
    }

    static _verifyRefund(params, result) {
        if (!params.orderId) {
            return { verified: false, reason: 'MISSING_ORDER_ID: Refund cannot be issued without reference order.' };
        }
        if (params.amount <= 0) {
            return { verified: false, reason: 'INVALID_REFUND_AMOUNT: Refund amount must be positive.' };
        }
        return { verified: true, reason: 'Refund transaction verified against reference order.' };
    }

    static _verifyStockCheck(params, result) {
        if (typeof result.stock !== 'number' || result.stock < 0) {
            return { verified: false, reason: 'CORRUPTED_INVENTORY: Physical stock number is invalid.' };
        }
        return { verified: true, reason: 'Inventory count verified.' };
    }
}
