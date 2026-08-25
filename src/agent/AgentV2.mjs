import { IntentEngine } from '../perception/Intent.mjs';
import { DecisionEngine } from './DecisionEngine.mjs';
import { ContextManager } from './ContextManager.mjs';
import { ResponseEngine } from './ResponseEngine.mjs';
import { MemoryStore } from '../memory/MemoryStore.mjs';
import { EventBus } from '../events/EventBus.mjs';
import { StateManager } from '../conversation/StateManager.mjs';

export class AgentV2 {
  constructor(aiGateway) { this.aiGateway = aiGateway; }

  async processMessage(jid, message, memory, unifiedMsg) {
    StateManager.setProcessing(jid);
    
    if (message.trim().toLowerCase() === '/stats') {
        const os = await import('os');
        const memoryUsage = process.memoryUsage();
        const stats = `📊 *SYSTEM ANALYTICS*\n\n` +
        `*Uptime:* ${(process.uptime() / 3600).toFixed(2)} Jam\n` +
        `*RAM Usage:* ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB\n` +
        `*CPU Load:* ${os.loadavg()[0].toFixed(2)}\n` +
        `*Platform:* ${os.platform()} (${os.arch()})\n` +
        `*Status:* ✅ ONLINE (P2 MEGA ARCHITECTURE)`;
        StateManager.setIdle(jid);
        return { action: 'reply', chunks: [stats] };
    }
    
    // PERMISSION LAYER & AGENTIC TOOLS
    if (memory.pendingTool) {
        const { tool, args } = memory.pendingTool;
        memory.pendingTool = null; 
        MemoryStore.save(jid, memory);
        
        if (typeof message === 'string' && message.toLowerCase().trim() === 'ya') {
            EventBus.emit('tool.started', { chatId: jid, tool: tool });
            let result = '';
            try {
                if (tool === 'shell') {
                    const { exec } = await import('child_process');
                    result = await new Promise(r => exec(args, (err, out, errOut) => r(out || errOut || err?.message || 'Executed.')));
                } else if (tool === 'read_file') {
                    const fs = await import('fs');
                    result = fs.readFileSync(args.trim(), 'utf8');
                } else if (tool === 'write_file') {
                    const fs = await import('fs');
                    const parts = args.split('|');
                    const path = parts[0].trim();
                    const content = parts.slice(1).join('|');
                    fs.writeFileSync(path, content);
                    result = 'Berhasil menulis ke ' + path;
                } else {
                    result = 'Tool tidak dikenali: ' + tool;
                }
            } catch(e) {
                result = 'Error saat eksekusi tool: ' + e.message;
            }
            EventBus.emit('tool.finished', { chatId: jid, result: result });
            message = `[SYSTEM: Tool "${tool}" selesai. Hasil:]\n${result.substring(0, 4000)}\n\nTugas AI: Jelaskan hasil ini ke user.`;
        } else {
            message = `[SYSTEM: User MEMBATALKAN aksi ${tool}.] ${message}`;
        }
    }

    // VISION / MULTIMODAL LAYER
    let aiInput = message;
    if (unifiedMsg && unifiedMsg.media) {
        let b64 = unifiedMsg.media.data;
        if (b64 && typeof b64 === 'object' && b64.type === 'Buffer' && Array.isArray(b64.data)) {
            b64 = Buffer.from(b64.data).toString('base64');
        } else if (Buffer.isBuffer(b64)) {
            b64 = b64.toString('base64');
        }
        
        if (b64 && typeof b64 === 'string' && b64.length > 0) {
            aiInput = [
                { inlineData: { data: b64, mimeType: unifiedMsg.media.mimetype } },
                message ? message : "Tolong jelaskan media (gambar/audio/dokumen) ini."
            ];
        } else {
            console.warn('[DEBUG-MEDIA] b64 is empty or not string. Dropping media payload!');
        }
        EventBus.emit('message.media', { chatId: jid, mimetype: unifiedMsg.media.mimetype });
    }
    
    // LOCAL RAG / URL INGESTION
    let msgTextRAG = Array.isArray(aiInput) ? aiInput[1] : aiInput;
    if (typeof msgTextRAG === 'string') {
        const urlMatch = msgTextRAG.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
            try {
                const html = await fetch(urlMatch[0]).then(r => r.text());
                const text = html.replace(/<[^>]*>?/gm, '').substring(0, 3000); 
                msgTextRAG += "\n\n[Isi Website dari " + urlMatch[0] + "]:\n" + text;
                if (Array.isArray(aiInput)) aiInput[1] = msgTextRAG;
                else aiInput = msgTextRAG;
            } catch(e) {}
        }
    }
    
    const intent = await IntentEngine.analyze(this.aiGateway, aiInput, memory.working_memory);
    EventBus.emit('intent.detected', { chatId: jid, intent });
    if (StateManager.getState(jid).isInterrupted) { StateManager.setIdle(jid); return { action: 'interrupted' }; }
    
    const decision = await DecisionEngine.evaluate(intent, message, jid);
    if (StateManager.getState(jid).isInterrupted) { StateManager.setIdle(jid); return { action: 'interrupted' }; }
    
