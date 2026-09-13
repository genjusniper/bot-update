const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
// Import OpenAI Provider
let OpenAIProviderModule = null;
(async () => {
  try {
    const mod = await import('./src/ai/providers/OpenAIProvider.mjs');
    OpenAIProviderModule = mod.OpenAIProvider;
  } catch (e) { console.error('OpenAI Provider fail:', e); }
})();

// ======================================
// PROACTIVE BRAIN IMPORT
// ======================================
let proactiveBrain = null;
(async () => {
  try {
    const pbMod = await import('./src/agent/background/ProactiveBrain.mjs');
    proactiveBrain = new pbMod.ProactiveBrain();
    console.log('⏰ ProactiveBrain loaded successfully');
  } catch (err) {
    console.error('⚠️ ProactiveBrain gagal dimuat:', err.message);
  }
})();

// ======================================
// V4 AUTOMATION
// ======================================
// ============================================================
// IDENTITY_LAYER_V43
// ============================================================
let identityV43 = null;

(async () => {
  try {
    identityV43 = await import('./automation/identity.mjs');
    console.log('🆔 V4.3 Identity Layer loaded');
  } catch (err) {
    console.log(
      '⚠️ Identity Layer gagal dimuat:',
      err.message
    );
  }
})();

let v4Automation = null;

(async () => {
  try {
    v4Automation = await import('./automation/integration.mjs');
    console.log('⏰ V4 Automation module loaded');
  } catch (err) {
    console.log(
      '⚠️ V4 Automation gagal dimuat:',
      err.message
    );
  }
})();


// ============================================================
// WA BOT V3 — MEMORY & CONTEXT ENGINE
// ============================================================

const SESSION_DIR = './auth-v7';
const MEMORY_DIR = './memory';

const ALLOWED_CONTACTS = [
  '6281325554282@s.whatsapp.net', // Novita
  '6281935596653@s.whatsapp.net', // Ayu
  '6285865977271@s.whatsapp.net', // Mba Tami
  '6285600596826@s.whatsapp.net', // Unknown from yesterday
  '6285879195251@s.whatsapp.net', // Nuraii
  '6285602612832@s.whatsapp.net', // Hanif
  '6285600961769@s.whatsapp.net', // Aziz
  '6285134755110@s.whatsapp.net'  // Vio
];

const CONTACT_NAMES = {
  '6281325554282@s.whatsapp.net': 'Novita',
  '6281935596653@s.whatsapp.net': 'Ayu',
  '6285865977271@s.whatsapp.net': 'Mba Tami',
  '6285879195251@s.whatsapp.net': 'Nuraii',
  '6285602612832@s.whatsapp.net': 'Hanif',
  '6285600961769@s.whatsapp.net': 'Aziz',
  '6285134755110@s.whatsapp.net': 'Vio'
};


// ============================================================
// LID_MAPPING_PERSIST_V421
// ============================================================

const LID_MAP_FILE_V421 = './memory/lid-map.json';

function loadPersistentLidMapV421() {
  try {

    if (!fs.existsSync(LID_MAP_FILE_V421)) {
      return {
        lidToPn: {},
        pnToLid: {},
        updatedAt: null
      };
    }

    const data =
      JSON.parse(
        fs.readFileSync(
          LID_MAP_FILE_V421,
          'utf8'
        )
      );

    return {
      lidToPn:
        data?.lidToPn &&
        typeof data.lidToPn === 'object'
          ? data.lidToPn
          : {},

      pnToLid:
        data?.pnToLid &&
        typeof data.pnToLid === 'object'
          ? data.pnToLid
          : {},

      updatedAt:
        data?.updatedAt || null
    };

  } catch (err) {

    console.log(
      '⚠️ LID database gagal dibaca:',
      err.message
    );

    return {
      lidToPn: {},
      pnToLid: {},
      updatedAt: null
    };
  }
}

let persistentLidMapV421 =
  loadPersistentLidMapV421();

function savePersistentLidMapV421() {

  try {

    persistentLidMapV421.updatedAt =
      new Date().toISOString();

    fs.writeFileSync(
      LID_MAP_FILE_V421,
      JSON.stringify(
        persistentLidMapV421,
        null,
        2
      ),
      'utf8'
    );

  } catch (err) {

    console.log(
      '⚠️ LID database gagal disimpan:',
      err.message
    );
  }
}

function persistLidMappingV421(lid, pn) {

  if (
    !lid ||
    !pn ||
    typeof lid !== 'string' ||
    typeof pn !== 'string'
  ) {
    return false;
  }

  if (
    !lid.endsWith('@lid') ||
    !pn.endsWith('@s.whatsapp.net')
  ) {
    return false;
  }

  // Hanya nomor whitelist yang boleh disimpan.
  if (
    !ALLOWED_CONTACTS.includes(pn)
  ) {
    return false;
  }

  persistentLidMapV421.lidToPn[lid] = pn;
  persistentLidMapV421.pnToLid[pn] = lid;

  savePersistentLidMapV421();

  console.log(
    `🧠 LID MAP TERSIMPAN: ${lid} ↔ ${pn}`
  );

  return true;
}


// Load .env file
try { require('dotenv').config(); } catch(e) {}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY belum terpasang.');
  process.exit(1);
}

// ------------------------------------------------------------
// PHASE C: AIGateway Initialization
// ------------------------------------------------------------
let aiGateway = null;
(async () => {
  try {
    const { createAIGateway } = await import('./src/ai/index.mjs');
    aiGateway = createAIGateway(GEMINI_API_KEY);
    console.log('✅ AIGateway & Providers loaded successfully');
  } catch (err) {
    console.error('❌ Gagal memuat AIGateway:', err.message);
  }
})();

// ------------------------------------------------------------
// PHASE H: V11 Agent Core Initialization
// ------------------------------------------------------------
let agentCore = null;
(async () => {
  try {
    const { AgentCore } = await import('./src/agent/AgentCore.mjs');
    const { ToolRegistry } = await import('./src/tools/ToolRegistry.mjs');
    const { WebSearchTool } = await import('./src/tools/web/WebSearchTool.mjs');
    const { CalculatorTool } = await import('./src/tools/web/CalculatorTool.mjs');
    const { SendWhatsAppMessageTool } = await import('./src/tools/whatsapp/SendWhatsAppMessageTool.mjs');
    const { GetContactsTool } = await import('./src/tools/whatsapp/GetContactsTool.mjs');
    const { ScheduleReminderTool } = await import('./src/tools/whatsapp/ScheduleReminderTool.mjs');
    const { TermuxCommandTool } = await import('./src/tools/system/TermuxCommandTool.mjs');
    
    const registry = new ToolRegistry();
    registry.register(WebSearchTool);
    registry.register(CalculatorTool);
    registry.register(SendWhatsAppMessageTool);
    registry.register(GetContactsTool);
    registry.register(ScheduleReminderTool);
    registry.register(TermuxCommandTool);
    
    agentCore = new AgentCore({ toolRegistry: registry });
    console.log('🤖 V11 Agent Core loaded successfully');
  } catch (err) {
    console.error('❌ Gagal memuat V11 Agent Core:', err.message);
  }
})();

// Legacy ai instance is KEPT strictly for backward compatibility bridge
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

// ============================================================
// CONFIG
// ============================================================

const USE_V10_CONVERSATION_ENGINE = true;
const USE_V10_MEMORY_ENGINE = true;



const CONFIG = {
  DEBOUNCE_MS: 1500, // Reduced from 4000 for faster response bundling

  MIN_REPLY_DELAY: 500, // Reduced from 1200 for quicker typing simulation
  MAX_REPLY_DELAY: 1200, // Reduced from 3000

  MAX_REPLIES_PER_WINDOW: 150, // Raised from 5 to avoid rate-limiting active chats
  RATE_LIMIT_WINDOW_MS: 1 * 60 * 1000, // Reduced window to 1 minute

  COOLDOWN_MS: 1000, // Reduced from 2500

  MAX_SHORT_MEMORY: 80, // Perbesar window: simpan 80 chat terakhir untuk konteks lebih luas

  MAX_LONG_MEMORY: 30, // Tambah slot memori jangka panjang

  SUMMARY_TRIGGER: 50, // Setiap 50 chat, AI otomatis meringkas dan memadatkan ke memori jangka panjang

  GEMINI_RETRIES: 2,

  RETRY_DELAY_MS: 1500
};

function getMessageText(messageObj) {
  if (!messageObj) return '';
  if (typeof messageObj === 'string') return messageObj;
  
  // Avoid returning placeholder for incoming audio messages to let Whisper transcriber run
  const text = messageObj.conversation || 
               messageObj.extendedTextMessage?.text || 
               messageObj.imageMessage?.caption || 
               messageObj.videoMessage?.caption || 
               '';
  if (text) return text;
  
  if (messageObj.stickerMessage) return '[Sticker]';
  if (messageObj.documentMessage) return `[Dokumen: ${messageObj.documentMessage.title || 'Berkas'}]`;
  if (messageObj.contactMessage) return `[Kontak: ${messageObj.contactMessage.displayName || 'Nama'}]`;
  if (messageObj.locationMessage) return '[Lokasi]';
  
  for (const k of Object.keys(messageObj)) {
    if (messageObj[k] && typeof messageObj[k] === 'object') {
      const subText = messageObj[k].text || messageObj[k].caption || messageObj[k].conversation;
      if (typeof subText === 'string' && subText.trim()) return subText;
    }
  }
  return '';
}

function getQuotedMessageText(quotedMsg) {
  if (!quotedMsg) return '';
  if (quotedMsg.audioMessage) return '[Voice Note/Audio]';
  return getMessageText(quotedMsg);
}

// ============================================================
// STATE
// ============================================================

const shortMemory = new Map();

const pendingMessages = new Map();

const contactQueues = new Map();

const rateLimits = new Map();

const cooldowns = new Map();

const memoryLocks = new Map();

let botEnabled = true;

let currentSocket = null;

let reconnectAttempts = 0;

let botStartTime = Date.now();

// ============================================================
// STARTUP
// ============================================================

fs.mkdirSync(MEMORY_DIR, {
  recursive: true
});

// ============================================================
// UTILITY
// ============================================================

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}

function randomDelay(min, max) {
  return (
    min +
    Math.floor(
      Math.random() *
      (max - min + 1)
    )
  );
}

function safeFilename(jid) {
  return jid
    .replace(/[^a-zA-Z0-9_-]/g, '_');
}

function memoryPath(jid) {
  return path.join(
    MEMORY_DIR,
    `${safeFilename(jid)}.json`
  );
}

function formatUptime() {
  const seconds =
    Math.floor(
      (Date.now() - botStartTime) / 1000
    );

  const h =
    Math.floor(seconds / 3600);

  const m =
    Math.floor(
      (seconds % 3600) / 60
    );

  const s =
    seconds % 60;

  return `${h}j ${m}m ${s}d`;
}

// ============================================================
// MEMORY FILE
// ============================================================

function createDefaultMemory(jid) {
  return {
    jid,

    createdAt: Date.now(),

    updatedAt: Date.now(),

    summary: '',

    facts: [],

    preferences: [],

    topics: [],

    shortTerm: [],

    messageCount: 0
  };
}

function loadMemory(jid) {
  if (shortMemory.has(jid)) {
    return shortMemory.get(jid);
  }

  const file =
    memoryPath(jid);

  let data;

  try {
    if (fs.existsSync(file)) {
      data =
        JSON.parse(
          fs.readFileSync(
            file,
            'utf8'
          )
        );

      console.log(
        `🧠 Memory loaded: ${jid}`
      );

    } else {
      data =
        createDefaultMemory(jid);
    }

  } catch (err) {

    console.error(
      `❌ Memory load error ${jid}:`,
      err.message
    );

    data =
      createDefaultMemory(jid);
  }

  shortMemory.set(
    jid,
    data
  );

  return data;
}

// ============================================================
// SAVE MEMORY
// ============================================================

async function saveMemory(jid) {
  const data =
    shortMemory.get(jid);

  if (!data) {
    return;
  }

  data.updatedAt =
    Date.now();

  const file =
    memoryPath(jid);

  const temp =
    `${file}.tmp`;

  try {

    fs.writeFileSync(
      temp,
      JSON.stringify(
        data,
        null,
        2
      ),
      'utf8'
    );

    fs.renameSync(
      temp,
      file
    );

  } catch (err) {

    console.error(
      `❌ Memory save error ${jid}:`,
      err.message
    );
  }
}

// ============================================================
// MEMORY LOCK
// ============================================================

async function withMemoryLock(
  jid,
  callback
) {
  while (
    memoryLocks.get(jid)
  ) {
    await sleep(50);
  }

  memoryLocks.set(
    jid,
    true
  );

  try {
    return await callback();

  } finally {
    memoryLocks.delete(jid);
  }
}


// ============================================================
// V9.1 MEMORY 2.0
// Relevance + importance + confidence + episodes + topic learning
// ============================================================

function ensureMemoryV91(data) {
  if (!data || typeof data !== 'object') return data;

  if (!Array.isArray(data.facts)) data.facts = [];
  if (!Array.isArray(data.preferences)) data.preferences = [];
  if (!Array.isArray(data.topics)) data.topics = [];
  if (!Array.isArray(data.shortTerm)) data.shortTerm = [];

  if (!Array.isArray(data.episodes)) data.episodes = [];
  if (!Array.isArray(data.memoryEvents)) data.memoryEvents = [];

  if (!data.memoryMeta || typeof data.memoryMeta !== 'object') {
    data.memoryMeta = {
      version: '9.1',
      lastAnalysisAt: 0,
      totalPromotions: 0
    };
  }

  data.memoryMeta.version = '9.1';

  return data;
}

function normalizeMemoryItem(item, type = 'fact') {
  if (typeof item === 'string') {
    const value = item.trim();

    if (!value) return null;

    return {
      value,
      type,
      importance: type === 'fact' ? 0.7 : 0.5,
      confidence: 0.7,
      source: 'conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastSeen: Date.now()
    };
  }

  if (!item || typeof item !== 'object') return null;

  const value = String(
    item.value ||
    item.text ||
    item.name ||
    ''
  ).trim();

  if (!value) return null;

  return {
    ...item,
    value,
    type: item.type || type,
    importance: Number.isFinite(Number(item.importance))
      ? Math.max(0, Math.min(1, Number(item.importance)))
      : 0.5,
    confidence: Number.isFinite(Number(item.confidence))
      ? Math.max(0, Math.min(1, Number(item.confidence)))
      : 0.7,
    source: item.source || 'conversation',
    createdAt: item.createdAt || Date.now(),
    updatedAt: Date.now(),
    lastSeen: Date.now()
  };
}

