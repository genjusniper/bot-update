// V15.1 Verification Suite — run from project root
import path from 'path';
import os from 'os';
import fs from 'fs';

let passed = 0, failed = 0;
const tests = [];

function test(name, fn) { tests.push({ name, fn }); }

async function runAll() {
    for (const { name, fn } of tests) {
        try {
            await fn();
            console.log('  PASS: ' + name);
            passed++;
        } catch (e) {
            console.log('  FAIL: ' + name + ' -- ' + e.message);
            failed++;
        }
    }
    console.log('\n' + '='.repeat(50));
    console.log('TOTAL: ' + (passed + failed) + ' | PASS: ' + passed + ' | FAIL: ' + failed);
    if (failed === 0) {
        console.log('ALL TESTS PASSED - V15.1 VERIFIED');
        process.exit(0);
    } else {
        console.log('Some tests failed');
        process.exit(1);
    }
}

// === [1] PersistentMemoryGraph ===
console.log('[1] PersistentMemoryGraph');
const tmpDb = path.join(os.tmpdir(), 'test_pmg_' + Date.now() + '.db');

test('PersistentMemoryGraph exports class + singleton', async () => {
    const mod = await import('../core/memory/PersistentMemoryGraph.mjs');
    if (!mod.PersistentMemoryGraph) throw new Error('Class not exported');
    if (!mod.persistentMemoryGraph) throw new Error('singleton not exported');
});

test('PersistentMemoryGraph: init with tmpDb', async () => {
    const { PersistentMemoryGraph } = await import('../core/memory/PersistentMemoryGraph.mjs');
    const g = new PersistentMemoryGraph({ dbPath: tmpDb });
    if (!g._ready) throw new Error('DB not ready');
    g.close();
});

test('PersistentMemoryGraph: addNode persists across instances', async () => {
    const { PersistentMemoryGraph } = await import('../core/memory/PersistentMemoryGraph.mjs');
    const g = new PersistentMemoryGraph({ dbPath: tmpDb });
    g.addNode({ id: 'persist_test', label: 'Persistent Node', type: 'FACT' });
    g.close();
    const g2 = new PersistentMemoryGraph({ dbPath: tmpDb });
    if (!g2.nodes.has('persist_test')) throw new Error('Node not persisted');
    g2.close();
});

test('PersistentMemoryGraph: addEdge persists across instances', async () => {
    const { PersistentMemoryGraph } = await import('../core/memory/PersistentMemoryGraph.mjs');
    const g = new PersistentMemoryGraph({ dbPath: tmpDb });
    g.addNode({ id: 'node_a', label: 'A', type: 'CONCEPT' });
    g.addNode({ id: 'node_b', label: 'B', type: 'CONCEPT' });
    const edge = g.addEdge({ sourceId: 'node_a', targetId: 'node_b', relation: 'LINKED', weight: 0.8 });
    g.close();
    const g2 = new PersistentMemoryGraph({ dbPath: tmpDb });
    if (!g2.edges.has(edge.id)) throw new Error('Edge not persisted');
    g2.close();
});

test('PersistentMemoryGraph: searchNodes', async () => {
    const { PersistentMemoryGraph } = await import('../core/memory/PersistentMemoryGraph.mjs');
    const g = new PersistentMemoryGraph({ dbPath: tmpDb });
    g.addNode({ id: 'srch1', label: 'Jakarta ibu kota', type: 'GEO' });
    const found = g.searchNodes('Jakarta');
    if (!found.some(n => n.id === 'srch1')) throw new Error('searchNodes failed');
    g.close();
});

test('PersistentMemoryGraph: getStorageStats', async () => {
    const { PersistentMemoryGraph } = await import('../core/memory/PersistentMemoryGraph.mjs');
    const g = new PersistentMemoryGraph({ dbPath: tmpDb });
    const stats = g.getStorageStats();
    if (typeof stats.nodes !== 'number') throw new Error('nodes missing');
    if (typeof stats.edges !== 'number') throw new Error('edges missing');
    if (typeof stats.ready !== 'boolean') throw new Error('ready missing');
    g.close();
});

test('PersistentMemoryGraph: compact returns number', async () => {
    const { PersistentMemoryGraph } = await import('../core/memory/PersistentMemoryGraph.mjs');
    const g = new PersistentMemoryGraph({ dbPath: tmpDb });
    const pruned = g.compact(1000);
    if (typeof pruned !== 'number') throw new Error('compact returned ' + typeof pruned);
    g.close();
});

// === [2] WebSearchEngine ===
console.log('[2] WebSearchEngine');

test('WebSearchEngine exports class + singleton', async () => {
    const mod = await import('../core/research/WebSearchEngine.mjs');
    if (!mod.WebSearchEngine) throw new Error('Class not exported');
    if (!mod.webSearchEngine) throw new Error('singleton not exported');
});

test('WebSearchEngine: instantiates, has search + getStats', async () => {
    const { WebSearchEngine } = await import('../core/research/WebSearchEngine.mjs');
    const ws = new WebSearchEngine({ groqApiKey: 'test' });
    if (typeof ws.search !== 'function') throw new Error('search missing');
    if (typeof ws.getStats !== 'function') throw new Error('getStats missing');
});

test('WebSearchEngine: getStats returns numbers', async () => {
    const { webSearchEngine } = await import('../core/research/WebSearchEngine.mjs');
    const stats = webSearchEngine.getStats();
    if (typeof stats.searches !== 'number') throw new Error('searches missing');
    if (typeof stats.failures !== 'number') throw new Error('failures missing');
});

