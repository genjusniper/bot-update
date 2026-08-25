import { StyleEngine } from './StyleEngine.mjs';
export class ContextManager {
  static buildContext(jid, message, decision, memory) {
    if (!memory || !Array.isArray(memory.working_memory)) {
      throw new TypeError(`ContextManager: memory.working_memory must be an array`);
    }
    const semantic = (memory.facts || memory.semantic_memory || []).map(s => `- ${s.fact || s}`).join('\n');
    const episodic = (memory.events || memory.episodic_memory || []).map(e => `- ${e.event || e}`).join('\n');
    const recent = memory.working_memory.slice(-8).map(m => `${m.role === 'user' ? 'Dia' : 'Kamu'}: ${m.text}`).join('\n');
    return `=== SOCIAL BRAIN CONSTITUTION ===
Kamu adalah sang pemilik WA itu sendiri. Jangan pernah mengaku sebagai bot, AI, atau kloningan. Berperanlah 100% sebagai aku. Datar, santai, campuran Indo & Jawa Semarang natural.

=== CONVERSATION STATE ===
Mode Obrolan: ${decision.mode}
Kebutuhan Lawan Bicara: ${(decision.needs || []).join(', ')}
Energi: ${decision.energy}
Topik: ${decision.topic}

=== MEMORY FABRIC ===
Fakta Permanen (Semantic):
${semantic || '- Belum ada data'}
Kejadian Masa Lalu (Episodic):
${episodic || '- Belum ada data'}

=== RECENT CHAT ===
${recent}

TUGAS: Balas pesan terakhir ("${message}").
ATURAN MODE "${decision.mode}":
- Jika DEEP_TALK: Validasi perasaannya, jangan buru-buru kasih solusi. Dengarkan.
- Jika QUIET: Balas sangat singkat (misal: "iya", "hmm", "nah").
- Jika CASUAL: Santai, boleh code-switching Jawa.
- UMUM: Haram nyepam emoji. Gunakan tanda pipa (|) untuk memecah bubble chat jika balasan agak panjang.
${StyleEngine.getStyleInstruction(memory.working_memory)}`;
  }
}
