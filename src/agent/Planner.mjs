// src/agent/Planner.mjs
// V11 — Agent Planner
// Receives a user intent (from V10 Brain) and produces a plan: an ordered list of tool steps.

export class Planner {
  /**
   * @param {object} options
   * @param {import('../tools/ToolRegistry.mjs').ToolRegistry} options.toolRegistry
   * @param {import('./PermissionPolicy.mjs').PermissionPolicy} options.permissionPolicy
   */
  constructor({ toolRegistry, permissionPolicy }) {
    this.toolRegistry = toolRegistry;
    this.permissionPolicy = permissionPolicy;
  }

  /**
   * Generate an execution plan from a parsed intent/request.
   * 
   * For V11.1, this uses a simple rule-based approach.
   * In V11.2+, this will be replaced with LLM-assisted planning.
   *
   * @param {object} options
   * @param {string} options.intent - The detected intent from V10 Conversation Engine
   * @param {string} options.text - The raw user message
   * @param {object} options.conversationState - The full V10 conversation state
   * @param {object} options.memory - The user's memory context
   * @returns {{ planId: string, steps: Array<{ toolName: string, input: object, permissionCheck: object }> }}
   */
  plan({ intent, text, conversationState = {}, memory = {} }) {
    const planId = `PLAN-${Date.now()}`;
    const steps = [];

    // V11.1: Simple rule-based planning
    // This will evolve into LLM-powered planning in V11.2+

    // Example: If the intent suggests a product query
    if (this._isProductQuery(intent, text)) {
      steps.push(this._createStep('product_lookup', { query: text }));
    }

    // Example: If the intent suggests a calculation
    if (this._isCalculation(intent, text)) {
      steps.push(this._createStep('calculator', { expression: text }));
    }

    // Example: If the intent suggests needing external info
    if (this._isInfoQuery(intent, text)) {
      steps.push(this._createStep('web_search', { query: text }));
    }

    // Example: If the user explicitly asks to send a message
    if (this._isSendWhatsAppMessage(intent, text)) {
      steps.push(this._createStep('send_whatsapp_message', { 
        contactName: this._extractContactName(text),
        message: this._extractMessage(text)
      }));
    }

    // Example: If the user explicitly asks for a reminder/schedule
    if (this._isScheduleReminder(intent, text)) {
      steps.push(this._createStep('schedule_reminder', {
        delayMinutes: 60, // Dummy value, LLM will fill this in correctly in V11.2, but for V11.1 we pass 60
        message: this._extractMessage(text),
        targetJid: arguments[0].userId || ''
      }));
    }

    // Example: If the user asks to run a termux command
    if (this._isTermuxCommand(intent, text)) {
      steps.push(this._createStep('run_termux_command', {
        command: this._extractTermuxCommand(text)
      }));
    }

    return {
      planId,
      steps,
      requiresTools: steps.length > 0,
    };
  }

  /**
   * Create a plan step with permission pre-check.
   * @param {string} toolName
   * @param {object} input
   * @returns {{ toolName: string, input: object, permissionCheck: object }}
   */
  _createStep(toolName, input) {
    const tool = this.toolRegistry.get(toolName);
    const permissionCheck = this.permissionPolicy.check(toolName);

    return {
      toolName,
      input,
      toolExists: !!tool,
      permissionCheck,
    };
  }

  // --- Intent classification helpers (V11.1 rule-based, will be replaced by LLM) ---

  _isProductQuery(intent, text) {
    const keywords = ['stok', 'harga', 'ada', 'produk', 'barang', 'jual', 'beli', 'katalog'];
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  _isCalculation(intent, text) {
    return /\d+\s*[\+\-\*\/\%]\s*\d+/.test(text) || /berapa|hitung|kalkulasi|total|diskon|persen|bagi|kali|tambah|kurang/i.test(text);
  }

  _isInfoQuery(intent, text) {
    const keywords = [
      'cari', 'search', 'info', 'berita', 'cuaca', 'siapa', 'apa itu',
      'dimana', 'kapan', 'gimana cara', 'bagaimana', 'jelaskan', 'carikan',
      'harga', 'kurs', 'dollar', 'bitcoin', 'crypto', 'today', 'hari ini',
      'terbaru', 'terkini', 'update', 'news'
    ];
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  _isSendWhatsAppMessage(intent, text) {
    const lower = text.toLowerCase();
    return (lower.includes('kirim pesan') || lower.includes('chat ke') || lower.includes('kirim wa')) && !lower.includes('gimana');
  }

  _extractContactName(text) {
    const lower = text.toLowerCase();
    const match = lower.match(/(?:ke|buat|untuk)\s+([a-z0-9]+)/i);
    return match ? match[1] : '';
  }

  _isScheduleReminder(intent, text) {
    const lower = text.toLowerCase();
    return lower.includes('ingetin') || lower.includes('ingatkan') || lower.includes('jadwalkan') || lower.includes('remind');
  }

  _isTermuxCommand(intent, text) {
    const lower = text.toLowerCase();
    return lower.includes('termux') || lower.includes('terminal') || lower.includes('perintah') || lower.includes('cmd') || lower.includes('run ');
  }

  _extractTermuxCommand(text) {
    // Basic extraction: if text is "jalankan perintah ls -la", extract "ls -la"
    const lower = text.toLowerCase();
    let cmd = text;
    const prefixes = ['jalankan perintah', 'run termux', 'jalankan termux', 'perintah termux', 'termux:', 'cmd:'];
    for (const p of prefixes) {
      if (lower.includes(p)) {
        cmd = text.substring(lower.indexOf(p) + p.length).trim();
        break;
      }
    }
    // If it's just "run ls", extract "ls"
    if (lower.startsWith('run ')) cmd = text.substring(4).trim();
    return cmd;
  }

  _extractMessage(text) {
    // In a real V11.2 LLM Planner, the LLM will extract the exact message perfectly.
    // For this simple rule-based planner, we just return a prompt for the AI to compose it inside the tool
    return 'Tolong buatkan pesan yang pantas berdasarkan konteks sebelumnya.';
  }
}