test('WebSearchEngine: empty query returns valid object', async () => {
    const { WebSearchEngine } = await import('../core/research/WebSearchEngine.mjs');
    const ws = new WebSearchEngine({});
    const result = await ws.search('');
    if (typeof result !== 'object') throw new Error('Expected object');
    if (!Array.isArray(result.results)) throw new Error('Expected results array');
    if (typeof result.summary !== 'string') throw new Error('Expected summary string');
});

// === [3] ARKAIntegrationHub V15.1 ===
console.log('[3] ARKAIntegrationHub V15.1');

test('ARKAIntegrationHub: class + singleton exported', async () => {
    const mod = await import('../core/orchestration/ARKAIntegrationHub.mjs');
    if (!mod.ARKAIntegrationHub) throw new Error('Class missing');
    if (!mod.arkaIntegrationHub) throw new Error('singleton missing');
});

test('ARKAIntegrationHub: setAIGateway method exists', async () => {
    const { arkaIntegrationHub } = await import('../core/orchestration/ARKAIntegrationHub.mjs');
    if (typeof arkaIntegrationHub.setAIGateway !== 'function') throw new Error('setAIGateway missing');
});

test('ARKAIntegrationHub: setAIGateway sets gateway', async () => {
    const { arkaIntegrationHub } = await import('../core/orchestration/ARKAIntegrationHub.mjs');
    const mock = { generate: async () => ({ ok: true, text: 'hi' }) };
    arkaIntegrationHub.setAIGateway(mock);
    if (arkaIntegrationHub.aiGateway !== mock) throw new Error('Gateway not set correctly');
    arkaIntegrationHub.aiGateway = null; // reset
});

test('ARKAIntegrationHub: webSearch wired', async () => {
    const { arkaIntegrationHub } = await import('../core/orchestration/ARKAIntegrationHub.mjs');
    if (!arkaIntegrationHub.webSearch || typeof arkaIntegrationHub.webSearch.search !== 'function') {
        throw new Error('webSearch not wired');
    }
});

test('ARKAIntegrationHub: memoryGraph is PersistentMemoryGraph', async () => {
    const { arkaIntegrationHub } = await import('../core/orchestration/ARKAIntegrationHub.mjs');
    const { PersistentMemoryGraph } = await import('../core/memory/PersistentMemoryGraph.mjs');
    if (!(arkaIntegrationHub.memoryGraph instanceof PersistentMemoryGraph)) {
        throw new Error('memoryGraph not PersistentMemoryGraph');
    }
});

test('ARKAIntegrationHub: processIncomingMessage with mock LLM', async () => {
    const { ARKAIntegrationHub } = await import('../core/orchestration/ARKAIntegrationHub.mjs');
    const hub = new ARKAIntegrationHub();
    hub.setAIGateway({ generate: async (prompt) => ({ ok: true, text: 'mock: ' + prompt.slice(0, 20) }) });
    const result = await hub.processIncomingMessage({
        text: 'Halo ARKA, gimana cuaca hari ini?',
        senderJid: 'tester@s.whatsapp.net',
        chatId: 'tester@s.whatsapp.net',
        isGroup: false, userTier: 'NORMAL'
    });
    if (!result.handled) throw new Error('Not handled');
    if (!Array.isArray(result.bubbles) || result.bubbles.length === 0) throw new Error('No bubbles');
    if (!result.finalText) throw new Error('No finalText');
    if (result.stage !== 20) throw new Error('Stage not 20, got: ' + result.stage);
});

test('ARKAIntegrationHub: getHealthReport has memoryGraph + hasAIGateway', async () => {
    const { arkaIntegrationHub } = await import('../core/orchestration/ARKAIntegrationHub.mjs');
    const report = arkaIntegrationHub.getHealthReport();
    if (!report.memoryGraph) throw new Error('memoryGraph missing');
    if (typeof report.hasAIGateway !== 'boolean') throw new Error('hasAIGateway missing');
});

test('ARKAIntegrationHub: metrics has searchesTriggered', async () => {
    const { arkaIntegrationHub } = await import('../core/orchestration/ARKAIntegrationHub.mjs');
    if (typeof arkaIntegrationHub.metrics.searchesTriggered !== 'number') {
        throw new Error('searchesTriggered missing');
    }
});

// === [4] index_v15_QA.mjs patch ===
console.log('[4] index_v15_QA.mjs patch validation');

test('index_v15_QA: V15.1 banner', () => {
    const c = fs.readFileSync('index_v15_QA.mjs', 'utf8');
    if (!c.includes('V15.1')) throw new Error('Banner missing');
});

test('index_v15_QA: setAIGateway call', () => {
    const c = fs.readFileSync('index_v15_QA.mjs', 'utf8');
    if (!c.includes('arkaIntegrationHub.setAIGateway')) throw new Error('setAIGateway missing');
});

test('index_v15_QA: processIncomingMessage wired', () => {
    const c = fs.readFileSync('index_v15_QA.mjs', 'utf8');
    if (!c.includes('arkaIntegrationHub.processIncomingMessage')) throw new Error('processIncomingMessage missing');
});

test('index_v15_QA: personalAI.process fallback intact', () => {
    const c = fs.readFileSync('index_v15_QA.mjs', 'utf8');
    if (!c.includes('personalAI.process(')) throw new Error('fallback missing');
});

test('index_v15_QA: no syntax errors', async () => {
    const { execSync } = await import('child_process');
    execSync('node --check index_v15_QA.mjs');
});

runAll();