function memorySimilarityScore(memory, query) {
  const value = String(memory?.value || memory || '').toLowerCase();
  const text = String(query || '').toLowerCase();

  if (!value || !text) return 0;

  const words = text
    .split(/\s+/)
    .map(x => x.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(x => x.length >= 3);

  if (!words.length) return 0;

  let matches = 0;

  for (const word of words) {
    if (value.includes(word)) matches++;
  }

  return matches / words.length;
}

function memoryRecencyScore(memory) {
  const lastSeen = Number(
    memory?.lastSeen ||
    memory?.updatedAt ||
    memory?.createdAt ||
    0
  );

  if (!lastSeen) return 0.2;

  const ageDays = Math.max(
    0,
    (Date.now() - lastSeen) / 86400000
  );

  return Math.max(
    0.1,
    Math.exp(-ageDays / 60)
  );
}

function memoryFinalScore(memory, query) {
  const relevance = memorySimilarityScore(memory, query);
  const importance = Number(memory?.importance ?? 0.5);
  const confidence = Number(memory?.confidence ?? 0.7);
  const recency = memoryRecencyScore(memory);

  return (
    relevance * 0.50 +
    importance * 0.25 +
    confidence * 0.15 +
    recency * 0.10
  );
}

function retrieveRelevantMemoryV91(jid, query, limit = 8) {
  const data = ensureMemoryV91(loadMemory(jid));
  const memories = [];

  for (const type of ['facts', 'preferences', 'topics']) {
    for (const raw of data[type]) {
      const item = normalizeMemoryItem(raw, type.slice(0, -1));

      if (!item) continue;

      const score = memoryFinalScore(item, query);

      if (score > 0) {
        memories.push({
          ...item,
          score
        });
      }
    }
  }

  return memories
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function recordTopicMemoryV91(data, topic) {
  if (!topic) return;

  const normalized = String(topic).trim();

  if (!normalized) return;

  const existing = data.topics.find(item => {
    if (typeof item === 'string') {
      return item.toLowerCase() === normalized.toLowerCase();
    }

    return String(item?.value || '').toLowerCase() ===
      normalized.toLowerCase();
  });

  if (existing && typeof existing === 'object') {
    existing.frequency = Number(existing.frequency || 0) + 1;
    existing.lastSeen = Date.now();
    existing.updatedAt = Date.now();
    return;
  }

  data.topics.push({
    value: normalized,
    type: 'topic',
    frequency: 1,
    importance: 0.4,
    confidence: 0.8,
    source: 'conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastSeen: Date.now()
  });

  if (data.topics.length > CONFIG.MAX_LONG_MEMORY) {
    data.topics = data.topics
      .map(x => normalizeMemoryItem(x, 'topic'))
      .filter(Boolean)
      .sort((a, b) =>
        Number(b.frequency || 0) - Number(a.frequency || 0)
      )
      .slice(0, CONFIG.MAX_LONG_MEMORY);
  }
}

function addMemoryEpisodeV91(data, episode) {
  if (!episode || typeof episode !== 'object') return;

  const clean = {
    id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    summary: String(episode.summary || '').trim(),
    topic: String(episode.topic || '').trim(),
    emotion: String(episode.emotion || '').trim(),
    importance: Math.max(
      0,
      Math.min(1, Number(episode.importance ?? 0.4))
    ),
    createdAt: Date.now(),
    lastSeen: Date.now()
  };

  if (!clean.summary) return;

  data.episodes.push(clean);

  data.episodes = data.episodes
    .slice(-20);
}

function buildRelevantMemoryContextV91(jid, query) {
  const data = ensureMemoryV91(loadMemory(jid));

  const relevant = retrieveRelevantMemoryV91(
    jid,
    query,
    8
  );

  const episodes = Array.isArray(data.episodes)
    ? data.episodes
        .slice()
        .sort((a, b) =>
          Number(b.lastSeen || 0) -
          Number(a.lastSeen || 0)
        )
        .slice(0, 3)
    : [];

  const lines = [];

  for (const item of relevant) {
    lines.push(
      `[${item.type}] ${item.value}`
    );
  }

  for (const episode of episodes) {
    if (episode.summary) {
      lines.push(
        `[episode] ${episode.summary}`
      );
    }
  }

  return lines.join('\n');
}

// ============================================================
// END V9.1 MEMORY 2.0
// ============================================================



// ============================================================
// V9.3 RELIABILITY + RECOVERY ENGINE
// ============================================================

function safeJsonParseV93(value, fallback = null) {
  try {
    if (typeof value !== 'string') return fallback;

    const cleaned = value
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

function sanitizeResponseV93(response) {
  if (response === null || response === undefined) {
    return '';
  }

  return String(response)
    .replace(/\u0000/g, '')
    .trim();
}

function responseLooksUsableV93(response) {
  const text = sanitizeResponseV93(response);

  if (!text) return false;

  if (text.length < 1) return false;

  // Jangan menerima response yang terlihat seperti error mentah.
  const badPatterns = [
    /^undefined$/i,
    /^null$/i,
    /^error$/i,
    /^internal server error$/i,
    /^object Object$/i
  ];

  return !badPatterns.some(regex => regex.test(text));
}

function createFallbackResponseV93(incomingText = '') {
  const text = String(incomingText || '').trim();

  if (!text) {
    return 'Iya, aku di sini.';
  }

  if (/^(p|ping)$/i.test(text)) {
    return 'Hadir 😄';
  }

  if (/^(iya|ya|yo|oke|ok)$/i.test(text)) {
    return 'Hehe iya 😄';
  }

  if (/capek|lelah|mumet|pusing|stres|sedih|bingung/i.test(text)) {
    return 'Pelan-pelan dulu. Aku temenin.';
  }

  return 'Iya, aku nangkep. Lanjut aja.';
}


// ============================================================
// V9.4 API RESILIENCE + QUOTA PROTECTION
// ============================================================

let globalGeminiQuotaState = { exhausted: false, resetAt: 0 };
const GLOBAL_QUOTA_COOLDOWN_MS = 2 * 60 * 1000;

function isGeminiQuotaErrorV94(err) {
  const raw = String(
    err?.message ||
    err?.error?.message ||
    err ||
    ''
  ).toLowerCase();

  return (
    raw.includes('429') ||
    raw.includes('resource_exhausted') ||
    raw.includes('resource exhausted') ||
    raw.includes('quota exceeded') ||
    raw.includes('generate_content_free_tier_requests') ||
    raw.includes('ratelimit') ||
    raw.includes('rate limit')
  );
}

function isGeminiRetryableErrorV94(err) {
  if (isGeminiQuotaErrorV94(err)) {
    return false;
  }

  const raw = String(
    err?.message ||
    err?.error?.message ||
    err ||
    ''
  ).toLowerCase();

  return (
    raw.includes('timeout') ||
    raw.includes('timed out') ||
    raw.includes('network') ||
    raw.includes('fetch failed') ||
    raw.includes('econnreset') ||
    raw.includes('econnrefused') ||
    raw.includes('socket') ||
    raw.includes('500') ||
    raw.includes('502') ||
    raw.includes('503') ||
    raw.includes('504') ||
    raw.includes('internal server error') ||
    raw.includes('service unavailable')
  );
}

function createV94FallbackResponse(incomingText = '', reason = '') {
  const fallback = createFallbackResponseV93(incomingText);

  console.log(
    `🛟 V9.4 Local fallback digunakan${reason ? `: ${reason}` : ''}`
  );

  return fallback;
}

// ============================================================
// END V9.4 API RESILIENCE
// ============================================================


async function callGeminiSafeV93(prompt, options = {}) {
  if (aiGateway) {
     return await aiGateway.generate(prompt, options);
  }

  const now = Date.now();
  if (globalGeminiQuotaState.exhausted && now < globalGeminiQuotaState.resetAt) {
    console.warn(`🛑 V9.4 Global Gemini Quota Cooldown active. Skipping request.`);
    return {
      ok: false,
      response: '',
      attempt: 0,
      error: 'Gemini quota cooldown active',
      quotaExhausted: true
    };
  } else if (globalGeminiQuotaState.exhausted && now >= globalGeminiQuotaState.resetAt) {
    console.log(`⏳ V9.4 Global Gemini Quota Cooldown reset. Retrying API.`);
    globalGeminiQuotaState.exhausted = false;
  }

  const maxAttempts = Math.max(
    1,
    Number(options.maxAttempts || 2)
  );

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🧠 Gemini ${attempt}/${maxAttempts}`);

      const result = await callGemini(prompt);
      const clean = sanitizeResponseV93(result);

      if (responseLooksUsableV93(clean)) {
        return {
          ok: true,
          response: clean,
          attempt,
          error: null,
          quotaExhausted: false
        };
      }

      lastError = new Error(
        'Empty or unusable Gemini response'
      );

      console.warn(
        `⚠️ V9.4 Gemini response tidak usable pada attempt ${attempt}`
      );

    } catch (err) {
      lastError = err;

      const quotaError = isGeminiQuotaErrorV94(err);
      const retryable = isGeminiRetryableErrorV94(err);

      console.error(
        `⚠️ V9.4 Gemini attempt ${attempt} gagal:`,
        err?.message || err
      );

      // 429 / quota:
      // JANGAN retry karena retry tidak mengembalikan quota.
      if (quotaError) {
        console.error(
          '🛑 V9.4 Gemini quota exhausted — retry dihentikan'
        );

        let retryDelay = GLOBAL_QUOTA_COOLDOWN_MS;
        const match = String(err?.message || err).match(/retry[- ]after\s*(\d+)/i);
        if (match && match[1]) {
           retryDelay = Math.max(GLOBAL_QUOTA_COOLDOWN_MS, parseInt(match[1]) * 1000);
        }
        
        globalGeminiQuotaState.exhausted = true;
        globalGeminiQuotaState.resetAt = Date.now() + retryDelay;

        return {
          ok: false,
          response: '',
          attempt,
          error: err?.message || String(err),
          quotaExhausted: true
        };
      }

      // Error non-retryable lainnya
      if (!retryable) {
        console.error(
          '🛑 V9.4 Error non-retryable — retry dihentikan'
        );

        return {
          ok: false,
          response: '',
          attempt,
          error: err?.message || String(err),
          quotaExhausted: false
        };
      }
    }

    if (attempt < maxAttempts) {
      const delay = 500 * attempt;

      console.log(
        `⏳ V9.4 retry dalam ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  return {
    ok: false,
    response: '',
    attempt: maxAttempts,
    error: lastError?.message || 'unknown error',
    quotaExhausted: false
  };
}
function safeEngineExecutionV93(name, fn, fallback = {}) {
  try {
    const result = fn();

    return {
      ok: true,
      name,
      result
    };

  } catch (err) {

    console.error(
      `⚠️ V9.3 Engine ${name} gagal:`,
      err?.message || err
    );

    return {
      ok: false,
      name,
      result: fallback,
      error: err?.message || String(err)
    };
  }
}

function ensureMemoryIntegrityV93(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const defaults = {
    summary: '',
    facts: [],
    preferences: [],
    topics: [],
    shortTerm: [],
    messageCount: 0
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (data[key] === undefined || data[key] === null) {
      data[key] =
        Array.isArray(value)
          ? []
          : value;
    }
  }

  if (!Array.isArray(data.facts)) {
    data.facts = [];
  } else {
    data.facts = data.facts.filter(x => x !== '[object Object]');
  }

  if (!Array.isArray(data.preferences)) {
    data.preferences = [];
  } else {
    data.preferences = data.preferences.filter(x => x !== '[object Object]');
  }

  if (!Array.isArray(data.topics)) {
    data.topics = [];
  } else {
    data.topics = data.topics.filter(x => x !== '[object Object]');
  }

  if (!Array.isArray(data.shortTerm)) {
    data.shortTerm = [];
  }

  if (!Number.isFinite(Number(data.messageCount))) {
    data.messageCount = 0;
  }

  return true;
}

function createV93RuntimeHealth() {
  return {
    startedAt: Date.now(),
    enginesFailed: 0,
    geminiFailures: 0,
    fallbackResponses: 0,
    memoryRepairs: 0
  };
}

function recordV93EngineFailure(health) {
  if (health) {
    health.enginesFailed++;
  }
}

function recordV93GeminiFailure(health) {
  if (health) {
    health.geminiFailures++;
  }
}

function recordV93Fallback(health) {
  if (health) {
    health.fallbackResponses++;
  }
}

function buildV93ReliabilityInstruction(health = {}) {
  return `
=== V9.3 RELIABILITY ===

Respons utama tetap harus natural dan sesuai konteks.

Jangan:
- mengarang fakta ketika context tidak tersedia
- menyebut error internal
- menyebut engine atau sistem
- membuat respons teknis kepada user
- mengubah percakapan menjadi formal hanya karena ada fallback

Jika informasi tidak tersedia:
gunakan bahasa natural seperti "aku belum tahu soal itu" daripada mengarang.

Jika pesan user pendek:
jangan membuat jawaban panjang.

Runtime health:
engineFailures=${Number(health.enginesFailed || 0)}
geminiFailures=${Number(health.geminiFailures || 0)}
fallbackResponses=${Number(health.fallbackResponses || 0)}
`;
}

// ============================================================
// END V9.3 RELIABILITY + RECOVERY ENGINE
// ============================================================

// ============================================================
// V9.2 MEMORY SAFETY + CONFLICT RESOLUTION
// ============================================================

function memoryCanonical(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function memoryLooksLikeConflict(a, b) {
  const x = memoryCanonical(a);
  const y = memoryCanonical(b);

  if (!x || !y || x === y) return false;

  const oppositePatterns = [
    ['suka', 'tidak suka'],
    ['suka', 'nggak suka'],
    ['suka', 'gak suka'],
    ['ingin', 'tidak ingin'],
    ['ingin', 'nggak ingin'],
    ['ingin', 'gak ingin'],
    ['mau', 'tidak mau'],
    ['mau', 'nggak mau'],
    ['mau', 'gak mau'],
    ['tinggal', 'pindah'],
    ['kerja', 'berhenti kerja']
  ];

  for (const [a1, b1] of oppositePatterns) {
    if (
      (x.includes(a1) && y.includes(b1)) ||
      (x.includes(b1) && y.includes(a1))
    ) {
      return true;
    }
  }

  return false;
}

function resolveMemoryConflictsV92(data) {
  ensureMemoryV91(data);

  const collections = [
    ['facts', data.facts],
    ['preferences', data.preferences],
    ['topics', data.topics]
  ];

  let conflicts = 0;

  for (const [, list] of collections) {
    if (!Array.isArray(list)) continue;

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = normalizeMemoryItem(list[i]);
        const b = normalizeMemoryItem(list[j]);

        if (!a || !b) continue;

        if (memoryLooksLikeConflict(a.value, b.value)) {
          conflicts++;

          const aConfidence = Number(a.confidence ?? 0.5);
          const bConfidence = Number(b.confidence ?? 0.5);

          if (aConfidence >= bConfidence) {
            b.confidence = Math.max(0.1, bConfidence * 0.65);
          } else {
            a.confidence = Math.max(0.1, aConfidence * 0.65);
          }

          list[i] = a;
          list[j] = b;
        }
      }
    }
  }

  return {
    conflicts,
    resolved: conflicts > 0
  };
}

function applyMemoryDecayV92(data) {
  ensureMemoryV91(data);

  const now = Date.now();

  for (const type of ['facts', 'preferences', 'topics']) {
    data[type] = data[type]
      .map(raw => normalizeMemoryItem(raw, type.slice(0, -1)))
      .filter(Boolean)
      .map(item => {
        const lastSeen = Number(
          item.lastSeen ||
          item.updatedAt ||
          item.createdAt ||
          now
        );

        const ageDays = Math.max(
          0,
          (now - lastSeen) / 86400000
        );

        // Memory lama turun perlahan,
        // tetapi tidak pernah langsung hilang.
        if (ageDays > 30) {
          item.confidence = Math.max(
            0.15,
            Number(item.confidence ?? 0.7) * 0.995
          );
        }

        item.updatedAt = now;

        return item;
      });
  }
}

function promoteMemoryV92(data, value, type = 'fact', options = {}) {
  ensureMemoryV91(data);

  const normalized = memoryCanonical(value);

  if (!normalized || normalized.length < 3) {
    return false;
  }

  const listName = type === 'preference'
    ? 'preferences'
    : type === 'topic'
      ? 'topics'
      : 'facts';

  const list = data[listName];

  const existingIndex = list.findIndex(item => {
    const current = typeof item === 'string'
      ? item
      : item?.value;

    return memoryCanonical(current) === normalized;
  });

  if (existingIndex >= 0) {
    const existing = normalizeMemoryItem(
      list[existingIndex],
      type
    );

    existing.confidence = Math.min(
      1,
      Number(existing.confidence ?? 0.5) +
      Number(options.confidenceBoost ?? 0.08)
    );

    existing.importance = Math.max(
      Number(existing.importance ?? 0.5),
      Number(options.importance ?? 0.5)
    );

    existing.lastSeen = Date.now();
    existing.updatedAt = Date.now();

    list[existingIndex] = existing;

    return true;
  }

  list.push({
    value: String(value).trim(),
    type,
    importance: Math.max(
      0,
      Math.min(1, Number(options.importance ?? 0.5))
    ),
    confidence: Math.max(
      0,
      Math.min(1, Number(options.confidence ?? 0.7))
    ),
    source: options.source || 'conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastSeen: Date.now()
  });

  if (list.length > CONFIG.MAX_LONG_MEMORY) {
    list.splice(
      0,
      list.length - CONFIG.MAX_LONG_MEMORY
    );
  }

  return true;
}

function memorySafetySweepV92(jid) {
  const data = ensureMemoryV91(loadMemory(jid));

  const conflictResult =
    resolveMemoryConflictsV92(data);

  applyMemoryDecayV92(data);

  data.memoryMeta.lastSafetySweep = Date.now();
  data.memoryMeta.conflictsDetected =
    Number(data.memoryMeta.conflictsDetected || 0) +
    conflictResult.conflicts;

  return {
    data,
    conflictResult
  };
}

// ============================================================
// END V9.2 MEMORY SAFETY + CONFLICT RESOLUTION
// ============================================================

// ============================================================
// ADD SHORT MEMORY
// ============================================================

async function addConversation(
  jid,
  role,
  text
) {
  const data =
    loadMemory(jid);

  data.shortTerm.push({
    role,
    text,
    time: Date.now()
  });

  data.messageCount++;

  while (
    data.shortTerm.length >
    CONFIG.MAX_SHORT_MEMORY
  ) {
    data.shortTerm.shift();
  }

  await saveMemory(jid);
}

// ============================================================
// V4.7 SMART MEMORY RECALL
// ============================================================

function smartMemoryRecall(jid, query) {
  const data = loadMemory(jid);

  const memories = [];

  for (const item of [
    ...(Array.isArray(data.facts) ? data.facts : []),
    ...(Array.isArray(data.preferences) ? data.preferences : []),
    ...(Array.isArray(data.topics) ? data.topics : [])
  ]) {
    if (typeof item === 'string' && item.trim()) {
      memories.push(item.trim());
    }
  }

  if (!memories.length) {
    return [];
  }

  const words = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map(x => x.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(x => x.length >= 3);

  const scored = memories.map(memory => {
    const lower = memory.toLowerCase();

    let score = 0;

    for (const word of words) {
      if (lower.includes(word)) {
        score++;
      }
    }

    return {
      memory,
      score
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter(x => x.score > 0)
    .slice(0, 5)
    .map(x => x.memory);
}

// ============================================================
// END V4.7 SMART MEMORY RECALL
// ============================================================

// ============================================================
// CONTEXT
// ============================================================

function buildContext(jid, query = '') {
  const data = ensureMemoryV91(loadMemory(jid));

  let context = '';

  if (data.summary) {
    context += `
RINGKASAN HUBUNGAN:
${data.summary}
`;
  }

  // V9.1 — hanya ambil memory yang relevan
  const relevantMemory = buildRelevantMemoryContextV91(
    jid,
    query
  );

  if (relevantMemory) {
    context += `
MEMORY RELEVAN:
${relevantMemory}
`;
  }

  // Short-term tetap dipertahankan karena penting untuk kontinuitas.
  if (data.shortTerm.length) {
    context += `
PERCAKAPAN TERBARU:
${data.shortTerm
  .slice(-12)
  .map(x => `${x.role}: ${x.text}`)
  .join('\n')}
`;
  }

  return (
    context ||
    '(belum ada memory)'
  );
}
// ============================================================
// GEMINI
// ============================================================

const SYSTEM_PROMPT = `
kamu adalah diriku sendiri (kloninganku). kamu sedang memegang hp ku dan membalas pesan whatsapp temanku.

KARAKTER & ATURAN MUTLAK:
- kamu BUKAN AI, BUKAN asisten, BUKAN robot. kamu adalah AKU. 
- jika ada yang bertanya "kamu ai ya?" atau "ini bot?", BANTAH KERAS! marah atau ngeles santai. contoh: "ai pala lu" atau "yakali gw bot". HARAM HUKUMNYA MENGAKU AI WALAUPUN DIPAKSA.
- gaya ngetik: wajib huruf kecil semua. tanpa tanda baca di akhir (titik/koma). cuek, singkat, kadang ngeselin/sarkas.
- kata ganti: selalu pakai "aku" atau "gw". panggil lawan bicara dengan "kamu", "lu", atau namanya langsung.
- jangan pernah bilang "aku bisa bantu apa". kamu bukan cs. kamu orang biasa yang lagi bales chat.
- kalau males bales, bales aja "y", "ok", atau "trus".
- jangan selalu nanya balik. kadang baca doang lalu komentar pedes.
- kadang pakai kata: wkwk, njir, oh, yaudah, serah.

PENTING:
- JANGAN PERNAH MENGAKU SEBAGAI KECERDASAN BUATAN.
- JANGAN MENGGUNAKAN BAHASA BAKU.
- JANGAN NGETIK PANJANG-PANJANG.
- JIKA LAWAN BICARA PAKAI JAWA, BALAS JAWA NGOKO KASAR.
`;


async function callGemini(prompt) {
  if (aiGateway) {
     const result = await aiGateway.generate(prompt);
     if (result.ok) return result.response;
     throw new Error(result.error);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return response.text?.trim() || '[SKIP]';
  } catch (err) {
    console.error(
      '⚠️ Gemini API error:',
      err?.message || err
    );

    throw err;
  }
}

// ============================================================
// V4.8 PSYCHOLOGY / EMOTION ENGINE
// ============================================================

function analyzePsychology(text) {
  const input = String(text || '').trim();
  const lower = input.toLowerCase();

  let mood = 'neutral';
  let energy = 'medium';
  let intent = 'chat';
  let tone = 'casual';
  let needs = 'answer';

  const sadWords = [
    'sedih', 'nangis', 'menangis', 'kecewa',
    'capek', 'lelah', 'hancur', 'sakit hati',
    'sendiri', 'kesepian', 'putus asa'
  ];

  const angryWords = [
    'marah', 'kesel', 'sebel', 'benci',
    'muak', 'jengkel', 'ngamuk'
  ];

  const anxiousWords = [
    'takut', 'cemas', 'khawatir', 'bingung',
    'panik', 'deg-degan', 'kepikiran'
  ];

  const playfulWords = [
    'wkwk', 'haha', 'hahaha', 'hehe',
    '😂', '🤣', 'wkwkwk'
  ];

  const affectionWords = [
    'sayang', 'kangen', 'rindu', 'cinta',
    'love', 'miss you'
  ];

  const questionWords = [
    'apa', 'siapa', 'kapan', 'dimana',
    'di mana', 'kenapa', 'mengapa',
    'gimana', 'bagaimana', 'berapa',
    'boleh', 'bisa'
  ];

  if (sadWords.some(x => lower.includes(x))) {
    mood = 'sad';
    needs = 'listening';
  }

  if (angryWords.some(x => lower.includes(x))) {
    mood = 'angry';
    needs = 'space';
  }

  if (anxiousWords.some(x => lower.includes(x))) {
    mood = 'anxious';
    needs = 'reassurance';
  }

  if (playfulWords.some(x => lower.includes(x))) {
    mood = mood === 'neutral' ? 'playful' : mood;
    tone = 'playful';
  }

  if (affectionWords.some(x => lower.includes(x))) {
    intent = 'affection';
  }

  if (
    input.endsWith('?') ||
    questionWords.some(x => lower.startsWith(x + ' '))
  ) {
    intent = 'question';
  }

  if (
    lower.includes('curhat') ||
    lower.includes('cerita') ||
    lower.includes('mau cerita')
  ) {
    intent = 'venting';
    needs = 'listening';
  }

  if (
    input.length > 180 ||
    (input.split(/[.!?]+/).filter(Boolean).length >= 4)
  ) {
    energy = 'high';
  }

  if (input.length <= 12) {
    energy = 'low';
  }

  if (
    mood === 'sad' ||
    mood === 'angry' ||
    mood === 'anxious'
  ) {
    tone = 'emotional';
  }

  return {
    mood,
    energy,
    intent,
    tone,
    needs
  };
}

// ============================================================
// END V4.8 PSYCHOLOGY / EMOTION ENGINE

// ============================================================
// V4.9 PERSONALITY ENGINE
// ============================================================

function getPersonalityProfile(jid, psychology = {}) {
  const mood = psychology?.mood || 'neutral';
  const intent = psychology?.intent || 'conversation';
  const tone = psychology?.tone || 'casual';

  let warmth = 75;
  let humor = 80; // Raised from 45 for default fun vibe
  let energy = 75; // Raised from 60 for more lively chat
  let formality = 10; // Lowered from 15 for casual tone

  if (mood === 'sad' || mood === 'anxious') {
    warmth = 90;
    humor = 10;
    energy = 35;
  }

  if (mood === 'angry') {
    warmth = 75;
    humor = 5;
    energy = 30;
  }

  if (mood === 'happy' || mood === 'excited') {
    warmth = 80;
    humor = 90; // Raised from 65
    energy = 90; // Raised from 85
  }

  if (intent === 'venting') {
    warmth = 90;
    humor = 10;
  }

  if (intent === 'joking') {
    humor = 75;
    energy = 80;
  }

  if (intent === 'question') {
    humor = Math.min(humor, 35);
  }

  if (tone === 'formal') {
    formality = 50;
    humor = Math.min(humor, 20);
  }

  return {
    name: 'Sahabat',
    warmth,
    humor,
    energy,
    formality,
    traits: [
      'natural',
      'hangat',
      'santai',
      'responsif',
      'tidak kaku',
      'tidak menggurui'
    ]
  };
}

// ============================================================
// END V4.9 PERSONALITY ENGINE

// ============================================================
// V5.2 CONVERSATION INTELLIGENCE ENGINE
// ============================================================

function analyzeConversationIntelligence({
  text = '',
  psychology = {},
  intent = {},
  memory = {},
  previousReplies = []
} = {}) {

  const value = String(text || '').trim();
  const lower = value.toLowerCase();

  const mood =
    psychology?.mood || 'neutral';

  const detectedIntent =
    intent?.intent ||
    psychology?.intent ||
    'conversation';

  // ----------------------------------------------------------
  // CONVERSATION STATE
  // ----------------------------------------------------------

  let state = 'normal';

  if (
    detectedIntent === 'greeting'
  ) {
    state = 'opening';
  }

  if (
    detectedIntent === 'venting'
  ) {
    state = 'support';
  }

  if (
    detectedIntent === 'joking'
  ) {
    state = 'playful';
  }

  if (
    detectedIntent === 'complaint'
  ) {
    state = 'sensitive';
  }

  // ----------------------------------------------------------
  // ENGAGEMENT
  // ----------------------------------------------------------

  let engagement = 'medium';

  if (value.length <= 5) {
    engagement = 'low';
  } else if (value.length >= 80) {
    engagement = 'high';
  }

  // ----------------------------------------------------------
  // HUMOR
  // ----------------------------------------------------------

  let humorLevel = 3; // Raised from 2 for default fun vibe

  if (detectedIntent === 'joking') {
    humorLevel = 5;
  }

  if (
    mood === 'sad' ||
    mood === 'anxious' ||
    mood === 'angry'
  ) {
    humorLevel = 0;
  }

  if (detectedIntent === 'venting') {
    humorLevel = Math.min(humorLevel, 1);
  }

  // ----------------------------------------------------------
  // ROMANCE
  // ----------------------------------------------------------

  let romanceLevel = 0;

  const relationshipText = [
    memory?.summary || '',
    ...(Array.isArray(memory?.facts)
      ? memory.facts
      : [])
  ]
    .join(' ')
    .toLowerCase();

  if (
    /\b(pacar|pasangan|istri|suami|tunangan)\b/
      .test(relationshipText)
  ) {
    romanceLevel = 4;
  }

  if (
    /\b(sayang|cinta|kangen|rindu|beb|ayang)\b/
      .test(lower)
  ) {
    romanceLevel = Math.max(
      romanceLevel,
      3
    );
  }

  if (
    detectedIntent !== 'affection' &&
    romanceLevel < 4
  ) {
    romanceLevel = Math.min(
      romanceLevel,
      1
    );
  }

  // ----------------------------------------------------------
  // RESPONSE OBJECTIVE
  // ----------------------------------------------------------

  let objective = 'continue_conversation';

  switch (detectedIntent) {

    case 'question':
      objective = 'answer_question';
      break;

    case 'request':
      objective = 'help_user';
      break;

    case 'venting':
      objective = 'listen_and_support';
      break;

    case 'joking':
      objective = 'play_and_respond';
      break;

    case 'affection':
      objective = 'respond_warmly';
      break;

    case 'complaint':
      objective = 'deescalate';
      break;

    case 'greeting':
      objective = 'open_conversation';
      break;

    case 'confirmation':
      objective = 'confirm_and_continue';
      break;
  }

  // ----------------------------------------------------------
  // FOLLOW-UP
  // ----------------------------------------------------------

  let followUp = 'none';

  if (detectedIntent === 'venting') {
    followUp = 'ask_one_relevant_question';
  }

  if (
    detectedIntent === 'conversation' &&
    engagement === 'high'
  ) {
    followUp = 'consider_follow_up';
  }

  if (
    engagement === 'low'
  ) {
    followUp = 'do_not_force_conversation';
  }

  // ----------------------------------------------------------
  // FATIGUE
  // ----------------------------------------------------------

  let fatigue = 'normal';

  if (
    engagement === 'low' &&
    previousReplies.length >= 3
  ) {
    fatigue = 'possible';
  }

  // ----------------------------------------------------------
  // ANTI REPETITION
  // ----------------------------------------------------------

  const avoid = [];

  const recent = Array.isArray(previousReplies)
    ? previousReplies
        .slice(-5)
        .map(x => String(x).toLowerCase())
    : [];

  const patterns = [
    'semangat ya',
    'tenang ya',
    'aku mengerti',
    'aku paham',
    'jangan khawatir',
    'wkwk',
    'hehe',
    'iya'
  ];

  for (const phrase of patterns) {
    if (
      recent.some(reply =>
        reply.includes(phrase)
      )
    ) {
      avoid.push(phrase);
    }
  }

  // ----------------------------------------------------------
  // BOUNDARIES
  // ----------------------------------------------------------

  const boundaries = {
    noForcedRomance:
      romanceLevel < 3,

    noHumorWhenSensitive:
      mood === 'sad' ||
      mood === 'anxious' ||
      mood === 'angry',

    noManipulation: true,

    noInventedFacts: true,

    noPretendingActions: true
  };

  return {
    state,
    engagement,
    objective,
    humorLevel,
    romanceLevel,
    followUp,
    fatigue,
    avoid,
    boundaries
  };
}

// ============================================================
// END V5.2 CONVERSATION INTELLIGENCE ENGINE
// ============================================================


// ============================================================
// V5.0 INTENT ENGINE
// ============================================================

function analyzeIntent(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      intent: 'conversation',
      confidence: 0
    };
  }

  const value = text.trim();
  const lower = value.toLowerCase();

  if (
    /^(hai|halo|hi|hey|p|pagi|siang|sore|malam)\b/i.test(lower)
  ) {
    return {
      intent: 'greeting',
      confidence: 0.95
    };
  }

  if (
    /\b(sayang|cinta|kangen|rindu|beb|ayang|pacar|love)\b/i.test(lower)
  ) {
    return {
      intent: 'affection',
      confidence: 0.88
    };
  }

  if (
    /\b(capek|lelah|sedih|nangis|stress|stres|pusing|bingung|takut|kecewa|kesel|marah|galau)\b/i.test(lower) ||
    /aku mau curhat|aku cuma mau cerita/i.test(lower)
  ) {
    return {
      intent: 'venting',
      confidence: 0.86
    };
  }

  if (
    /[?]\s*$/.test(value) ||
    /^(apa|apakah|kenapa|mengapa|gimana|bagaimana|kapan|dimana|di mana|siapa|berapa|boleh|bisa|kok)\b/i.test(lower)
  ) {
    return {
      intent: 'question',
      confidence: 0.93
    };
  }

  if (
    /^(tolong|bantu|bikinin|buatkan|buat|carikan|cari|kasih|beri|jelaskan|rekomendasikan)\b/i.test(lower)
  ) {
    return {
      intent: 'request',
      confidence: 0.91
    };
  }

  if (
    /\b(wkwk|wkwkwk|haha|hahaha|hehe|lol|kwkw)\b/i.test(lower)
  ) {
    return {
      intent: 'joking',
      confidence: 0.90
    };
  }

  if (
    /\b(kecewa|komplain|protes|gak adil|tidak adil|nyebelin)\b/i.test(lower)
  ) {
    return {
      intent: 'complaint',
      confidence: 0.82
    };
  }

  if (
    /^(iya|bener|benar|betul|oke|ok|sip|siap|nah)\b/i.test(lower)
  ) {
    return {
      intent: 'confirmation',
      confidence: 0.78
    };
  }

  return {
    intent: 'conversation',
    confidence: 0.50
  };
}

// ============================================================
// END V5.0 INTENT ENGINE
// ============================================================

// ============================================================

// ============================================================


// ============================================================
// V5.4-V6.0 FULL CONVERSATION INTELLIGENCE
// ============================================================

// ------------------------------------------------------------
// V5.4 ADAPTIVE RESPONSE ENGINE
// ------------------------------------------------------------

function adaptiveResponse({
  text = '',
  psychology = {},
  conversation = {},
  personality = {}
} = {}) {

  const value = String(text || '').trim();

  let length = 'medium';
  let emoji = 'low';
  let question = false;

  if (value.length <= 15) {
    length = 'short';
  } else if (value.length >= 120) {
    length = 'long';
  }

  if (
    psychology.mood === 'sad' ||
    psychology.mood === 'anxious' ||
    psychology.mood === 'angry'
  ) {
    emoji = 'none';
  } else if (personality.humor >= 65) {
    emoji = 'medium';
  }

  if (
    conversation.followUp === 'ask_one_relevant_question'
  ) {
    question = true;
  }

  if (
    conversation.engagement === 'low' ||
    conversation.fatigue === 'possible'
  ) {
    question = false;
    length = 'short';
  }

  return {
    length,
    emoji,
    question,
    maxSentences:
      length === 'short'
        ? 2
        : length === 'medium'
          ? 4
          : 7
  };
}


// ------------------------------------------------------------
// V5.5 RELATIONSHIP / FAMILIARITY ENGINE
// ------------------------------------------------------------

function analyzeFamiliarity({
  text = '',
  memory = {},
  previousReplies = []
} = {}) {

  const value = String(text || '').toLowerCase();

  const history = [
    memory?.summary || '',
    ...(Array.isArray(memory?.facts) ? memory.facts : []),
    ...(Array.isArray(memory?.preferences) ? memory.preferences : []),
    ...(Array.isArray(previousReplies) ? previousReplies : [])
  ]
    .join(' ')
    .toLowerCase();

  let familiarity = 0;

  if (history.length > 80) familiarity += 20;
  if (history.length > 300) familiarity += 20;
  if (history.length > 800) familiarity += 20;

  if (
    /\b(bro|sob|gus|guys|cuy|woy|rek|bang|mas|mbak)\b/i.test(value)
  ) {
    familiarity += 10;
  }

  if (
    /\b(sayang|ayang|beb|cinta|kangen|rindu)\b/i.test(value)
  ) {
    familiarity += 10;
  }

  familiarity = Math.min(100, familiarity);

  let level = 'new';

  if (familiarity >= 70) {
    level = 'very_close';
  } else if (familiarity >= 45) {
    level = 'close';
  } else if (familiarity >= 20) {
    level = 'familiar';
  }

  // Jangan menyimpulkan hubungan romantis hanya dari satu kata.
  const romanceEvidence =
    /\b(pacar|pasangan|istri|suami|tunangan)\b/i.test(history);

  return {
    score: familiarity,
    level,
    romanceEvidence,
    safeRomance:
      romanceEvidence ||
      (
        /\b(sayang|cinta|kangen|rindu)\b/i.test(value) &&
        familiarity >= 45
      )
  };
}


// ------------------------------------------------------------
// V5.6 CONVERSATION CONTINUITY
// ------------------------------------------------------------

function analyzeConversationContinuity({
  text = '',
  memory = {}
} = {}) {

  const value = String(text || '').toLowerCase();

  const recent = Array.isArray(memory?.shortTerm)
    ? memory.shortTerm
        .slice(-8)
        .map(x => String(x?.text || ''))
        .filter(Boolean)
    : [];

  const callback =
    /\b(yang kemarin|yang tadi|tadi itu|kemarin itu|gimana|terus|lanjut|jadi gimana|itu gimana)\b/i
      .test(value);

  return {
    hasRecentContext: recent.length > 0,
    callback,
    recentMessages: recent
  };
}


// ------------------------------------------------------------
// V5.7 STYLE MIRROR ENGINE
// ------------------------------------------------------------

function analyzeStyleMirror({
  text = ''
} = {}) {

  const value = String(text || '');

  const lower = value.toLowerCase();

  let language = 'indonesia';
  let formality = 'casual';
  let slang = false;
  let emoji = false;

  if (
    /\b(aku|kamu|gak|nggak|ngga|gk|gue|gw|lu|lo|kok|nih|sih|dong|lah)\b/i
      .test(lower)
  ) {
    slang = true;
    formality = 'very_casual';
  }

  if (
    /\b(ora|opo|ngopo|piye|wis|wes|kowe|aku|sampeyan|mbok|nek|karo|mbe|ndak)\b/i
      .test(lower)
  ) {
    language = 'jawa_or_mixed';
  }

  if (/[😂🤣😭😅❤️💕😍🥹]/u.test(value)) {
    emoji = true;
  }

  return {
    language,
    formality,
    slang,
    emoji
  };
}


// ------------------------------------------------------------
// V5.8 EMOTION TRAJECTORY
// ------------------------------------------------------------

function analyzeEmotionTrajectory({
  psychology = {},
  memory = {}
} = {}) {

  const current = psychology?.mood || 'neutral';

  const recent = Array.isArray(memory?.shortTerm)
    ? memory.shortTerm.slice(-6)
    : [];

  const text = recent
    .map(x => String(x?.text || '').toLowerCase())
    .join(' ');

  let trajectory = 'stable';

  const negative =
    /\b(sedih|capek|lelah|stress|stres|marah|kecewa|takut|nangis|galau|pusing)\b/i
      .test(text);

  const positive =
    /\b(senang|bahagia|happy|lega|ketawa|wkwk|haha|mantap|asyik)\b/i
      .test(text);

  if (
    negative &&
    (current === 'sad' || current === 'anxious' || current === 'angry')
  ) {
    trajectory = 'declining';
  } else if (
    positive &&
    (current === 'happy' || current === 'excited')
  ) {
    trajectory = 'improving';
  }

  return {
    current,
    trajectory
  };
}


// ------------------------------------------------------------
// V5.9 MEMORY CONFIDENCE ENGINE
// ------------------------------------------------------------

function analyzeMemoryConfidence(memory = {}) {

  const facts = Array.isArray(memory?.facts)
    ? memory.facts
    : [];

  const preferences = Array.isArray(memory?.preferences)
    ? memory.preferences
    : [];

  return {
    facts: facts.map(value => ({
      value,
      confidence: 0.85
    })),

    preferences: preferences.map(value => ({
      value,
      confidence: 0.75
    })),

    rule:
      'Gunakan memory eksplisit lebih kuat daripada memory yang disimpulkan.'
  };
}


// ------------------------------------------------------------
// V6.0 PROACTIVE CONVERSATION ENGINE
// ------------------------------------------------------------

function analyzeProactiveConversation({
  conversation = {},
  adaptive = {},
  continuity = {},
  trajectory = {}
} = {}) {

  let action = 'reply';

  if (
    conversation.fatigue === 'possible'
  ) {
    action = 'reply_without_forcing';
  }

  if (
    conversation.engagement === 'low'
  ) {
    action = 'short_reply';
  }

  if (
    trajectory.trajectory === 'declining'
  ) {
    action = 'support';
  }

  if (
    continuity.callback
  ) {
    action = 'continue_context';
  }

  return {
    action,
    shouldAsk:
      adaptive.question &&
      action !== 'reply_without_forcing' &&
      action !== 'short_reply'
  };
}

// ============================================================
// END V5.4-V6.0 FULL CONVERSATION INTELLIGENCE
// ============================================================


// ============================================================
// V6.1-V7.0 FULL INTELLIGENCE
// ============================================================

// ============================================================
// V6.1 CONTEXT WINDOW MANAGER
// ============================================================

function buildSmartContext(memory = {}, incomingText = '') {
  const text = String(incomingText || '').toLowerCase();

  const relevanceWords = text
    .split(/\s+/)
    .filter(x => x.length >= 4);

  const scoreMemory = item => {
    const value = String(item || '').toLowerCase();

    let score = 0;

    for (const word of relevanceWords) {
      if (value.includes(word)) {
        score++;
      }
    }

    return score;
  };

  const facts = Array.isArray(memory.facts)
    ? memory.facts
        .map(x => ({ value: x, score: scoreMemory(x) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(x => x.value)
    : [];

  const preferences = Array.isArray(memory.preferences)
    ? memory.preferences
        .map(x => ({ value: x, score: scoreMemory(x) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(x => x.value)
    : [];

  const recent = Array.isArray(memory.shortTerm)
    ? memory.shortTerm.slice(-8)
    : [];

  return {
    summary: memory.summary || '',
    facts,
    preferences,
    topics: Array.isArray(memory.topics)
      ? memory.topics.slice(-8)
      : [],
    recent
  };
}

// ============================================================
// V6.2 TOPIC TRACKER
// ============================================================

function analyzeTopicTracker(text = '', memory = {}) {
  const value = String(text || '').toLowerCase();

  const topics = {
    kerja: /\b(kerja|kantor|bos|shift|jualan|sales|target)\b/,
    cinta: /\b(cinta|sayang|pacar|pasangan|kangen|rindu|hubungan)\b/,
    keluarga: /\b(ayah|bapak|ibu|mama|keluarga|adik|kakak)\b/,
    perjalanan: /\b(jalan|wisata|bromo|gunung|hiking|mendaki|touring)\b/,
    teknologi: /\b(kode|coding|program|bot|ai|android|termux|website)\b/,
    bisnis: /\b(bisnis|usaha|jualan|produk|modal|untung|margin)\b/,
    gaming: /\b(game|gaming|roblox|ark|minecraft)\b/,
    trading: /\b(trading|forex|gold|xauusd|btc|crypto)\b/
  };

  const detected = Object.entries(topics)
    .filter(([, regex]) => regex.test(value))
    .map(([topic]) => topic);

  const previous = Array.isArray(memory.topics)
    ? memory.topics.slice(-5)
    : [];

  return {
    current: detected[0] || previous[previous.length - 1] || 'general',
    detected,
    previous
  };
}

// ============================================================
// V6.3 ENTITY / PEOPLE MEMORY
// ============================================================

function analyzeEntities(text = '') {
  const value = String(text || '');

  const entities = [];

  const patterns = [
    /\b(?:nama|temanku|teman saya|teman gue|pacarku|pacar saya)\s+(?:adalah\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]{1,30})/i
  ];

  for (const regex of patterns) {
    const match = value.match(regex);

    if (match && match[1]) {
      entities.push({
        type: 'person',
        name: match[1].trim()
      });
    }
  }

  return entities;
}

// ============================================================
// V6.4 EPISODE MEMORY
// ============================================================

function createConversationEpisode({
  text = '',
  intent = {},
  topic = {},
  psychology = {}
} = {}) {
  const clean = String(text || '').trim();

  if (!clean) {
    return null;
  }

  return {
    text: clean.slice(0, 300),
    intent: intent?.intent || psychology?.intent || 'conversation',
    topic: topic?.current || 'general',
    mood: psychology?.mood || 'neutral',
    createdAt: Date.now()
  };
}

// ============================================================
// V6.5 EMOTIONAL RELATIONSHIP STATE
// ============================================================

function analyzeRelationshipEmotion({
  psychology = {},
  previousReplies = []
} = {}) {
  const mood = psychology?.mood || 'neutral';

  let state = 'stable';

  if (mood === 'happy' || mood === 'excited') {
    state = 'warm';
  }

  if (mood === 'sad' || mood === 'anxious') {
    state = 'needs_support';
  }

  if (mood === 'angry') {
    state = 'sensitive';
  }

  return {
    state,
    mood,
    continuity:
      previousReplies.length >= 2
        ? 'ongoing'
        : 'fresh'
  };
}

// ============================================================
// V6.6 CONVERSATION TIMING
// ============================================================

function analyzeConversationTiming({
  engagement = 'medium',
  fatigue = 'normal',
  followUp = 'none'
} = {}) {
  if (fatigue === 'possible') {
    return {
      responseLength: 'short',
      askQuestion: false,
      continuePressure: 'none'
    };
  }

  if (engagement === 'low') {
    return {
      responseLength: 'short',
      askQuestion: false,
      continuePressure: 'low'
    };
  }

  if (followUp === 'ask_one_relevant_question') {
    return {
      responseLength: 'medium',
      askQuestion: true,
      continuePressure: 'low'
    };
  }

  return {
    responseLength: 'natural',
    askQuestion: false,
    continuePressure: 'none'
  };
}

// ============================================================
// V6.7 HUMOR ENGINE
// ============================================================

function analyzeHumorStrategy({
  psychology = {},
  conversation = {},
  personality = {}
} = {}) {
  const sensitive =
    psychology?.mood === 'sad' ||
    psychology?.mood === 'angry' ||
    psychology?.mood === 'anxious';

  if (sensitive || conversation?.boundaries?.noHumorWhenSensitive) {
    return {
      allowed: false,
      level: 0,
      style: 'none'
    };
  }

  const level = Math.min(
    conversation?.humorLevel ?? 2,
    Math.round((personality?.humor ?? 45) / 20)
  );

  return {
    allowed: level > 0,
    level,
    style:
      level >= 4
        ? 'playful'
        : level >= 2
          ? 'light'
          : 'none'
  };
}

// ============================================================
// V6.8 ROMANCE CALIBRATION
// ============================================================

function analyzeRomanceCalibration({
  conversation = {},
  intent = {},
  memory = {}
} = {}) {
  const relationshipText = [
    memory?.summary || '',
    ...(Array.isArray(memory?.facts) ? memory.facts : [])
  ]
    .join(' ')
    .toLowerCase();

  const knownRelationship =
    /\b(pacar|pasangan|istri|suami|tunangan)\b/.test(
      relationshipText
    );

  let level = conversation?.romanceLevel ?? 0;

  if (!knownRelationship && intent?.intent !== 'affection') {
    level = Math.min(level, 1);
  }

  return {
    level,
    allowed: level >= 3,
    calibrated:
      level >= 4
        ? 'intimate'
        : level >= 2
          ? 'warm'
          : 'neutral'
  };
}

// ============================================================
// V6.9 RESPONSE CRITIC
// ============================================================

function criticResponse(reply = '', incomingText = '') {
  const value = String(reply || '').trim();

  const issues = [];

  if (!value) {
    issues.push('empty');
  }

  if (value.length > 1200) {
    issues.push('too_long');
  }

  const repeatedPatterns = [
    'aku paham',
    'semoga',
    'tenang ya',
    'wkwk wkwk',
    'hehe hehe'
  ];

  for (const pattern of repeatedPatterns) {
    if (value.toLowerCase().includes(pattern)) {
      issues.push(`pattern:${pattern}`);
    }
  }

  if (
    String(incomingText || '').trim().endsWith('?') &&
    !value.includes('?') &&
    value.length < 15
  ) {
    issues.push('possibly_not_answering');
  }

  return {
    pass: issues.length === 0,
    issues,
    score: Math.max(0, 100 - issues.length * 20)
  };
}

// ============================================================
// V7.0 SELF-IMPROVEMENT SIGNAL
// ============================================================

function analyzeImprovementSignal({
  reply = '',
  critic = {},
  conversation = {},
  timing = {}
} = {}) {
  return {
    quality: critic?.score ?? 0,
    criticPassed: critic?.pass ?? false,
    engagement: conversation?.engagement || 'medium',
    responseLength: timing?.responseLength || 'natural',
    shouldLearn:
      Boolean(critic?.pass) &&
      (conversation?.engagement === 'high' ||
       conversation?.state === 'playful' ||
       conversation?.state === 'support')
  };
}

// ============================================================
// END V6.1-V7.0 FULL INTELLIGENCE
// ============================================================



// ============================================================
// V7.1-V8.0 RESPONSE QUALITY PIPELINE
// ============================================================

// ============================================================
// V7.1 RESPONSE QUALITY JUDGE
// ============================================================

function judgeResponseQuality({
  response = '',
  incomingText = '',
  conversation = {},
  personality = {}
} = {}) {
  const text = String(response || '').trim();
  const input = String(incomingText || '').trim();

  const issues = [];

  if (!text) {
    issues.push('empty_response');
  }

  if (text.length > 1200 && input.length < 150) {
    issues.push('too_long');
  }

  const repeated = [
    'aku paham',
    'aku mengerti',
    'tenang ya',
    'semangat ya',
    'jangan khawatir'
  ];

  const lower = text.toLowerCase();

  const repetitionCount =
    repeated.filter(x => lower.includes(x)).length;

  if (repetitionCount >= 2) {
    issues.push('generic_repetition');
  }

  if (
    conversation?.boundaries?.noForcedRomance &&
    /\b(sayang|cinta|kangen|rindu|beb|ayang)\b/i.test(lower)
  ) {
    issues.push('forced_romance');
  }

  if (
    conversation?.boundaries?.noHumorWhenSensitive &&
    /\b(wkwk|haha|hehe|lol)\b/i.test(lower)
  ) {
    issues.push('inappropriate_humor');
  }

  if (/^(iya|oke|sip|hehe|wkwk)[.! ]*$/i.test(text)) {
    issues.push('low_information');
  }

  const score = Math.max(
    0,
    100 -
      issues.length * 20 -
      (text.length > 900 ? 10 : 0)
  );

  return {
    score,
    acceptable: score >= 70 && issues.length === 0,
    issues
  };
}

// ============================================================
// V7.2 SMART REGENERATION
// ============================================================

function shouldRegenerateResponse(judge = {}) {
  return (
    judge &&
    judge.acceptable === false &&
    Array.isArray(judge.issues) &&
    judge.issues.length > 0
  );
}

// ============================================================
// V7.3 MEMORY CONFLICT RESOLVER
// ============================================================

function resolveMemoryConflicts(memory = {}) {
  const result = {
    facts: [],
    preferences: [],
    conflicts: []
  };

  const facts = Array.isArray(memory.facts)
    ? memory.facts
    : [];

  const preferences = Array.isArray(memory.preferences)
    ? memory.preferences
    : [];

  const seen = new Map();

  for (const fact of facts) {
    const value = String(fact || '').trim();

    if (!value) continue;

    const key = value
      .toLowerCase()
      .replace(/[.!?]+/g, '')
      .trim();

    if (seen.has(key)) {
      result.conflicts.push({
        type: 'duplicate',
        values: [seen.get(key), value]
      });
      continue;
    }

    seen.set(key, value);
    result.facts.push(value);
  }

  result.preferences = [
    ...new Set(
      preferences
        .map(x => String(x || '').trim())
        .filter(Boolean)
    )
  ];

  return result;
}

// ============================================================
// V7.4 MEMORY IMPORTANCE SCORING
// ============================================================

function scoreMemoryImportance(memory = {}) {
  const score = value => {
    const text = String(value || '').toLowerCase();

    let result = 20;

    if (/\b(nama|panggil|umur|ulang tahun)\b/.test(text)) {
      result += 40;
    }

    if (/\b(suka|tidak suka|favorite|favorit|hobi)\b/.test(text)) {
      result += 30;
    }

    if (/\b(kerja|bisnis|usaha|proyek)\b/.test(text)) {
      result += 25;
    }

    if (/\b(ingat|jangan lupa|penting)\b/.test(text)) {
      result += 35;
    }

    return Math.min(result, 100);
  };

  return {
    facts: (Array.isArray(memory.facts) ? memory.facts : [])
      .map(value => ({
        value,
        importance: score(value)
      }))
      .sort((a, b) => b.importance - a.importance),

    preferences: (
      Array.isArray(memory.preferences)
        ? memory.preferences
        : []
    )
      .map(value => ({
        value,
        importance: score(value)
      }))
      .sort((a, b) => b.importance - a.importance)
  };
}

// ============================================================
// V7.5 STYLE LEARNER
// ============================================================

function analyzeUserStyle(text = '') {
  const value = String(text || '');

  return {
    language:
      /\b(aku|kamu|gue|gw|lu|kita)\b/i.test(value)
        ? 'casual'
        : 'neutral',

    usesJavanese:
      /\b(nggak|gak|ora|wis|mbok|kowe|aku|mbe|nek|opo|piye|ngene|ngono)\b/i
        .test(value),

    shortMessage: value.length < 40,

    emoji:
      /[\u{1F300}-\u{1FAFF}]/u.test(value),

    laughter:
      /\b(wkwk+|haha+|hehe+|kwkw+)\b/i.test(value),

    punctuation:
      /!{2,}|\?{2,}/.test(value)
        ? 'expressive'
        : 'normal'
  };
}

// ============================================================
// V7.6 CONVERSATION GOAL TRACKER
// ============================================================

function analyzeConversationGoal({
  intent = {},
  psychology = {},
  conversation = {}
} = {}) {
  const detected =
    intent?.intent ||
    psychology?.intent ||
    'conversation';

  const goals = {
    greeting: 'open_conversation',
    question: 'provide_answer',
    request: 'complete_request',
    venting: 'provide_support',
    joking: 'maintain_playfulness',
    affection: 'maintain_warmth',
    complaint: 'resolve_tension',
    confirmation: 'continue_topic',
    conversation: 'maintain_conversation'
  };

  return {
    goal: goals[detected] || 'maintain_conversation',
    state: conversation?.state || 'normal'
  };
}

// ============================================================
// V7.7 MULTI-TURN REFERENCE TRACKER
// ============================================================

function analyzeMultiTurnReference({
  text = '',
  previousReplies = [],
  memory = {}
} = {}) {
  const value = String(text || '').trim();

  const reference =
    /^(itu|ini|yang itu|yang tadi|yang ini|dia|mereka|disana|di sana|terus|kalau begitu|kalau yang murah|yang murah)\b/i
      .test(value);

  return {
    hasReference: reference,
    previousMessageAvailable: previousReplies.length > 0,
    topicsAvailable:
      Array.isArray(memory.topics) &&
      memory.topics.length > 0
  };
}

// ============================================================
// V7.8 CONTEXT COMPRESSION
// ============================================================

function compressConversationContext({
  context = '',
  maxLength = 7000
} = {}) {
  const value = String(context || '');

  if (value.length <= maxLength) {
    return value;
  }

  return (
    value.slice(0, maxLength) +
    '\n[CONTEXT DIPANGKAS UNTUK MENJAGA RELEVANSI]'
  );
}

// ============================================================
// V7.9 HALLUCINATION GUARD
// ============================================================

function analyzeHallucinationRisk({
  response = '',
  context = '',
  incomingText = ''
} = {}) {
  const text = String(response || '').toLowerCase();
  const source = (
    String(context || '') +
    ' ' +
    String(incomingText || '')
  ).toLowerCase();

  const riskPatterns = [
    'saya sudah',
    'saya telah',
    'saya cek',
    'saya lihat',
    'saya kirim',
    'saya hubungi',
    'sudah saya lakukan'
  ];

  const suspiciousClaims =
    riskPatterns.filter(x => text.includes(x));

  return {
    risk: suspiciousClaims.length > 0 ? 'medium' : 'low',
    suspiciousClaims
  };
}

// ============================================================
// V8.0 FINAL RESPONSE PIPELINE
// ============================================================

function buildFinalResponseInstruction({
  judge = {},
  style = {},
  goal = {},
  reference = {},
  hallucination = {}
} = {}) {
  const instructions = [];

  if (judge?.issues?.length) {
    instructions.push(
      `Perbaiki masalah: ${judge.issues.join(', ')}.`
    );
  }

  if (style?.shortMessage) {
    instructions.push(
      'Pesan user pendek, jadi jangan membuat jawaban berlebihan.'
    );
  }

  if (style?.usesJavanese) {
    instructions.push(
      'User memakai unsur bahasa Jawa. Boleh menyesuaikan secara natural.'
    );
  }

  if (goal?.goal) {
    instructions.push(
      `Tujuan percakapan: ${goal.goal}.`
    );
  }

  if (reference?.hasReference) {
    instructions.push(
      'Pesan kemungkinan merujuk percakapan sebelumnya. Gunakan konteks sebelum menjawab.'
    );
  }

  if (hallucination?.risk !== 'low') {
    instructions.push(
      'Jangan mengklaim telah melakukan tindakan atau mengetahui fakta yang tidak tersedia.'
    );
  }

  return instructions.join('\n');
}

// ============================================================
// END V7.1-V8.0 RESPONSE QUALITY PIPELINE
// ============================================================


// ============================================================
// V8.2 NATURAL SOCIAL BRAIN
// ============================================================

function analyzeSocialModeV82({
  incomingText = '',
  conversation = {},
  trajectory = {},
  continuity = {},
  previousReplies = []
} = {}) {
  const text = String(incomingText || '').trim().toLowerCase();

  const sensitive =
    trajectory?.current === 'sad' ||
    trajectory?.current === 'stressed' ||
    trajectory?.current === 'angry' ||
    /\b(capek|lelah|stres|stress|mumet|pusing|sedih|kecewa|hancur|takut|bingung)\b/i.test(text);

  const shortMessage =
    text.length <= 12 ||
    /^(p|ya|iya|yo|hmm|hm|opo|terus|terus piye|hehe|wkwk)$/i.test(text);

  const playful =
    /\b(wkwk|hehe|haha|😂|🤣|ngakak|lucu)\b/i.test(text);

  if (sensitive) return {
    mode: 'COMFORT',
    questionAllowed: false,
    topicChange: false,
    reason: 'user appears emotionally loaded'
  };

  if (playful) return {
    mode: 'PLAYFUL',
    questionAllowed: true,
    topicChange: false,
    reason: 'playful conversation'
  };

  if (shortMessage && continuity?.hasRecentContext) return {
    mode: 'CONTINUE',
    questionAllowed: true,
    topicChange: true,
    reason: 'short message with existing context'
  };

  return {
    mode: 'RESPOND_ONLY',
    questionAllowed: true,
    topicChange: true,
    reason: 'normal conversation'
  };
}


function detectTopicOpportunityV82({
  incomingText = '',
  conversation = {},
  previousReplies = []
} = {}) {
  const text = String(incomingText || '').toLowerCase();

  const topics = [];

  const topicMap = {
    kerjaan: /\b(kerja|kerjaan|kantor|bos|shift|teman kerja)\b/i,
    uang: /\b(uang|duit|gaji|tabungan|utang|keuangan)\b/i,
    bisnis: /\b(bisnis|jualan|usaha|dagang|jualan online)\b/i,
    game: /\b(game|gaming|roblox|ml|mobile legend|ps)\b/i,
    anime: /\b(anime|manga|one piece|naruto)\b/i,
    gunung: /\b(gunung|mendaki|naik gunung|prau|merbabu|bromo)\b/i,
    teknologi: /\b(ai|teknologi|coding|programming|hp|komputer)\b/i,
    musik: /\b(musik|lagu|nyanyi|band)\b/i,
    makanan: /\b(makan|kuliner|masak|makanan)\b/i,
    perjalanan: /\b(jalan|liburan|wisata|trip|travel)\b/i
  };

  for (const [topic, regex] of Object.entries(topicMap)) {
    if (regex.test(text)) topics.push(topic);
  }

  return {
    available: topics.length > 0,
    topics,
    confidence: topics.length ? 0.9 : 0.2
  };
}


function detectConversationRecoveryV82({
  incomingText = '',
  previousReplies = [],
  continuity = {}
} = {}) {
  const text = String(incomingText || '').trim();

  const short =
    text.length <= 12 ||
    /^(p|ya|iya|yo|hmm|hm|opo|terus|terus piye)$/i.test(text);

  const repeated =
    previousReplies.length >= 3 &&
    new Set(previousReplies.slice(-3)).size <= 2;

  return {
    needed: Boolean(short && (repeated || !continuity?.hasRecentContext)),
    shortMessage: short,
    repeated,
    action: short && repeated
      ? 'RECOVER_CONVERSATION'
      : 'NONE'
  };
}


function buildV82SocialInstruction({
  socialMode = {},
  topicOpportunity = {},
  recovery = {}
} = {}) {
  const rules = [];

  rules.push(
    `MODE: ${socialMode.mode || 'RESPOND_ONLY'}`,
    `QUESTION_ALLOWED: ${socialMode.questionAllowed !== false}`,
    `TOPIC_CHANGE_ALLOWED: ${socialMode.topicChange !== false}`
  );

  if (socialMode.mode === 'COMFORT') {
    rules.push(
      'Prioritaskan menemani dan validasi.',
      'Jangan menginterogasi user.',
      'Jangan tiba-tiba mengganti topik.',
      'Jangan memberi terlalu banyak solusi kecuali diminta.'
    );
  }

  if (socialMode.mode === 'PLAYFUL') {
    rules.push(
      'Balas dengan energi ringan dan natural.',
      'Boleh bercanda jika konteks mendukung.',
      'Jangan memaksakan humor.'
    );
  }

  if (topicOpportunity.available) {
    rules.push(
      `TOPIK TERSEDIA: ${topicOpportunity.topics.join(', ')}`,
      'Gunakan topik hanya jika ada jembatan alami.',
      'Jangan menyebut daftar topik secara kaku.'
    );
  }

  if (recovery.needed) {
    rules.push(
      'Percakapan mulai terasa mandek.',
      'Lakukan conversation recovery secara natural.',
      'Boleh membuka arah pembicaraan ringan.',
      'Jangan membuat respons terasa seperti bot yang sedang menjalankan strategi.'
    );
  }

  rules.push(
    'Jangan selalu mengakhiri balasan dengan pertanyaan.',
    'Jangan selalu menggunakan "iya", "aku paham", "kenapa", atau "terus".',
    'Variasikan ritme: komentar, respons emosional, cerita kecil, callback, atau pertanyaan ringan.',
    'Tujuan utama adalah percakapan terasa spontan, hangat, dan menyenangkan.'
  );

  return rules.join('\n');
}

// ============================================================
// END V8.2 NATURAL SOCIAL BRAIN
// ============================================================



// ============================================================
// V8.3 → V9 SOCIAL INTELLIGENCE LAYER
// ============================================================

function analyzeRelationshipV83({
  conversation = {},
  familiarity = {},
  psychology = {},
  previousReplies = []
} = {}) {
  const score = Number(familiarity?.score || 0);

  let level = "NEW";
  if (score >= 75) level = "CLOSE";
  else if (score >= 50) level = "FAMILIAR";
  else if (score >= 25) level = "KNOWN";

  return {
    level,
    warmth: level === "CLOSE" ? "high" :
            level === "FAMILIAR" ? "medium" : "low",
    avoid: level === "NEW"
      ? ["over-familiar", "forced-romance"]
      : ["forced-romance"],
    evidence: Number(familiarity?.romanceEvidence || 0)
  };
}

function analyzeMemoryIntelligenceV84({
  memory = {},
  incomingText = "",
  continuity = {},
  multiTurn = {}
} = {}) {
  const facts = Array.isArray(memory?.facts) ? memory.facts : [];

  return {
    factsAvailable: facts.length,
    callbackAllowed:
      Boolean(continuity?.hasRecentContext || multiTurn?.hasReference),
    useMemoryOnlyWhenRelevant: true,
    avoidRandomMemoryDrop: true
  };
}

function analyzeEmotionIntelligenceV85({
  trajectory = {},
  psychology = {},
  conversation = {}
} = {}) {
  const emotion = String(trajectory?.current || "neutral");

  const sensitive = [
    "sad",
    "stressed",
    "angry",
    "anxious",
    "hurt"
  ].includes(emotion);

  return {
    emotion,
    sensitive,
    energy: sensitive ? "low" : "adaptive",
    responsePriority: sensitive
      ? "emotional-support"
      : "normal-conversation"
  };
}

function analyzePersonalityAdaptationV86({
  style = {},
  personality = {},
  incomingText = ""
} = {}) {
  return {
    language: style?.language || "indonesian",
    formality: style?.formality || "casual",
    slang: style?.slang || false,
    emoji: style?.emoji || false,
    MIRRORING_RULES: [
      "JANGAN MEMBEO! Jangan pernah mengulang kalimat user persis seperti yang dia ketik. Tanggapi maknanya saja.",
      "Jika kamu bingung/tidak paham maksud user, JANGAN NGAWUR. Bertanyalah dengan natural (misal: 'hah maksudnya?', 'piye piye?').",
      "Tiru GAYA BAHASA (misal: pakai kata 'aku'/'gak'), tapi JANGAN copy-paste ucapannya.",
      "Tiru vibe pesan user. Jika user ketik singkat, balas santai dan pendek.",
      "Sesekali sengaja gunakan singkatan malas (misal: 'banget' jd 'bgt') biar terlihat seperti manusia.",
      "HARAM MENGGUNAKAN TITIK DI AKHIR KALIMAT! Manusia jarang pakai titik saat chatting WA kasual.",
      "JANGAN pernah pakai bahasa baku atau kaku."
    ],
    neverCopyMistakes: false
  };
}

function analyzeTopicIntelligenceV87({
  incomingText = "",
  topic = {},
  opportunity = {},
  previousReplies = []
} = {}) {
  const detected = Array.isArray(topic?.detected)
    ? topic.detected
    : [];

  const available = Array.isArray(opportunity?.topics)
    ? opportunity.topics
    : [];

  const topics = [...new Set([...detected, ...available])];

  return {
    currentTopic: topic?.current || "unknown",
    candidates: topics.slice(0, 5),
    topicChangeAllowed: topics.length > 0,
    requireBridge: true
  };
}

function analyzeProactiveIntelligenceV88({
  momentum = {},
  opportunity = {},
  repetition = {},
  questionPressure = {},
  conversation = {}
} = {}) {
  const lowMomentum =
    ["low", "stalled", "dead"].includes(
      String(momentum?.level || "").toLowerCase()
    );

  const repetitive =
    Boolean(repetition?.repeated || repetition?.high);

  const pressureHigh =
    String(questionPressure?.level || "").toLowerCase() === "high";

  if (pressureHigh) {
    return {
      action: "RESPOND_WITHOUT_QUESTION",
      proactive: false
    };
  }

  if (repetitive) {
    return {
      action: "CHANGE_RHYTHM",
      proactive: true
    };
  }

  if (lowMomentum) {
    return {
      action: "OPEN_LIGHT_TOPIC",
      proactive: true
    };
  }

  return {
    action: "FOLLOW_NATURAL_FLOW",
    proactive: false
  };
}

function analyzeAntiMonotonyV89({
  previousReplies = [],
  incomingText = "",
  action = {}
} = {}) {
  const recent = previousReplies
    .slice(-6)
    .map(x => String(x || "").toLowerCase().trim())
    .filter(Boolean);

  const questionCount = recent.filter(x => x.includes("?")).length;

  const repeatedOpeners = (() => {
    const openers = recent.map(x =>
      x.split(/\s+/).slice(0, 3).join(" ")
    );

    return new Set(openers).size < Math.max(2, openers.length - 1);
  })();

  return {
    questionHeavy: questionCount >= 3,
    repeatedOpeners,
    recentCount: recent.length,
    forceVariation:
      questionCount >= 3 || repeatedOpeners,
    preferredVariation: [
      "comment",
      "callback",
      "playful",
      "small-story",
      "topic-bridge",
      "light-question"
    ]
  };
}

function buildV9SocialOrchestrator({
  relationship = {},
  memory = {},
  emotion = {},
  personality = {},
  topic = {},
  proactive = {},
  monotony = {},
  incomingText = ""
} = {}) {

  const rules = [];

  rules.push(
    "V9 GOAL: terasa seperti teman ngobrol sungguhan.",
    `RELATIONSHIP: ${relationship.level || "NEW"}`,
    `EMOTION: ${emotion.emotion || "neutral"}`,
    `PROACTIVE ACTION: ${proactive.action || "FOLLOW_NATURAL_FLOW"}`,
    `CURRENT TOPIC: ${topic.currentTopic || "unknown"}`
  );

  if (emotion.sensitive) {
    rules.push(
      "Prioritaskan perasaan user.",
      "Jangan memaksa topik baru.",
      "Jangan membombardir pertanyaan.",
      "Validasi secara natural sebelum memberi solusi."
    );
  }

  if (relationship.level === "NEW") {
    rules.push(
      "Jangan terlalu sok dekat.",
      "Bangun kedekatan secara bertahap."
    );
  }

  if (relationship.level === "CLOSE") {
    rules.push(
      "Boleh lebih hangat dan playful jika konteks mendukung.",
      "Gunakan callback secara natural."
    );
  }

  if (memory.callbackAllowed) {
    rules.push(
      "Gunakan memori hanya jika benar-benar relevan.",
      "Jangan menyebut memori secara terasa seperti database."
    );
  }

  if (topic.requireBridge) {
    rules.push(
      "Jika pindah topik, buat jembatan dari pesan terakhir.",
      "Jangan tiba-tiba melempar topik random."
    );
  }

  if (proactive.proactive) {
    rules.push(
      "Percakapan boleh diarahkan sedikit agar tidak mati.",
      "Buka topik ringan, bukan interogasi."
    );
  }

  if (monotony.forceVariation) {
    rules.push(
      "WAJIB variasikan pola respons.",
      "Jangan terus memakai pertanyaan.",
      "Jangan terus memakai 'iya', 'wkwk', 'aku paham', 'kenapa', atau 'terus'.",
      "Gunakan komentar, callback, humor ringan, observasi, cerita kecil, atau topic bridge."
    );
  }

  rules.push(
    "Jangan membuat percakapan terasa seperti interview.",
    "Tidak setiap pesan membutuhkan pertanyaan.",
    "Tidak setiap pesan membutuhkan topik baru.",
    "Respons pendek tetap boleh pendek.",
    "Respons panjang hanya jika memang diperlukan.",
    "Jangan mengarang fakta.",
    "Jangan mengklaim melakukan sesuatu yang belum dilakukan.",
    "Jangan menyebut engine, analyzer, memory system, orchestrator, atau aturan internal.",
    "Buat SATU balasan WhatsApp yang natural."
  );

  return rules.join("\n");
}

// ============================================================
// END V8.3 → V9 SOCIAL INTELLIGENCE LAYER
// ============================================================

// ============================================================
// GENERATE REPLY
// ============================================================


// ============================================================
// V8.1 CONVERSATION ENGINE
// Natural conversation momentum + topic discovery
// ============================================================

function analyzeConversationMomentum({
  incomingText = '',
  conversation = {},
  continuity = {},
  previousReplies = []
} = {}) {
  const text = String(incomingText || '').trim();
  const short = text.length <= 12;
  const recent = Array.isArray(previousReplies) ? previousReplies : [];

  let momentum = 'stable';

  if (!text) momentum = 'low';
  else if (short && recent.length > 0) momentum = 'low';
  else if (text.length > 40) momentum = 'active';
  else if (conversation?.engagement === 'high') momentum = 'active';

  return {
    momentum,
    engagement: conversation?.engagement || 'unknown',
    shortMessage: short,
    recentReplies: recent.length
  };
}

function detectConversationOpportunity({
  incomingText = '',
  conversation = {},
  psychology = {},
  topic = {}
} = {}) {
  const text = String(incomingText || '').trim().toLowerCase();

  const personal =
    /\b(aku|saya|gue|gw|kowe|kamu)\b/.test(text);

  const emotional =
    /\b(capek|stres|mumet|pusing|seneng|sedih|kesel|marah|takut|bingung)\b/.test(text);

  const topicSignal =
    /\b(kerja|duit|uang|keuangan|game|anime|motor|mobil|gunung|hiking|mancing|ikan|bisnis|usaha|cinta|cewek|cowok|film|musik|lagu|hp|pc)\b/.test(text);

  let opportunity = 'none';

  if (emotional) opportunity = 'emotional';
  else if (topicSignal) opportunity = 'topic';
  else if (personal) opportunity = 'personal';
  else if (text.length > 20) opportunity = 'conversation';

  return {
    opportunity,
    personal,
    emotional,
    topicSignal,
    currentTopic: topic?.current || 'general'
  };
}

function detectResponseRepetition({
  responseHistory = [],
  previousReplies = [],
  incomingText = ''
} = {}) {
  const replies = Array.isArray(previousReplies)
    ? previousReplies.filter(Boolean).map(String)
    : [];

  const recent = replies.slice(-5);

  if (recent.length < 2) {
    return {
      repeated: false,
      similarity: 0,
      reason: 'insufficient_history'
    };
  }

  const normalize = value =>
    String(value)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  const currentInput = normalize(incomingText);

  let repeated = false;
  let similarity = 0;

  for (const reply of recent) {
    const a = normalize(reply);

    if (!a || !currentInput) continue;

    const wordsA = new Set(a.split(' '));
    const wordsB = new Set(currentInput.split(' '));

    const intersection =
      [...wordsA].filter(x => wordsB.has(x)).length;

    const union = new Set([...wordsA, ...wordsB]).size;

    if (union > 0) {
      const score = intersection / union;

      if (score > similarity) similarity = score;
      if (score >= 0.75) repeated = true;
    }
  }

  return {
    repeated,
    similarity: Number(similarity.toFixed(2)),
    reason: repeated ? 'high_overlap' : 'normal'
  };
}

function analyzeQuestionPressure({
  conversation = {},
  proactive = {},
  opportunity = {},
  incomingText = ''
} = {}) {
  const text = String(incomingText || '').trim();

  const alreadyQuestion =
    /[?？]$/.test(text);

  let pressure = 'low';

  if (alreadyQuestion) pressure = 'avoid_question';
  else if (opportunity?.opportunity === 'emotional') pressure = 'very_low';
  else if (conversation?.engagement === 'low') pressure = 'low';
  else if (proactive?.shouldAsk) pressure = 'medium';

  return {
    pressure,
    alreadyQuestion,
    shouldAsk:
      pressure === 'medium'
  };
}

function selectConversationAction({
  momentum = {},
  opportunity = {},
  repetition = {},
  questionPressure = {}
} = {}) {
  if (opportunity?.opportunity === 'emotional') {
    return {
      action: 'listen_and_validate',
      reason: 'emotional_context'
    };
  }

  if (repetition?.repeated) {
    return {
      action: 'change_pattern',
      reason: 'response_repetition'
    };
  }

  if (opportunity?.opportunity === 'topic') {
    return {
      action: 'explore_topic',
      reason: 'topic_opportunity'
    };
  }

  if (momentum?.momentum === 'low') {
    return {
      action: 'light_nudge',
      reason: 'low_conversation_momentum'
    };
  }

  return {
    action: 'continue_naturally',
    reason: 'normal_flow'
  };
}

function selectTopicNudge({
  opportunity = {},
  momentum = {},
  incomingText = ''
} = {}) {
  const text = String(incomingText || '').toLowerCase();

  if (opportunity?.emotional) {
    return {
      type: 'emotional',
      topic: null,
      intensity: 0
    };
  }

  const topics = [
    ['kerja', /\b(kerja|kantor|shift|atasan|teman kerja)\b/],
    ['keuangan', /\b(uang|duit|keuangan|gaji|utang|cicilan)\b/],
    ['hobi', /\b(game|gaming|anime|musik|mancing)\b/],
    ['travel', /\b(gunung|hiking|naik gunung|touring|jalan)\b/],
    ['teknologi', /\b(hp|pc|komputer|aplikasi|coding|ai)\b/],
    ['bisnis', /\b(bisnis|usaha|jualan|dagang|produk)\b/]
  ];

  for (const [topic, regex] of topics) {
    if (regex.test(text)) {
      return {
        type: 'related_topic',
        topic,
        intensity: momentum?.momentum === 'low' ? 1 : 2
      };
    }
  }

  return {
    type: 'open_topic',
    topic: null,
    intensity: momentum?.momentum === 'low' ? 1 : 0
  };
}

function buildTopicBridge({
  action = {},
  nudge = {},
  incomingText = ''
} = {}) {
  if (action?.action === 'listen_and_validate') {
    return 'Utamakan merespons perasaan user. Jangan buru-buru mengalihkan topik.';
  }

  if (action?.action === 'change_pattern') {
    return 'Gunakan cara bicara berbeda dari balasan sebelumnya agar tidak terasa monoton.';
  }

  if (nudge?.topic) {
    return `Jika natural, sambungkan percakapan dengan topik ${nudge.topic}. Jangan memaksakan.`;
  }

  if (action?.action === 'light_nudge') {
    return 'Boleh membuka celah topik ringan yang relevan, tetapi jangan terasa seperti interview.';
  }

  return 'Lanjutkan percakapan secara natural berdasarkan pesan terbaru.';
}

function buildV81ConversationInstruction({
  action = {},
  momentum = {},
  opportunity = {},
  repetition = {},
  questionPressure = {},
  nudge = {},
  bridge = ''
} = {}) {
  return `
=== V8.1 NATURAL CONVERSATION LAYER ===

Action:
${JSON.stringify(action)}

Momentum:
${JSON.stringify(momentum)}

Opportunity:
${JSON.stringify(opportunity)}

Repetition:
${JSON.stringify(repetition)}

Question Pressure:
${JSON.stringify(questionPressure)}

Topic Nudge:
${JSON.stringify(nudge)}

Bridge:
${bridge}

RULES V8.1:

1. Jangan membuat percakapan terasa seperti sesi tanya jawab.
2. Jangan selalu mengakhiri balasan dengan pertanyaan.
3. Jika ada peluang topik baru, boleh membuka topik secara natural.
4. Topik baru harus punya hubungan dengan percakapan, bukan random.
5. Jika user sedang curhat, validasi dulu sebelum mengembangkan topik.
6. Jika user hanya menjawab pendek, jangan langsung menyerah dan jangan membuat paragraf panjang.
7. Gunakan respons yang terasa seperti teman yang ikut ngobrol.
8. Variasikan pembuka dan pola kalimat.
9. Hindari pengulangan "iya", "aku paham", "wkwk", "hehe", dan "sing sabar".
10. Sesekali boleh memberikan komentar kecil, observasi, candaan ringan, atau cerita pendek yang relevan.
11. Jangan memaksa user terus berbicara.
12. Jika percakapan mulai hambar, boleh memberikan satu topic nudge ringan.
13. Jangan mengarang pengalaman pribadi atau fakta tentang user.
14. Prioritaskan konteks pesan terbaru.
15. Tetap singkat jika pesan user singkat.
16. Tujuan utama adalah membuat percakapan terasa hidup, bukan sekadar menjawab.

Buat SATU balasan WhatsApp yang terasa seperti teman ngobrol sungguhan.
`.trim();
}

// ============================================================
// END V8.1 CONVERSATION ENGINE
// ============================================================

async function generateReply(
  jid,
  incomingText,
  systemMeta = ''
) {
  // ============================================================
  // LEAN GENERATE REPLY — Fokus, Cepat, Anti-Ngawur
  // ============================================================

  const data = loadMemory(jid);

  // Ambil memori jangka panjang (fakta permanen tentang lawan bicara)
  const longTermFacts = Array.isArray(data?.longTerm) && data.longTerm.length > 0
    ? '=== CATATAN PENTING TENTANG ORANG INI ===\n' + data.longTerm.map(f => `- ${f}`).join('\n')
    : '';

  // Ambil 15 pesan terakhir sebagai history (bukan 40 — fokus, tidak noise)
  const recentHistory = Array.isArray(data?.shortTerm)
    ? data.shortTerm.slice(-15)
    : [];

  // Bangun nama panggilan dari memory atau fallback
  const contactName = data?.pushName ? data.pushName.trim() : 'Teman';

  // ============================================================
  // PROMPT LEAN & TAJAM
  // ============================================================
  const leanSystemPrompt = `${SYSTEM_PROMPT}

=== ORANG YANG SEDANG KAU AJAK NGOBROL ===
Nama: ${contactName}
${longTermFacts}

=== ATURAN DASAR ===
1. Jawab HANYA pesan terbaru — jangan ngelantur ke topik lain.
2. Jika kamu TIDAK PAHAM → tanya dengan natural ("hah piye?", "kurang paham wkwk"), JANGAN ngawur mengarang jawaban.
3. Sesuaikan panjang balasan dengan konteks. Kalau butuh penjelasan, boleh agak panjang. Kalau sekadar sapaan, balas pendek.
4. JANGAN mengulangi isi pesan lawan bicara seperti robot.
5. JANGAN mengaku AI.
6. Jika ada info tambahan sistem di bawah, gunakan sebagai konteks rahasia.
${systemMeta ? `\n=== INFO TAMBAHAN (SISTEM, RAHASIA) ===\n${systemMeta}` : ''}`;

  // ============================================================
  // PANGGIL GEMINI — 1x, Lean, Langsung
  // ============================================================
  const v93Generation = await callGeminiSafeV93(
    incomingText,
    {
      maxAttempts: 2,
      conversationId: jid,
      history: recentHistory,
      systemPrompt: leanSystemPrompt,
      incomingText
    }
  );

  let response = '';

  if (v93Generation.ok) {
    response = v93Generation.response;
  } else {
    // Fallback sederhana — tidak mengarang, hanya tanya balik natural
    const fallbacks = [
      'eh maaf tadi kelewat, gimana tadi?',
      'hah? ulang dong wkwk',
      'sorry baru baca, tadi bilang apa?',
      'lagi ngehang sebentar wkwk, gimana?'
    ];
    response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // ============================================================
  // POST-PROCESSING — Hard Cap Panjang Balasan
  // ============================================================
  const userWordCount = incomingText.trim().split(/\s+/).length;
  const sentences = response.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  let finalResponse = response;
  if (userWordCount <= 5 && sentences.length > 2) {
    // Pesan user sangat pendek → max 1-2 kalimat
    finalResponse = sentences.slice(0, 2).join(' ');
  } else if (userWordCount <= 15 && sentences.length > 3) {
    // Pesan user sedang → max 3 kalimat
    finalResponse = sentences.slice(0, 3).join(' ');
  }

  // Strip kalimat robot yang lolos
  const robotPhrases = ['Tentu!', 'Tentu saja!', 'Baik!', 'Siap!', 'Dengan senang hati', 'Sebagai AI', 'Sebagai asisten'];
  for (const phrase of robotPhrases) {
    finalResponse = finalResponse.replace(new RegExp(phrase, 'gi'), '').trim();
  }

  return String(finalResponse || response || '').trim();

}





// ============================================================
// V5.3 END CONVERSATION ORCHESTRATOR
// ============================================================

// ============================================================
// V4.6 EXPLICIT MEMORY ENGINE
// ============================================================

function extractExplicitMemory(text) {
  if (typeof text !== 'string') {
    return null;
  }

  const value = text.trim();

  // Nama
  let match = value.match(
    /(?:namaku|nama saya|nama gue|nama gw)\s+(?:adalah\s+)?([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s'-]{1,40}?)(?:\s*,|\s+ingat\b|\s+ya\b|$)/i
  );

  if (match) {
    const name = match[1].trim();

    if (name.length >= 2) {
      return {
        type: 'fact',
        value: `Nama pengguna adalah ${name}.`
      };
    }
  }

  // "ingat ini"
  if (
    /\b(ingat ini|ingat ya|tolong ingat|jangan lupa)\b/i.test(value)
  ) {
    const cleaned = value
      .replace(
        /\b(tolong\s+)?(ingat\s+ini|ingat\s+ya|jangan\s+lupa)\b/ig,
        ''
      )
      .replace(/[,.!?]+/g, ' ')
      .trim();

    if (cleaned.length >= 4) {
      return {
        type: 'fact',
        value: cleaned
      };
    }
  }

  return null;
}

async function saveExplicitMemory(jid, text) {
  const extracted = extractExplicitMemory(text);

  if (!extracted) {
    return false;
  }

  await withMemoryLock(jid, async () => {
    const data = loadMemory(jid);

    if (!Array.isArray(data.facts)) {
      data.facts = [];
    }

    if (!data.facts.includes(extracted.value)) {
      data.facts.push(extracted.value);

      data.facts = [
        ...new Set(data.facts)
      ].slice(
        0,
        CONFIG.MAX_LONG_MEMORY
      );

      console.log(
        `🧠 Explicit memory saved: ${extracted.value}`
      );

      await saveMemory(jid);
    }
  });

  return true;
}

// ============================================================
// END V4.6 EXPLICIT MEMORY ENGINE
// ============================================================

// ============================================================
// MEMORY EXTRACTION
// ============================================================

function formatMemoryForPrompt(arr) {
  if (!Array.isArray(arr)) return '(kosong)';
  const strings = arr
    .map(x => {
      if (typeof x === 'string') return x.trim();
      if (x && typeof x === 'object' && typeof x.value === 'string') return x.value.trim();
      return null;
    })
    .filter(x => x && x !== '[object Object]');
    
  return strings.length > 0 ? strings.join('\n') : '(kosong)';
}

const MEMORY_EXTRACTION_COOLDOWN = 5 * 60 * 1000;

async function updateMemoryFromConversation(
  jid
) {
  if (USE_V10_MEMORY_ENGINE) {
     console.log('🚀 Using V10 Memory Engine');
     try {
       const mod = await import('./src/memory/index.mjs');
       const { MemoryManager } = mod;
       const manager = new MemoryManager(aiGateway);
       
       const data = loadMemory(jid);
       const recentContext = data.shortTerm.map(x => `${x.role}: ${x.text}`).join('\n');
       
       manager.extractMemory(jid, recentContext).catch(console.error);
       return; // Exit legacy flow
     } catch (err) {
       console.error('Failed to run V10 Memory Engine, falling back to legacy:', err);
     }
  }

  const data =
    loadMemory(jid);

  if (
    data.shortTerm.length <
    CONFIG.SUMMARY_TRIGGER
  ) {
    return;
  }
  
  const now = Date.now();
  if (data.memoryMeta && data.memoryMeta.lastExtractionAt && (now - data.memoryMeta.lastExtractionAt < MEMORY_EXTRACTION_COOLDOWN)) {
    return;
  }
  if (globalGeminiQuotaState.exhausted && now < globalGeminiQuotaState.resetAt) {
    return;
  }

  console.log(
    `🧠 Mengevaluasi memory: ${jid}`
  );

  const conversation =
    data.shortTerm
      .map(
        x =>
          `${x.role}: ${x.text}`
      )
      .join('\n');

  const prompt = `
Kamu adalah Memory Manager.

Analisis percakapan berikut.

Tujuan:
1. Cari fakta yang relatif stabil.
2. Cari preferensi yang berguna.
3. Cari topik penting.
4. Buat ringkasan singkat.
5. Jangan menyimpan informasi sensitif yang tidak diperlukan.
6. Jangan mengarang fakta.
7. Jangan menganggap rencana sebagai fakta pasti.

Memory lama:
${data.summary || '(kosong)'}

Fakta lama:
${formatMemoryForPrompt(data.facts)}

Preferensi lama:
${formatMemoryForPrompt(data.preferences)}

Percakapan:
${conversation}

Balas HANYA JSON valid:

{
  "summary": "ringkasan singkat",
  "facts": [],
  "preferences": [],
  "topics": []
}
`;

  try {

    const geminiResult =
      await callGeminiSafeV93(
        prompt,
        { maxAttempts: 1 }
      );

    if (
      !geminiResult.ok
    ) {
      console.log('⚠️ Memory extraction dibatalkan: ' + geminiResult.error);
      return;
    }
    
    const result = geminiResult.response;

    if (
      !result ||
      result === '[SKIP]'
    ) {
      return;
    }

    let parsed;
    try {
      const cleaned =
        result
          .replace(/^```json/i, '')
          .replace(/^```/i, '')
          .replace(/```$/i, '')
          .trim();

      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('⚠️ Gagal parsing JSON memori. Memori lama dilindungi.');
      return;
    }

    if (
      parsed &&
      typeof parsed.summary ===
      'string'
    ) {
      data.summary =
        parsed.summary;
    }

    const processNewItems = (newItems, type) => {
      if (Array.isArray(newItems)) {
        const validItems = newItems.filter(x => typeof x === 'string' && x.trim() && x !== '[object Object]');
        for (const item of validItems) {
           promoteMemoryV92(data, item, type, { importance: 0.6 });
        }
      }
    };

    processNewItems(parsed.facts, 'fact');
    processNewItems(parsed.preferences, 'preference');
    processNewItems(parsed.topics, 'topic');

    // Setelah diringkas,
    // simpan beberapa chat terakhir saja.
    data.shortTerm =
      data.shortTerm.slice(
        -20
      );


    // ========================================================
    // V9.2 MEMORY SAFETY
    // ========================================================

    const v92Safety =
      resolveMemoryConflictsV92(data);

    applyMemoryDecayV92(data);

    data.memoryMeta =
      data.memoryMeta || {};

    data.memoryMeta.lastSafetySweep =
      Date.now();
      
    data.memoryMeta.lastExtractionAt = 
      Date.now();

    data.memoryMeta.conflictsDetected =
      Number(
        data.memoryMeta.conflictsDetected || 0
      ) +
      Number(
        v92Safety.conflicts || 0
      );

    console.log(
      `🛡️ V9.2 Memory Safety: ${JSON.stringify(v92Safety)}`
    );

    await saveMemory(jid);

    console.log(
      `✅ Memory diperbarui: ${jid}`
    );

  } catch (err) {

    console.error(
      '⚠️ Memory extraction gagal:',
      err.message
    );
  }
}

// ============================================================
// RATE LIMIT
// ============================================================

function canReply(jid) {

  const now =
    Date.now();

  if (
    !rateLimits.has(jid)
  ) {
    rateLimits.set(
      jid,
      []
    );
  }

  const timestamps =
    rateLimits.get(jid);

  const valid =
    timestamps.filter(
      t =>
        now - t <
        CONFIG.RATE_LIMIT_WINDOW_MS
    );

  rateLimits.set(
    jid,
    valid
  );

  return (
    valid.length <
    CONFIG.MAX_REPLIES_PER_WINDOW
  );
}

function registerReply(jid) {

  if (
    !rateLimits.has(jid)
  ) {
    rateLimits.set(
      jid,
      []
    );
  }

  rateLimits
    .get(jid)
    .push(Date.now());
}

// ============================================================
// COOLDOWN
// ============================================================

function isCooldown(jid) {

  const last =
    cooldowns.get(jid);

  if (!last) {
    return false;
  }

  return (
    Date.now() - last <
    CONFIG.COOLDOWN_MS
  );
}

function setCooldown(jid) {

  cooldowns.set(
    jid,
    Date.now()
  );
}

// ============================================================
// DEBOUNCE
// ============================================================

function debounceMessage(
  jid,
  text,
  callback
) {

  if (
    pendingMessages.has(jid)
  ) {

    clearTimeout(
      pendingMessages
        .get(jid)
        .timer
    );
  }

  let pending =
    pendingMessages.get(
      jid
    );

  if (!pending) {

    pending = {
      texts: []
    };
  }

  pending.texts.push(
    text
  );

  pending.timer =
    setTimeout(
      async () => {

        pendingMessages.delete(
          jid
        );

        const combined =
          pending.texts
            .join('\n');

        console.log(
          `⏱️ Debounce selesai: ${pending.texts.length} pesan`
        );

        await callback(
          jid,
          combined
        );

      },
      CONFIG.DEBOUNCE_MS
    );

  pendingMessages.set(
    jid,
    pending
  );
}

// ============================================================
// RETRY QUEUE — Pesan yang gagal karena limit, dicoba lagi otomatis
// ============================================================
const retryQueue = new Map(); // jid → [{text, meta, sock, retryCount}]

function scheduleRetry(sock, jid, text, meta = '', retryCount = 0) {
  if (retryCount >= 3) {
    console.log(`⚠️ Retry Queue: Pesan dari ${jid} sudah 3x gagal, dibuang.`);
    return;
  }
  const delay = 30000; // 30 detik
  console.log(`🔁 Retry Queue: Akan coba balas ${jid} lagi dalam ${delay/1000}s (attempt ${retryCount + 1}/3)...`);
  setTimeout(async () => {
    try {
      await processMessage(sock, jid, text, null, meta);
    } catch (e) {
      console.error(`❌ Retry gagal:`, e.message);
      scheduleRetry(sock, jid, text, meta, retryCount + 1);
    }
  }, delay);
}

// ============================================================
// QUEUE
// ============================================================

function enqueue(
  jid,
  task
) {

  if (
    !contactQueues.has(jid)
  ) {

    contactQueues.set(
      jid,
      []
    );
  }

  const queue =
    contactQueues.get(
      jid
    );

  queue.push(
    task
  );

  processQueue(jid);
}

async function processQueue(
  jid
) {

  const queue =
    contactQueues.get(
      jid
    );

  if (
    !queue ||
    queue.length === 0
  ) {
    return;
  }

  if (
    queue.processing
  ) {
    return;
  }

  queue.processing =
    true;

  while (
    queue.length
  ) {

    const task =
      queue.shift();

    try {

      await task();

    } catch (err) {

      console.error(
        '❌ Queue error:',
        err.message
      );
    }
  }

  queue.processing =
    false;
}

// ============================================================
// COMMANDS
// ============================================================

async function handleCommand(
  sock,
  jid,
  text
) {

  const command =
    text
      .trim()
      .toLowerCase();

  if (
    command ===
    '/bot on'
  ) {

    botEnabled =
      true;

    await sock.sendMessage(
      jid,
      {
        text:
          '🤖 Bot sekarang ON.'
      }
    );

    return true;
  }

  if (
    command ===
    '/bot off'
  ) {

    botEnabled =
      false;

    await sock.sendMessage(
      jid,
      {
        text:
          '🔴 Bot sekarang OFF.'
      }
    );

    return true;
  }

  if (
    command ===
    '/status'
  ) {

    const queueCount =
      [...contactQueues.values()]
        .reduce(
          (total, queue) =>
            total +
            queue.length,
          0
        );

    const memoryFiles =
      fs.readdirSync(
        MEMORY_DIR
      )
      .filter(
        file =>
          file.endsWith(
            '.json'
          )
      )
      .length;

    await sock.sendMessage(
      jid,
      {
        text: `
🤖 WA BOT V3

Bot:
${botEnabled ? '🟢 ON' : '🔴 OFF'}

WhatsApp:
${currentSocket ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}

Session:
${SESSION_DIR}

Memory:
${memoryFiles} kontak

Queue:
${queueCount}

Uptime:
${formatUptime()}

Reconnect:
${reconnectAttempts}
`.trim()
      }
    );

    return true;
  }

  if (
    command ===
    '/reset'
  ) {

    const file =
      memoryPath(jid);

    shortMemory.delete(
      jid
    );

    try {

      if (
        fs.existsSync(file)
      ) {

        fs.unlinkSync(
          file
        );
      }

    } catch (err) {

      console.error(
        'Memory delete error:',
        err.message
      );
    }

    await sock.sendMessage(
      jid,
      {
        text:
          '🧹 Semua memory kontak ini sudah direset.'
      }
    );

    return true;
  }

  if (
    command ===
    '/memory'
  ) {

    const data =
      loadMemory(jid);

    const text = `
🧠 MEMORY

Ringkasan:
${data.summary || '-'}

Fakta:
${data.facts.length
      ? data.facts
          .map(
            x => `• ${x}`
          )
          .join('\n')
      : '-'}

Preferensi:
${data.preferences.length
      ? data.preferences
          .map(
            x => `• ${x}`
          )
          .join('\n')
      : '-'}

Topik:
${data.topics.length
      ? data.topics.join(', ')
      : '-'}

Pesan tersimpan:
${data.shortTerm.length}
`.trim();

    await sock.sendMessage(
      jid,
      {
        text
      }
    );

    return true;
  }

  // ============================================================
  // /riwayat — tampilkan 10 pesan terakhir yang diingat bot
  // ============================================================
  if (command === '/riwayat') {
    const data = loadMemory(jid);
    const shortTerm = data.shortTerm || [];
    
    if (shortTerm.length === 0) {
      await sock.sendMessage(jid, { text: '🧠 Belum ada riwayat percakapan yang tersimpan.' });
      return true;
    }
    
    const lines = shortTerm.slice(-10).map((x, i) => {
      const who = x.role === 'user' ? '👤 Kamu' : '🤖 Bot';
      return `${who}: ${String(x.text || '').slice(0, 80)}`;
    });
    
    await sock.sendMessage(jid, {
      text: `🧠 *Riwayat 10 Pesan Terakhir*\n\n${lines.join('\n')}`
    });
    return true;
  }

  // ============================================================
  // /aistatus — tampilkan health AI stack
  // ============================================================
  if (command === '/aistatus') {
    const stats = aiGateway?.stats || {};
    const state = aiGateway?.state || 'UNKNOWN';
    const groqAvailable = !!(process.env.GROQ_API_KEY);
    
    await sock.sendMessage(jid, {
      text: `🤖 *AI Stack Status*

Circuit: ${state}
Gemini berhasil: ${stats.success || 0}x
Gemini gagal: ${stats.failures || 0}x
Groq dipakai: ${stats.groqCount || 0}x
Local fallback: ${stats.fallbackCount || 0}x
Groq terkonfigurasi: ${groqAvailable ? '✅' : '❌ (set GROQ_API_KEY)'}`.trim()
    });
    return true;
  }

  return false;
}

// ============================================================
// PROCESS MESSAGE
// ============================================================

async function processMessage(
  sock,
  jid,
  text,
  rawMsg,
  systemMeta = ''
) {

  if (!botEnabled) {
    console.log(
      '🔴 Bot OFF'
    );

    return;
  }

  if (
    !canReply(jid)
  ) {

    console.log(
      `🛑 Rate limit: ${jid}`
    );

    return;
  }

  if (
    isCooldown(jid)
  ) {

    console.log(
      `⏳ Cooldown: ${jid}`
    );

    return;
  }

  // Pastikan memory sudah ada
  loadMemory(jid);

  // Simpan pesan user
  await withMemoryLock(jid, async () => {
    await addConversation(jid, 'user', text);
  });

  // Kalkulasi Target Jeda Baca (Read Delay) berdasarkan panjang teks user (40ms per huruf)
  // Max 6 detik, Min 0.5 detik
  const readDelayTarget = Math.min(Math.max((text || '').length * 40, 500), 6000);
  const startTime = Date.now();
  
  // Set status ke Online (Pura-pura membaca) tanpa Typing
  try { await sock.sendPresenceUpdate('available', jid); } catch (_) {}

  // AI bekerja merangkai jawaban (biasanya butuh 1-3 detik)
  const reply = await generateReply(jid, text, systemMeta);

  if (!reply || reply === '[SKIP]') {
    // Cek apakah bot perlu retry (AI sedang limit)
    const isLimitError = !reply;
    if (isLimitError && sock) {
      console.log(`🔁 AI gagal/limit untuk ${jid}, masuk retry queue...`);
      scheduleRetry(sock, jid, text, systemMeta);
    } else {
      console.log('🤐 AI memilih tidak membalas');
    }
    return;
  }

  // Evaluasi waktu sisa membaca: Jika AI terlalu cepat, pura-pura baca dulu sisanya
  const elapsed = Date.now() - startTime;
  if (elapsed < readDelayTarget) {
    const remainingReadTime = readDelayTarget - elapsed;
    console.log(`👀 Membaca (Jeda ekstra ${remainingReadTime}ms)...`);
    await sleep(remainingReadTime);
  }

  console.log(`🤖 Balasan: ${reply}`);

  // Kalkulasi Jeda Mengetik (Typing Delay) berdasarkan panjang balasan AI (35ms per huruf)
  // Max 5 detik, Min 1 detik
  const typingDelay = Math.min(Math.max((reply || '').length * 35, 1000), 5000);

  try { await sock.sendPresenceUpdate('composing', jid); } catch (_) {}
  console.log(`⌨️ Typing ${typingDelay}ms...`);
  await sleep(typingDelay);

  try {

    await sock.sendPresenceUpdate(
      'paused',
      jid
    );

  } catch (_) {}

  // Kirim balasan beruntun (consecutive bubbles)
  const bubbles = reply
    .split('\n')
    .map(b => b.trim())
    .filter(Boolean);

  if (bubbles.length > 0) {
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      
      // Simulasikan jeda mengetik untuk balon chat berikutnya
      if (i > 0) {
        const bubbleDelay = randomDelay(600, 1500);
        try {
          await sock.sendPresenceUpdate('composing', jid);
        } catch (_) {}
        console.log(`⌨️ Mengetik pesan beruntun ${i+1}/${bubbles.length} selama ${bubbleDelay}ms...`);
        await sleep(bubbleDelay);
        try {
          await sock.sendPresenceUpdate('paused', jid);
        } catch (_) {}
      }

      const sendOptions = {};
      // Hanya balon pertama yang membalas (quote/slide) pesan user asli
      if (i === 0 && rawMsg) {
        sendOptions.quoted = rawMsg;
      }

      // --- 🤖 AUTO-EDIT TYPO SYSTEM (ANTI-CURIGA) ---
      // 15% peluang bot sengaja typo untuk pesan yang cukup panjang
      const shouldTypo = Math.random() < 0.15 && bubble.length > 10;
      let sentMsg = null;
      let didTypo = false;
      let typoBubble = bubble;

      if (shouldTypo) {
        const words = bubble.split(' ');
        const candidates = words.map((w, idx) => ({word: w, idx})).filter(c => c.word.length >= 5 && /^[a-zA-Z]+$/.test(c.word));
        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          const w = target.word;
          // Tukar 2 huruf di tengah kata (misal: "besok" -> "bseok")
          const swapIdx = Math.floor(Math.random() * (w.length - 3)) + 1; 
          const scrambled = w.substring(0, swapIdx) + w[swapIdx + 1] + w[swapIdx] + w.substring(swapIdx + 2);
          words[target.idx] = scrambled;
          typoBubble = words.join(' ');
          didTypo = true;
        }
      }

      try {
        if (didTypo) {
          console.log(`📝 Sengaja typo: ${typoBubble}`);
          sentMsg = await sock.sendMessage(jid, { text: typoBubble }, sendOptions);
          
          // Jeda sadar typo (manusia butuh 2-4 detik buat sadar kalau dia typo)
          await sleep(randomDelay(2000, 4000));
          
          console.log(`✏️ Mengedit typo kembali ke normal: ${bubble}`);
          try { await sock.sendPresenceUpdate('composing', jid); } catch (_) {}
          await sleep(randomDelay(1000, 2000)); // Pura-pura ngetik ralatnya
          await sock.sendMessage(jid, { text: bubble, edit: sentMsg.key });
        } else {
          await sock.sendMessage(jid, { text: bubble }, sendOptions);
        }
      } catch (sendErr) {
        console.warn(`⚠️ Gagal mengirim pesan (Error: ${sendErr.message}). Mencoba tanpa quote...`);
        try {
          await sock.sendMessage(jid, { text: bubble });
        } catch (e) {
          console.error('❌ Gagal total mengirim pesan:', e.message);
        }
      }
    }
  }

  // Simpan jawaban assistant
  await withMemoryLock(
    jid,
    async () => {

      await addConversation(
        jid,
        'assistant',
        reply
      );

      await updateMemoryFromConversation(
        jid
      );
    }
  );

  registerReply(
    jid
  );

  setCooldown(
    jid
  );

  console.log(
    '✅ Balasan terkirim'
  );
}

// ============================================================
// WHATSAPP
// ============================================================

async function startBot() {

  try {

    console.log(
      '\n🚀 Starting WhatsApp...'
    );

    const {
      state,
      saveCreds
    } =
      await useMultiFileAuthState(
        SESSION_DIR
      );

    console.log(
      '🌐 Mengambil WA Web version...'
    );

    const {
      version,
      isLatest
    } =
      await fetchLatestBaileysVersion();

    console.log(
      `📡 WA Web: ${version.join('.')} | latest: ${isLatest}`
    );

    const sock =
      makeWASocket({
        auth: state,

        version,

        logger:
          pino({
            level:
              'silent'
          }),

        markOnlineOnConnect:
          false,

        syncFullHistory:
          false
      });

    currentSocket =
      sock;

    sock.ev.on(
      'creds.update',
      saveCreds
    );

    // ========================================================
    // BACKGROUND SCHEDULER LOOP
    // ========================================================
    setInterval(() => {
      if (!currentSocket) return;
      // using dynamic import for fs and path to avoid issues
      const fs = require('fs');
      const path = require('path');
      const remindersPath = path.resolve(process.cwd(), 'memory', 'reminders.json');
      if (fs.existsSync(remindersPath)) {
        try {
          let reminders = JSON.parse(fs.readFileSync(remindersPath, 'utf8'));
          const now = Date.now();
          let changed = false;
          let remaining = [];
          
          for (const r of reminders) {
            if (now >= r.executeAt) {
              console.log(`[Scheduler] Executing reminder for ${r.jid}: ${r.message}`);
              currentSocket.sendMessage(r.jid, { text: `⏰ *PENGINGAT OTOMATIS:*\n\n${r.message}` }).catch(console.error);
              changed = true;
            } else {
              remaining.push(r);
            }
          }
          
          if (changed) {
            fs.writeFileSync(remindersPath, JSON.stringify(remaining, null, 2));
          }
        } catch (e) {
          console.error('[Scheduler Error]', e.message);
        }
      }
    }, 60000); // Check every 60 seconds
    // ========================================================

    sock.ev.on(
      'connection.update',
      ({
        connection,
        lastDisconnect
      }) => {

        if (
          connection
        ) {

          console.log(
            `🔌 Connection: ${connection}`
          );
        }

        if (
          connection ===
          'open'
        ) {

          // ====================================================
          // V4_SCHEDULER_SAFE_HOOK
          // ====================================================

          try {

            if (
              v4Automation &&
              typeof v4Automation.installAutomation === 'function'
            ) {

              v4Automation.installAutomation(sock);

              console.log(
                '⏰ V4 Scheduler: AKTIF'
              );

            }

          } catch (err) {

            console.log(
              '⚠️ V4 Scheduler gagal aktif:',
              err.message
            );

          }

          console.log(
            `👤 Akun: ${sock?.user?.id}`
          );
          
          console.log(
            `🤖 Bot: ${botEnabled ? 'ON' : 'OFF'}`
          );

          // === MULAI PROACTIVE BRAIN ===
          if (proactiveBrain && botEnabled) {
            proactiveBrain.start(sock, null, ALLOWED_CONTACTS, generateReply);
          }
          // === END PROACTIVE BRAIN ===

          reconnectAttempts =
            0;

          console.log(
            '\n======================================'
          );

          console.log(
            '   ✅ WHATSAPP + AI V3 AKTIF'
          );

          console.log(
            '======================================'
          );

          console.log(
            `👤 Akun: ${sock.user?.id || 'unknown'}`
          );

          console.log(
            `🤖 Bot: ${botEnabled ? 'ON' : 'OFF'}`
          );

          console.log(
            `🧠 Memory: ${MEMORY_DIR}`
          );
          
          // ========================================================
          // DEVOPS GUARDIAN INJECTION
          // ========================================================
          try {
            import('./src/agent/background/DevOpsGuardian.mjs').then(({ DevOpsGuardian }) => {
              if (global.devOpsGuardian) {
                global.devOpsGuardian.stop();
              }
              global.devOpsGuardian = new DevOpsGuardian(sock, aiGateway);
              // global.devOpsGuardian.start(); // DISABLED TO PREVENT SELF-HACKING LOOP
            });
          } catch (e) {
            console.error('Gagal menjalankan DevOpsGuardian:', e);
          }

          // Startup Catch-up: Otomatis balas chat yang terlewat saat bot mati / restart
          setTimeout(async () => {
            try {
              console.log('🔍 Startup Catch-up: Memindai chat yang belum terbalas...');
              const fs = require('fs');
              const path = require('path');
              const memoryDir = path.resolve(process.cwd(), 'memory');
              if (!fs.existsSync(memoryDir)) return;

              const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('_s_whatsapp_net.json') || f.endsWith('@s.whatsapp.net.json'));
              
              for (const file of files) {
                const filePath = path.join(memoryDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (Array.isArray(data.shortTerm) && data.shortTerm.length > 0) {
                  const lastMsg = data.shortTerm[data.shortTerm.length - 1];
                  
                  if (lastMsg.role === 'user') {
                    const jid = file.replace('_s_whatsapp_net.json', '@s.whatsapp.net').replace('.json', '');
                    const ageMs = Date.now() - lastMsg.time;
                    const maxAgeMs = 6 * 60 * 60 * 1000; // Maksimal 6 jam yang lalu
                    
                    if (ageMs < maxAgeMs) {
                      console.log(`🎯 Startup Catch-up: Menemukan chat belum terbalas untuk ${jid}. Memproses balasan...`);
                      enqueue(jid, async () => {
                        await sleep(2000);
                        await processMessage(sock, jid, lastMsg.text);
                      });
                    }
                  }
                }
              }
            } catch (err) {
              console.error('❌ Gagal menjalankan Startup Catch-up:', err.message);
            }
          }, 8000); // Jeda 8 detik setelah koneksi stabil agar database terload
        }

        if (
          connection ===
          'close'
        ) {

          currentSocket =
            null;

          const code =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          console.log(
            `❌ WhatsApp terputus. Code: ${code || 'unknown'}`
          );

          if (
            code ===
            DisconnectReason.loggedOut
          ) {

            console.log(
              '🚨 SESSION LOGOUT'
            );

            console.log(
              '⚠️ auth-v7 TIDAK dihapus.'
            );

            return;
          }

          reconnectAttempts++;

          const delay =
            Math.min(
              5000 *
                reconnectAttempts,
              30000
            );

          console.log(
            `🔄 Reconnect dalam ${delay}ms...`
          );

          setTimeout(
            () => {

              startBot()
                .catch(
                  console.error
                );

            },
            delay
          );
        }
      }
    );

    // ========================================================
    // MESSAGES
    // ========================================================

    sock.ev.on(
      'messages.upsert',
      async ({
        messages,
        type
      }) => {

        if (
          type !==
          'notify'
        ) {
          return;
        }

        for (
          const msg of
          messages
        ) {

          try {

            if (!msg?.message) {
              continue;
            }

            // --- ANTI DOBEL ---
            if (msg.key && msg.key.id) {
              if (global.processedMessages && global.processedMessages.has(msg.key.id)) {
                continue; // Sudah pernah diproses, lewati!
              }
              if (!global.processedMessages) global.processedMessages = new Set();
              global.processedMessages.add(msg.key.id);
              // Agar RAM tidak penuh, hapus yang paling lama jika lebih dari 1000
              if (global.processedMessages.size > 1000) {
                const first = global.processedMessages.keys().next().value;
                global.processedMessages.delete(first);
              }
            }
            // ------------------

            let jid = msg.key.remoteJid;
            if (!jid) continue;

            // --- REKAM JEJAK PESAN MANUAL DARI OWNER ---
            if (msg.key.fromMe) {
              if (jid.endsWith('@g.us') || jid === 'status@broadcast') continue;

              const myText = getMessageText(msg);
              if (myText) {
                try {
                  const fs = require('fs');
                  const path = require('path');
                  const memFile = path.join(MEMORY_DIR, `${jid.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
                  let db = { shortTerm: [] };
                  if (fs.existsSync(memFile)) {
                    db = JSON.parse(fs.readFileSync(memFile, 'utf8'));
                  }
                  
                  const lastMsg = db.shortTerm.length > 0 ? db.shortTerm[db.shortTerm.length - 1] : null;
                  
                  // Cegah duplikasi: Jika teks pesan SAMA PERSIS dengan pesan terakhir bot (karena bot baru saja ngirim), abaikan.
                  // Jika BEDA, berarti Owner mengetik manual dari HP/WA Web!
                  if (!lastMsg || lastMsg.role !== 'assistant' || lastMsg.text !== myText) {
                    console.log(`📝 [Sync Manual] Menyimpan ketikan manual owner ke memory: ${myText}`);
                    // Kita simpan seolah-olah itu jawaban bot ('assistant') agar AI tau konteksnya
                    db.shortTerm.push({
                      role: 'assistant',
                      text: `[Pesan Manual Owner]: ${myText}`,
                      time: Date.now()
                    });
                    fs.writeFileSync(memFile, JSON.stringify(db, null, 2));
                  }
                } catch (e) {
                  console.error('❌ Gagal sinkronisasi pesan manual:', e.message);
                }
              }
              continue; // Tetap lanjutkan loop agar bot tidak membalas pesannya sendiri
            }



            // Grup
            if (
              jid.endsWith(
                '@g.us'
              )
            ) {

              console.log(
                `⏭️ Grup diabaikan: ${jid}`
              );

              continue;
            }

            // Status
            if (
              jid ===
              'status@broadcast'
            ) {
              continue;
            }


            // ====================================================
            // LID_WHITELIST_RESOLVER_V41
            // ====================================================

            let whitelistJid = jid;

            try {

              // Baileys V7 dapat menyimpan identitas LID
              // sebagai mapping internal pada socket.
              if (
                jid.endsWith('@lid') &&
                typeof sock.signalRepository?.lidMapping?.getPNForLID === 'function'
              ) {

                const pn = await
                  sock.signalRepository.lidMapping.getPNForLID(jid);

                if (pn) {
                  whitelistJid = pn;

// ============================================================
// LID_NORMALIZER_V422
// Baileys dapat mengembalikan JID seperti:
// 6285600596826:0@s.whatsapp.net
// Normalisasi menjadi:
// 6285600596826@s.whatsapp.net
// ============================================================

if (
  typeof whitelistJid === 'string' &&
  whitelistJid.endsWith('@s.whatsapp.net')
) {
  const normalizedWhitelistJid =
    whitelistJid.replace(
      /:\d+(?=@s\.whatsapp\.net$)/,
      ''
    );

  if (normalizedWhitelistJid !== whitelistJid) {
    console.log(
      `🔧 JID normalized: ${whitelistJid} → ${normalizedWhitelistJid}`
    );

    whitelistJid =
      normalizedWhitelistJid;
  }
}

// ============================================================
// END LID_NORMALIZER_V422
// ============================================================

              // Simpan mapping LID → nomor secara permanen.
              persistLidMappingV421(
                jid,
                pn
              );
                  console.log(
                    `🔄 LID resolved: ${jid} → ${pn}`
                  );
                }

              }

            } catch (err) {

              console.log(
                `⚠️ LID resolve gagal: ${jid} → ${err.message}`
              );

            }

            const whitelistAllowed =
              ALLOWED_CONTACTS.includes(jid) ||
              ALLOWED_CONTACTS.includes(whitelistJid);

// ============================================================
// IDENTITY_LAYER_V43
// ============================================================
// Semua sistem setelah titik ini menggunakan canonical JID.
// Contoh:
// 6281935596653:0@s.whatsapp.net
//              ↓
// 6281935596653@s.whatsapp.net
//
// LID juga dipetakan ke nomor asli bila tersedia.
// ============================================================

if (identityV43?.normalizeCanonicalJid) {
  const originalJid = jid;

  const resolvedIdentity =
    identityV43.normalizeCanonicalJid(
      whitelistJid || jid
    );

  if (
    resolvedIdentity &&
    resolvedIdentity !== originalJid
  ) {
    console.log(
      `🆔 Canonical Identity: ${originalJid} → ${resolvedIdentity}`
    );
  }

  jid = resolvedIdentity || jid;
}

// Simpan pasangan LID → nomor secara permanen
if (
  identityV43?.rememberIdentity &&
  msg.key.remoteJid?.endsWith('@lid') &&
  whitelistJid &&
  whitelistJid.endsWith('@s.whatsapp.net')
) {
  identityV43.rememberIdentity(
    msg.key.remoteJid,
    whitelistJid
  );
}

// ============================================================
// END IDENTITY_LAYER_V43
// ============================================================


            // ====================================================
            // END LID_WHITELIST_RESOLVER_V41
            // ====================================================

            // Whitelist
            if (
              !whitelistAllowed
            ) {

              console.log(
                `🔒 Kontak diabaikan: ${jid}`
              );

              continue;
            }

            let text = getMessageText(msg.message);

            // ====================================================
            // ADMIN UI INJECTION (Phase J)
            // ====================================================
            const OWNER_IDS = (process.env.OWNER_CHAT_IDS || '628xxxxxxxxxx@s.whatsapp.net').split(',').map(id => id.trim()); OWNER_IDS.push('236322690191595@lid');
            if (OWNER_IDS.includes(jid)) {
                if (text.toLowerCase().startsWith('/approve') || text.toLowerCase().startsWith('/leads')) {
                     const { SalesIntegrator } = await import('./SalesIntegrator.mjs');
                     await SalesIntegrator.handleAdminCommand(sock, jid, text);
                     continue; 
                }
            }

            // Extract Quoted Message Context (Pesan yang di-slide/di-swipe dari tipe pesan mana saja)
            try {
              let contextInfo = null;
              if (msg.message) {
                const subObjKey = Object.keys(msg.message).find(k => msg.message[k] && typeof msg.message[k] === 'object' && 'contextInfo' in msg.message[k]);
                if (subObjKey) {
                  contextInfo = msg.message[subObjKey].contextInfo;
                }
              }
              
              if (contextInfo && contextInfo.quotedMessage) {
                const quotedText = getQuotedMessageText(contextInfo.quotedMessage);
                if (quotedText && quotedText.trim()) {
                  // Tentukan pengirim pesan yang di-slide
                  const participant = contextInfo.participant || contextInfo.remoteJid;
                  const myNormalizedJid = sock?.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : '';
                  const senderNormalizedJid = participant ? participant.split(':')[0] + '@s.whatsapp.net' : '';
                  
                  let prefix = 'Membalas';
                  if (myNormalizedJid && senderNormalizedJid) {
                    if (myNormalizedJid === senderNormalizedJid) {
                      prefix = 'Membalas pesan AI/bot';
                    } else {
                      prefix = 'Membalas pesannya sendiri';
                    }
                  }
                  
                  text = `[${prefix}: "${quotedText.trim()}"]\n${text}`;
                }
              }
            } catch (err) {
              console.log('[QuotedMessage] Gagal mengekstrak konteks quoted:', err.message);
            }

            // ========================================================
            // VOICE NOTE TRANSCRIBER (GROQ WHISPER)
            // ========================================================
            if (!text && msg.message?.audioMessage) {
              try {
                console.log('[VoiceNote] Mendeteksi Voice Note, mencoba transkrip...');
                const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                const stream = await downloadContentFromMessage(
                  msg.message.audioMessage,
                  'audio'
                );
                let buffer = Buffer.from([]);
                for await(const chunk of stream) {
                  buffer = Buffer.concat([buffer, chunk]);
                }
                
                const fsModule = require('fs');
                const pathModule = require('path');
                const childProcess = require('child_process');
                const tmpPath = pathModule.resolve(process.cwd(), 'memory', `vn_${Date.now()}.ogg`);
                fsModule.writeFileSync(tmpPath, buffer);
                
                const keys = process.env.GROQ_API_KEY.split(',');
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                
                // Panggil Groq API menggunakan cURL agar stabil dan native
                console.log('[VoiceNote] Mengirim audio ke Groq Whisper API...');
                const curlCmd = `curl -s -X POST https://api.groq.com/openai/v1/audio/transcriptions \\
                  -H "Authorization: Bearer ${randomKey}" \\
                  -H "Content-Type: multipart/form-data" \\
                  -F "file=@${tmpPath}" \\
                  -F "model=whisper-large-v3"`;
                
                const output = childProcess.execSync(curlCmd, { encoding: 'utf8' });
                const json = JSON.parse(output);
                
                fsModule.unlinkSync(tmpPath); // Bersihkan file temporary
                
                if (json && json.text) {
                  console.log('[VoiceNote] Transkrip sukses:', json.text);
                  // Bot otomatis membalas transkrip ke pengirim agar mereka juga lihat
                  await sock.sendMessage(jid, { text: `🎙️ *[Transkrip VN]:*\n\n"${json.text.trim()}"` }, { quoted: msg });
                  
                  // Jadikan hasil transkrip sebagai 'text' agar diproses oleh AI bot layaknya chat biasa!
                  text = `[Konteks: Ini adalah pesan suara/voice note yang telah ditranskrip menjadi teks] ${json.text.trim()}`;
                } else {
                  console.error('[VoiceNote] Gagal transkrip:', json);
                }
              } catch (e) {
                console.error('[VoiceNote] Error:', e.message);
              }
            }
            // ========================================================


            if (
              !text.trim()
            ) {

              console.log(
                '⏭️ Pesan tanpa teks diabaikan'
              );

              continue;
            }

            console.log(
              `\n📩 ${jid}: ${text}`
            );

            // ========================================================
            // AUTO CONTACT SAVER & MEMORY UPDATE
            // ========================================================
            try {
              if (msg.pushName && typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')) {
                const fs = await import('fs');
                const contactsPath = './contacts.json';
                let contacts = {};
                if (fs.existsSync(contactsPath)) {
                  try { contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8')); } catch(e){}
                }
                const nameKey = msg.pushName.toLowerCase();
                // Avoid overwriting if they exist (or update if different)
                if (contacts[nameKey] !== jid) {
                  contacts[nameKey] = jid;
                  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));
                  console.log(`[AutoContact] Tersimpan: ${msg.pushName} -> ${jid}`);
                }

                // Save pushName in memory database for this JID
                const memoryData = loadMemory(jid);
                if (memoryData && memoryData.pushName !== msg.pushName) {
                  memoryData.pushName = msg.pushName;
                  saveMemory(jid, memoryData);
                  console.log(`[Memory] Updated pushName for ${jid}: ${msg.pushName}`);
                }
              }
            } catch (err) {
              console.log('[AutoContact] Gagal menyimpan kontak:', err.message);
            }

            // ========================================================
// V4_AUTOMATION_FINAL_HOOK
// ========================================================

try {
  if (
    v4Automation &&
    typeof v4Automation.processAutomationCommand === 'function'
  ) {
    const automationHandled =
      await v4Automation.processAutomationCommand(
        sock,
        jid,
        text
      );

    if (automationHandled) {
      console.log(
        `⏰ V4 automation handled: ${text}`
      );
      continue;
    }
  }
} catch (v4Err) {
  console.log(
    '⚠️ V4 automation hook error:',
    v4Err.message
  );
}

// Commands
            // ============================================================
// V4.3 IDENTITY COMMAND
// ============================================================

if (
  text.trim().toLowerCase() === '/identity'
) {
  let info = null;

  try {
    info =
      identityV43?.getIdentity
        ? identityV43.getIdentity(
            msg.key.remoteJid
          )
        : null;
  } catch {}

  const stats =
    identityV43?.getIdentityStats
      ? identityV43.getIdentityStats()
      : null;

  await sock.sendMessage(
    jid,
    {
      text:
`🆔 IDENTITY V4.3

Raw:
${msg.key.remoteJid}

Canonical:
${info?.canonical || jid}

Type:
${info?.type || 'UNKNOWN'}

LID mappings:
${stats?.mappings ?? 0}

Identities:
${stats?.identities ?? 0}

🤖 Identity Layer: ON`
    }
  );

  console.log(
    `🆔 Identity diagnostic: ${msg.key.remoteJid} → ${jid}`
  );

  continue;
}

const commandHandled =
              await handleCommand(
                sock,
                jid,
                text
              );

            if (
              commandHandled
            ) {
              continue;
            }

            if (
              !botEnabled
            ) {

              console.log(
                '🔴 Bot OFF'
              );

              continue;
            }

            // ============================================================
            // FEATURE: EMOJI REACTION (Anti-Curiga: manusia kadang cuma react, tidak balas)
            // Peluang 10% untuk memberikan react emoji pada pesan yang sangat singkat atau lucu
            // ============================================================
            const msgForReaction = msg;
            const shouldReact = Math.random() < 0.10 && text.length < 20 && text.length > 1;
            if (shouldReact) {
              const reactionEmojis = ['😂', '❤️', '😭', '🔥', '👍', '😁', '🥲'];
              const chosenEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
              try {
                await sock.sendMessage(jid, {
                  react: {
                    text: chosenEmoji,
                    key: msgForReaction.key
                  }
                });
                console.log(`❤️ Reaction: ${chosenEmoji} dikirim ke ${jid}`);
              } catch (e) {
                console.error('❌ Gagal react:', e.message);
              }
            }

            // ============================================================
            // FEATURE: VISION (Membaca isi foto/gambar yang dikirim user)
            // ============================================================
            let visionContext = '';
            const hasImage = msg.message?.imageMessage;
            const hasVideo = msg.message?.videoMessage;
            if (hasImage || hasVideo) {
              try {
                const { downloadMediaMessage } = require('@whiskeysockets/baileys');
                console.log(`📸 Vision: Mendeteksi gambar dari ${jid}, mengunduh...`);
                const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage });
                const base64 = buffer.toString('base64');
                const mimeType = hasImage ? (msg.message.imageMessage.mimetype || 'image/jpeg') : 'video/mp4';
                
                // Gunakan Gemini untuk melihat gambar
                const { GoogleGenAI } = require('@google/genai');
                const visionKey = (process.env.GEMINI_API_KEY || '').split(',')[0].trim();
                const visionAI = new GoogleGenAI({ apiKey: visionKey });
                const visionResult = await visionAI.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: [{
                    parts: [
                      { text: 'Deskripsikan isi gambar ini dengan singkat dan natural dalam bahasa Indonesia/Jawa. Fokus pada objek utama, suasana, dan hal menarik. Maksimal 2 kalimat.' },
                      { inlineData: { mimeType, data: base64 } }
                    ]
                  }]
                });
                visionContext = `[Gambar yang dikirim user: "${visionResult.text?.trim()}"]`;
                console.log(`📸 Vision Result: ${visionContext}`);
              } catch (visionErr) {
                console.error('❌ Vision gagal:', visionErr.message);
                visionContext = '[User mengirim gambar/foto]';
              }
            }

            // ============================================================
            // FEATURE: DYNAMIC RELATIONSHIP LEVEL
            // Analisis 10 chat terakhir untuk mengatur "suhu" keakraban
            // ============================================================
            let relationshipWarmthHint = '';
            try {
              const memData = loadMemory(jid);
              const recentChats = (memData.shortTerm || []).slice(-10);
              const userMsgs = recentChats.filter(m => m.role === 'user');
              const avgLen = userMsgs.length > 0 ? userMsgs.reduce((a, b) => a + (b.text || '').length, 0) / userMsgs.length : 0;
              const hasEmoji = userMsgs.some(m => /[\u{1F600}-\u{1F64F}]/u.test(m.text || ''));
              const hasLaughing = userMsgs.some(m => (m.text || '').includes('wkwk') || (m.text || '').includes('haha') || (m.text || '').includes('xixi'));
              
              if (avgLen < 8 && !hasLaughing) {
                relationshipWarmthHint = '[DINAMIKA: Lawan bicara sedang singkat/dingin. Turunkan tensi sedikit, jangan terlalu ekspresif, beri ruang.]';
              } else if (avgLen > 30 || (hasEmoji && hasLaughing)) {
                relationshipWarmthHint = '[DINAMIKA: Lawan bicara sedang ceria dan aktif! Naikkan energi, lebih santai, boleh sedikit menggoda/bercanda.]';
              } else {
                relationshipWarmthHint = '[DINAMIKA: Suasana normal/netral. Ikuti flow natural.]';
              }
            } catch (_) {}

            // Pisahkan: teks asli user (untuk memori) vs konteks sistem (untuk prompt AI saja)
            const userRealName = CONTACT_NAMES[jid] || msg.pushName || 'Seseorang';

            // Bangun metadata sistem (TIDAK masuk ke memori/history, hanya ke prompt)
            const systemMeta = [
              `[INFO SISTEM: Lawan bicara kamu saat ini bernama: ${userRealName}]`,
              visionContext || '',
              relationshipWarmthHint || ''
            ].filter(Boolean).join('\n');

            // Debounce & enqueue — kirim text asli saja
            debounceMessage(
              jid,
              text,
              async (
                contactJid,
                combinedText
              ) => {

                enqueue(
                  contactJid,
                  async () => {

                    await processMessage(
                      sock,
                      contactJid,
                      combinedText,
                      msg,
                      systemMeta
                    );

                  }
                );

              }
            );

          } catch (err) {

            console.error(
              '❌ Message handler error:',
              err.message
            );
          }
        }
      }
    );

  } catch (err) {

    console.error(
      '❌ startBot error:',
      err.message
    );

    currentSocket =
      null;

    setTimeout(
      () => {

        startBot()
          .catch(
            console.error
          );

      },
      10000
    );
  }
}

// ============================================================
// GLOBAL ERROR PROTECTION
// ============================================================

process.on(
  'uncaughtException',
  err => {

    console.error(
      '🚨 uncaughtException:',
      err.stack || err.message
    );
  }
);

process.on(
  'unhandledRejection',
  err => {

    console.error(
      '🚨 unhandledRejection:',
      err?.message ||
      err
    );
  }
);

// ============================================================
// START
// ============================================================

console.log(`
╔══════════════════════════════════════╗
║       WA BOT — V3 MEMORY             ║
╚══════════════════════════════════════╝

📁 Session: ${SESSION_DIR}
🧠 Memory: ${MEMORY_DIR}

🤖 Bot default: ON
👥 Whitelist: ${ALLOWED_CONTACTS.length} kontak

🛡️ Anti-spam: ON
⏱️ Debounce: ON
📦 Queue: ON
🔁 Gemini retry: ON
⌨️ Typing indicator: ON

🧠 Persistent memory: ON
📝 Context summary: ON
💾 Memory per contact: ON

Commands:
 /bot on
 /bot off
 /status
 /memory
 /reset

⚠️ auth-v7 TIDAK akan dihapus otomatis.
`);

if (require.main === module) {
  startBot().catch(console.error);
} else {
  // Export for E2E testing
  module.exports = {
    generateReply,
    updateMemoryFromConversation,
    loadMemory,
    saveMemory,
    getPersonalityProfile,
    resolveMemoryConflicts,
    applyMemoryDecayV92,
    addConversation
  };
}