    if (decision.route === 'SILENT') { StateManager.setIdle(jid); return { action: 'silent' }; }
    
    // TOOL ROUTER
    if (decision.route === 'USE_TOOL') { 
        StateManager.setIdle(jid); 
        memory.pendingTool = { tool: decision.tool, args: decision.args };
        MemoryStore.save(jid, memory);
        EventBus.emit('tool.requested', { chatId: jid, tool: decision.tool });
        return { 
            action: 'reply', 
            chunks: [`[⚠️ SYSTEM PERMISSION]\nAI meminta izin:\nTool: *${decision.tool}*\nTarget: ${decision.args}\n\nBalas "ya" untuk mengizinkan.`]
        };
    }
    
    const prompt = ContextManager.buildContext(jid, message, decision, memory);
    
    let finalPrompt = prompt;
    if (Array.isArray(aiInput)) {
        if (aiInput[0] && aiInput[0].inlineData && aiInput[0].inlineData.data && aiInput[0].inlineData.data.length > 0) {
            finalPrompt = [
                { inlineData: aiInput[0].inlineData },
                prompt + "\n\n[Media terlampir dari user. Berikan respons sesuai konteks media tersebut.]"
            ];
        } else {
            console.warn('[Payload Validator] ⚠️ Dropped malformed media payload. Reverting to text-only prompt.');
            finalPrompt = prompt; 
        }
    }

    let reply = await ResponseEngine.generateReply(this.aiGateway, finalPrompt);
    
    try {
      const replyText = reply.text.join(' ');
      const confidence = StyleEngine.evaluateConfidence(replyText, memory.working_memory);
      console.log(`[StyleEngine] Response Style Confidence: ${confidence.toFixed(2)}`);
      
      // Emit style confidence metric to EventBus
      EventBus.publish('style_confidence', {
        chatId: jid,
        confidence,
        text: replyText
      });

      if (confidence < 0.6 && reply.provider !== 'local-fallback') {
        console.warn(`[StyleEngine] ⚠️ Low confidence (${confidence.toFixed(2)}). Regenerating response once for better Semarang styling...`);
        const retryReply = await ResponseEngine.generateReply(this.aiGateway, finalPrompt);
        const retryText = retryReply.text.join(' ');
        const retryConfidence = StyleEngine.evaluateConfidence(retryText, memory.working_memory);
        console.log(`[StyleEngine] Retried Response Style Confidence: ${retryConfidence.toFixed(2)}`);
        if (retryConfidence > confidence) {
          reply = retryReply;
        }
      }
    } catch(e) {
      console.error('[StyleEngine] Evaluation Error:', e.message);
    }
    
    EventBus.emit('response.generated', { chatId: jid });
    if (StateManager.getState(jid).isInterrupted) { StateManager.setIdle(jid); return { action: 'interrupted' }; }

    let textToConsolidate = message;
    if (Array.isArray(aiInput)) textToConsolidate = "[Kirim Gambar] " + message;
    this.consolidateMemory(jid, memory, textToConsolidate, reply.text.join(' ')).catch(console.error);

    StateManager.setIdle(jid);
    return { action: 'reply', chunks: reply.text, delayMs: reply.delayMs, should_quote: intent?.should_quote || false };
  }

  async consolidateMemory(jid, memory, lastMessage, lastReply) {
    const prompt = "Ekstrak memori & project dari chat ini:\nUser: " + lastMessage + "\nBot: " + lastReply + "\nKeluarkan JSON murni: { \"new_semantic\": [\"fakta stabil user\"], \"new_episodic\": [{ \"event\": \"kejadian spesifik\", \"status\": \"ongoing/resolved\" }], \"project_updates\": { \"name\": \"nama project jika ada\", \"todo\": [\"tugas baru\"], \"blockers\": [\"kendala\"] } }";
    try {
      const res = await this.aiGateway.generate(prompt, { temperature: 0.1, responseMimeType: "application/json" });
      let raw = res.response.replace(/^```json/im, '').replace(/^```/im, '').replace(/```$/m, '').trim();
      const match = raw.match(/\{[\s\S]*\}/);
      const data = JSON.parse(match ? match[0] : raw);
      let updated = false;
      if (data.new_semantic && data.new_semantic.length > 0) {
        memory.semantic_memory.push(...data.new_semantic.map(f => ({ fact: f, timestamp: Date.now() })));
        updated = true;
      }
      if (data.new_episodic && data.new_episodic.length > 0) {
        memory.episodic_memory.push(...data.new_episodic.map(e => ({ event: e.event, status: e.status, timestamp: Date.now() })));
        updated = true;
      }
      
      if (!memory.projects) memory.projects = {};
      if (data.project_updates && data.project_updates.name) {
        const p = data.project_updates;
        if (!memory.projects[p.name]) memory.projects[p.name] = { status: 'active', todo: [], blockers: [] };
        if (p.todo && p.todo.length > 0) memory.projects[p.name].todo.push(...p.todo);
        if (p.blockers && p.blockers.length > 0) memory.projects[p.name].blockers.push(...p.blockers);
        updated = true;
      }
      if (updated) MemoryStore.save(jid, memory);
    } catch (e) {}
  }
}