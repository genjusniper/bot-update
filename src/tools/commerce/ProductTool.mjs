// src/tools/commerce/ProductTool.mjs
// V11.1 — Product Lookup Tool (Stub)
// Permission: AUTO (read-only catalog query)
//
// In V12, this will connect to a real product database.
// For now, returns stub results to prove the commerce pipeline.

export const ProductTool = {
  name: 'product_lookup',
  description: 'Look up products from the business catalog. Returns name, price, and stock.',
  category: 'commerce',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Product name or keyword to search.' },
    },
    required: ['query'],
  },
  permissionLevel: 'AUTO',
  timeout: 5000,
  retryPolicy: { maxRetries: 1, backoffMs: 500 },

  /**
   * Execute product lookup.
   * @param {{ query: string }} input
   * @returns {Promise<{ query: string, found: boolean, products: Array }>}
   */
  async execute(input) {
    const { query } = input;

    // V11.1 STUB — mock product catalog
    // TODO: Replace with real database/JSON catalog in V12
    const catalog = [
      { id: 'P001', name: 'Sweety Silver Pants M', price: 45000, stock: 23, unit: 'pcs' },
      { id: 'P002', name: 'Sweety Silver Pants L', price: 48000, stock: 15, unit: 'pcs' },
      { id: 'P003', name: 'Mamy Poko Pants M', price: 42000, stock: 8, unit: 'pcs' },
      { id: 'P004', name: 'Mamy Poko Pants L', price: 46000, stock: 0, unit: 'pcs' },
      { id: 'P005', name: 'Indomie Goreng', price: 3500, stock: 120, unit: 'pcs' },
      { id: 'P006', name: 'Aqua 600ml', price: 4000, stock: 200, unit: 'botol' },
    ];

    const lower = query.toLowerCase();
    const matches = catalog.filter(p =>
      p.name.toLowerCase().includes(lower)
    );

    return {
      source: 'stub_catalog',
      query,
      found: matches.length > 0,
      products: matches,
    };
  },

  audit(input, output) {
    return {
      action: 'product_lookup',
      query: input?.query,
      found: output?.found || false,
      matchCount: output?.products?.length || 0,
    };
  },
};
