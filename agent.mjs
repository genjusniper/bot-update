#!/usr/bin/env node
/**
 * 🤖 AI Coding Agent V2 — wa-bot-v10
 * Slash commands: /fix /status /logs /backup /diff /test /restart /help
 * Mode: LOCAL (no AI) | FAST | SMART
 * Autonomous loop: max 5 iterasi per tugas
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const execAsync = promisify(exec);
const WORKDIR   = path.resolve('/data/data/com.termux/files/home/wa-bot-v10');
const LOG_OUT   = '/data/data/com.termux/files/home/.pm2/logs/wa-bot-v10-out.log';
const LOG_ERR   = '/data/data/com.termux/files/home/.pm2/logs/wa-bot-v10-error.log';
const BACKUP_DIR = path.join(WORKDIR, '.agent_backups');
const MAX_AUTO_ITER = 5;

// ── API keys rotation ─────────────────────────────────────────
const apiKeys  = (process.env.GEMINI_API_KEY || '').split(',').filter(Boolean);
let   keyIndex = 0;
function getClient(smart = false) {
  const key   = apiKeys[keyIndex++ % apiKeys.length];
  const model = smart ? 'gemini-2.5-pro' : 'gemini-3.6-flash';
  return { client: new GoogleGenAI({ apiKey: key }), model };
}

// ── Color helpers ─────────────────────────────────────────────
const c = {
  reset : '\x1b[0m',
  cyan  : '\x1b[36m',
  yellow: '\x1b[33m',
  green : '\x1b[32m',
  red   : '\x1b[31m',
  gray  : '\x1b[90m',
  bold  : '\x1b[1m',
};
const log = {
  agent : (t) => console.log(`\n${c.yellow}🤖 Agent:${c.reset} ${t}`),
  tool  : (t) => console.log(`${c.gray}   🔧 ${t}${c.reset}`),
  ok    : (t) => console.log(`${c.green}   ✅ ${t}${c.reset}`),
  err   : (t) => console.log(`${c.red}   ❌ ${t}${c.reset}`),
  info  : (t) => console.log(`${c.cyan}   ℹ  ${t}${c.reset}`),
};

// ═══════════════════════════════════════════════════════════════
// TOOLS
// ═══════════════════════════════════════════════════════════════

function safePath(p) {
  const full = path.resolve(WORKDIR, p);
  if (!full.startsWith(WORKDIR)) throw new Error('Akses di luar wa-bot-v10 diblokir');
  return full;
}

const tools = {
  // Baca file (maks 8000 karakter)
  async readFile(p, from = 0, to = 200) {
    const full = safePath(p);
    if (!fs.existsSync(full)) return `File tidak ada: ${p}`;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    return lines.slice(from, to).map((l,i) => `${from+i+1}: ${l}`).join('\n').slice(0, 8000);
  },

  // Grep (LOCAL — tidak perlu AI)
  async grep(pattern, filePath = '.') {
    const full = safePath(filePath);
    try {
      const { stdout } = await execAsync(
        `grep -rn "${pattern}" "${full}" --include="*.js" --include="*.mjs" 2>/dev/null | head -40`
      );
      return stdout || '(tidak ditemukan)';
    } catch { return '(tidak ditemukan)'; }
  },

  // List file
  async listFiles(dir = '.') {
    const full = safePath(dir);
    const { stdout } = await execAsync(
      `find "${full}" -maxdepth 3 -type f \\( -name "*.js" -o -name "*.mjs" -o -name "*.json" \\) 2>/dev/null | head -50`
    );
    return stdout || '(kosong)';
  },

  // Backup file sebelum edit
  backupFile(p) {
    const full = safePath(p);
    if (!fs.existsSync(full)) return null;
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const ts   = Date.now();
    const dest = path.join(BACKUP_DIR, `${path.basename(p)}.${ts}.bak`);
    fs.copyFileSync(full, dest);
    return dest;
  },

  // Edit file (dengan backup otomatis + diff preview)
  editFile(p, oldText, newText, dryRun = false) {
    const full = safePath(p);
    if (!fs.existsSync(full)) return { ok: false, msg: `File tidak ada: ${p}` };
    const content = fs.readFileSync(full, 'utf8');
    if (!content.includes(oldText)) return { ok: false, msg: `Teks target tidak ditemukan di ${p}` };

    // Tampilkan diff
    const diff = [
      `\n📝 ${c.bold}${p}${c.reset}`,
      oldText.split('\n').map(l => `${c.red}- ${l}${c.reset}`).join('\n'),
      newText.split('\n').map(l => `${c.green}+ ${l}${c.reset}`).join('\n'),
    ].join('\n');
    console.log(diff);

    if (dryRun) return { ok: true, msg: 'DRY RUN — tidak ada perubahan.', diff };

    const backupPath = tools.backupFile(p);
    const updated    = content.replace(oldText, newText);
    fs.writeFileSync(full, updated);
    return { ok: true, msg: `✅ ${p} diedit. Backup: ${backupPath}`, diff };
  },

  // Rollback ke backup terakhir
  rollback(p) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const base    = path.basename(p);
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith(base) && f.endsWith('.bak'))
      .sort();
    if (!backups.length) return 'Tidak ada backup ditemukan.';
    const latest = path.join(BACKUP_DIR, backups[backups.length - 1]);
    fs.copyFileSync(latest, safePath(p));
    return `✅ Rollback berhasil dari ${latest}`;
  },

  // Tulis file baru
  writeFile(p, content) {
    const full = safePath(p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
    return `✅ File ${p} dibuat.`;
  },

  // Cek syntax Node.js
  syntaxCheck(p) {
    const full = safePath(p);
    try {
      execSync(`node --check "${full}" 2>&1`, { stdio: 'pipe' });
      return { ok: true, msg: `✅ Syntax ${p} bersih.` };
    } catch(e) {
      return { ok: false, msg: `❌ Syntax error:\n${e.stdout?.toString() || e.message}` };
    }
  },

  // Baca log
  async readLog(lines = 40) {
    const readTail = (f, n) => {
      try { return execSync(`tail -n ${n} "${f}" 2>/dev/null`).toString(); } catch { return ''; }
    };
    return `=OUT=\n${readTail(LOG_OUT, lines)}\n=ERR=\n${readTail(LOG_ERR, 15)}`;
  },

  // Jalankan command (aman)
  async run(cmd, confirm = false) {
    const safe = /^(pm2 (list|status|show|logs)|node --check|cat |ls |grep |tail |head |wc |npm test)/.test(cmd);
    const danger = /^(pm2 (restart|stop|start|delete|kill)|npm (install|uninstall|ci)|rm |mv )/.test(cmd);

    if (danger && !confirm) return `⚠️ Butuh konfirmasi: ketik "confirm: ${cmd}"`;
    if (!safe && !danger && !confirm) return `⚠️ Command tidak dikenal aman: ketik "confirm: ${cmd}"`;

    try {
      const { stdout, stderr } = await execAsync(`cd "${WORKDIR}" && ${cmd}`, { timeout: 30000 });
      return stdout || stderr || '(selesai)';
    } catch(e) { return `❌ ${e.message}`; }
  },
};

// ═══════════════════════════════════════════════════════════════
// SLASH COMMANDS (LOCAL — tanpa AI)
// ═══════════════════════════════════════════════════════════════

async function handleSlash(input) {
  const [cmd, ...args] = input.trim().split(/\s+/);

  // /status — cek kesehatan bot
  if (cmd === '/status') {
    const pm2     = await tools.run('pm2 list', true);
    const pm2OK   = pm2.includes('online');
    const idxOK   = fs.existsSync(path.join(WORKDIR, 'index.js'));
    const memOK   = fs.existsSync(path.join(WORKDIR, 'memory'));
    const envOK   = (process.env.GEMINI_API_KEY || '').length > 10;
    const ramRaw  = execSync('cat /proc/meminfo | grep MemAvailable').toString();
    const ramMB   = Math.round(parseInt(ramRaw.match(/\d+/)[0]) / 1024);

    console.log(`
${c.bold}🩺 Health Check${c.reset}
  ${pm2OK ? '🟢' : '🔴'} PM2 Bot     ${pm2OK ? 'Online' : 'Offline'}
  ${idxOK ? '🟢' : '🔴'} index.js    ${idxOK ? 'Ada' : 'Tidak ditemukan!'}
  ${memOK ? '🟢' : '🔴'} Memory dir  ${memOK ? 'Ada' : 'Tidak ditemukan!'}
  ${envOK ? '🟢' : '🔴'} Gemini Key  ${envOK ? 'OK' : 'Kosong!'}
  📦 RAM bebas  ${ramMB} MB
    `);
    return true;
  }

  // /logs — baca log terbaru
  if (cmd === '/logs') {
    const n = parseInt(args[0]) || 40;
    const logData = await tools.readLog(n);
    log.info(`Log ${n} baris terakhir:\n${c.gray}${logData}${c.reset}`);
    return true;
  }

  // /test — syntax check + npm test
  if (cmd === '/test') {
    const targets = args.length ? args : ['index.js'];
    for (const t of targets) {
      const r = tools.syntaxCheck(t);
      r.ok ? log.ok(r.msg) : log.err(r.msg);
    }
    return true;
  }

  // /restart — restart PM2
  if (cmd === '/restart') {
    log.tool('Merestart wa-bot-v10...');
    const r = await tools.run('pm2 restart wa-bot-v10', true);
    log.ok(r);
    return true;
  }

  // /backup — backup file
  if (cmd === '/backup') {
    const file = args[0] || 'index.js';
    const dest = tools.backupFile(file);
    dest ? log.ok(`Backup disimpan: ${dest}`) : log.err('Gagal backup.');
    return true;
  }

  // /rollback — rollback file ke backup terakhir
  if (cmd === '/rollback') {
    const file = args[0] || 'index.js';
    log.ok(tools.rollback(file));
    return true;
  }

  // /grep — cari pattern tanpa AI
  if (cmd === '/grep') {
    const [pattern, dir] = args;
    if (!pattern) { log.err('Usage: /grep <pattern> [dir]'); return true; }
    const r = await tools.grep(pattern, dir || '.');
    console.log(c.gray + r + c.reset);
    return true;
  }

  // /diff — lihat daftar backup
  if (cmd === '/diff') {
    if (!fs.existsSync(BACKUP_DIR)) { log.info('Belum ada backup.'); return true; }
    const files = fs.readdirSync(BACKUP_DIR).slice(-10);
    console.log(files.map(f => `  📄 ${f}`).join('\n'));
    return true;
  }

  // /help
  if (cmd === '/help') {
    console.log(`
${c.bold}📚 Daftar Perintah${c.reset}
  ${c.cyan}/status${c.reset}           Cek kesehatan bot (PM2, key, RAM)
  ${c.cyan}/logs [n]${c.reset}         Baca n baris log terakhir (default 40)
  ${c.cyan}/test [file]${c.reset}      Syntax check file
  ${c.cyan}/restart${c.reset}          Restart PM2 bot
  ${c.cyan}/backup [file]${c.reset}    Backup file sebelum diedit
  ${c.cyan}/rollback [file]${c.reset}  Rollback ke backup terakhir
  ${c.cyan}/grep <kata> [dir]${c.reset} Cari teks di kode (tanpa AI)
  ${c.cyan}/diff${c.reset}             Lihat daftar backup tersedia
  ${c.cyan}clear${c.reset}             Reset riwayat chat
  ${c.cyan}exit${c.reset}              Keluar

${c.bold}Mode AI:${c.reset}
  Tulis biasa   → Mode FAST (hemat, Gemini Flash)
  Awali "!!"    → Mode SMART (lebih dalam, Pro)
  /grep /test   → Mode LOCAL (0 API call)

${c.bold}Autonomous Fix:${c.reset}
  /fix <deskripsi masalah>  → Agent analisis→patch→test otomatis
    `);
    return true;
  }

  // /fix — autonomous debugger
  if (cmd === '/fix') {
    const problem = args.join(' ');
    if (!problem) { log.err('Usage: /fix <deskripsi masalah>'); return true; }
    await autonomousFix(problem);
    return true;
  }

  return false; // bukan slash command
}

// ═══════════════════════════════════════════════════════════════
// AUTONOMOUS FIX LOOP
// ═══════════════════════════════════════════════════════════════

async function autonomousFix(problem) {
  log.agent(`Mulai autonomous fix: "${problem}"`);
  log.info(`Maksimal ${MAX_AUTO_ITER} iterasi.`);

  let history = [];
  let iteration = 0;
  let fixed = false;

  while (iteration < MAX_AUTO_ITER && !fixed) {
    iteration++;
    console.log(`\n${c.bold}─── Iterasi ${iteration}/${MAX_AUTO_ITER} ───${c.reset}`);

    const systemPrompt = `Kamu adalah AI debugging agent untuk project wa-bot-v10 di Termux.
Tugasmu: analisis masalah, temukan kode yang rusak, dan perbaiki.

TOOLS tersedia:
[TOOL: READ_FILE] {"path": "..."} [/TOOL]
[TOOL: GREP] {"pattern": "...", "path": "..."} [/TOOL]
[TOOL: LIST_FILES] {"path": "..."} [/TOOL]
[TOOL: READ_LOG] {"lines": 40} [/TOOL]
[TOOL: SYNTAX_CHECK] {"path": "..."} [/TOOL]
[TOOL: EDIT_FILE] {"path": "...", "oldText": "...", "newText": "..."} [/TOOL]
[TOOL: DONE] {"success": true/false, "summary": "..."} [/TOOL]

Aturan:
- Selalu backup sebelum edit (sudah otomatis).
- Gunakan SYNTAX_CHECK setelah edit.
- Kalau sudah selesai atau menyerah, gunakan TOOL: DONE.
- Jangan berasumsi. Baca kode dulu.`;

    if (history.length === 0) {
      history.push({ role: 'user', parts: [{ text: `Masalah: ${problem}\nMulai investigasi.` }] });
    }

    try {
      const { client, model } = getClient(true); // pakai SMART mode
      const resp = await client.models.generateContent({
        model, systemInstruction: systemPrompt,
        contents: history,
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
      });

      const text = resp.text?.trim() || '';
      history.push({ role: 'model', parts: [{ text }] });

      // Jalankan semua tool dalam response
      const toolRegex = /\[TOOL:\s*(\w+)\]([\s\S]*?)\[\/TOOL\]/g;
      let match;
      let toolResults = '';

      while ((match = toolRegex.exec(text)) !== null) {
        const toolName = match[1].trim().toUpperCase();
        let params = {};
        try { params = JSON.parse(match[2].trim()); } catch {}

        log.tool(`${toolName}(${JSON.stringify(params).slice(0, 80)})`);

        let result = '';
        switch (toolName) {
          case 'READ_FILE':    result = await tools.readFile(params.path, params.from, params.to); break;
          case 'GREP':         result = await tools.grep(params.pattern, params.path); break;
          case 'LIST_FILES':   result = await tools.listFiles(params.path); break;
          case 'READ_LOG':     result = await tools.readLog(params.lines || 40); break;
          case 'SYNTAX_CHECK': {
            const r = tools.syntaxCheck(params.path);
            result = r.msg;
            break;
          }
          case 'EDIT_FILE': {
            const r = tools.editFile(params.path, params.oldText, params.newText);
            result = r.msg;
            if (!r.ok) log.err(r.msg);
            break;
          }
          case 'DONE': {
            fixed = params.success === true;
            const summary = params.summary || 'Selesai.';
            fixed ? log.ok(`FIX BERHASIL: ${summary}`) : log.err(`Menyerah: ${summary}`);
            return;
          }
          default: result = `Tool tidak dikenal: ${toolName}`;
        }

        const short = result.split('\n')[0].slice(0, 120);
        log.info(`→ ${short}`);
        toolResults += `\n[${toolName} RESULT]\n${result.slice(0, 3000)}\n[/RESULT]`;
      }

      if (toolResults) {
        history.push({ role: 'user', parts: [{ text: toolResults + '\nLanjutkan.' }] });
      } else {
        // Tidak ada tool call = AI bicara saja
        log.agent(text);
        break;
      }

    } catch (e) {
      log.err(`Error AI: ${e.message}`);
      keyIndex++;
    }
  }

  if (!fixed) log.err(`Autonomous fix berhenti di iterasi ${iteration}. Coba /fix lagi atau debug manual.`);
}

// ═══════════════════════════════════════════════════════════════
// AI CHAT (FAST / SMART)
// ═══════════════════════════════════════════════════════════════

let chatHistory = [];

const AGENT_SYSTEM = `Kamu adalah AI Coding Agent untuk project wa-bot-v10.
Kamu punya akses ke tools untuk membaca, mengedit, dan menguji kode.
Gaya bicaramu singkat, teknikal, dan langsung ke inti masalah.

TOOLS:
[TOOL: READ_FILE] {"path": "...", "from": 0, "to": 100} [/TOOL]
[TOOL: GREP] {"pattern": "...", "path": "."} [/TOOL]
[TOOL: LIST_FILES] {"path": "."} [/TOOL]
[TOOL: READ_LOG] {"lines": 30} [/TOOL]
[TOOL: SYNTAX_CHECK] {"path": "..."} [/TOOL]
[TOOL: EDIT_FILE] {"path": "...", "oldText": "...", "newText": "..."} [/TOOL]
[TOOL: WRITE_FILE] {"path": "...", "content": "..."} [/TOOL]`;

async function chat(userMsg, smart = false) {
  chatHistory.push({ role: 'user', parts: [{ text: userMsg }] });

  for (let i = 0; i < 8; i++) {
    try {
      const { client, model } = getClient(smart);
      const resp = await client.models.generateContent({
        model,
        systemInstruction: AGENT_SYSTEM,
        contents: chatHistory,
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
      });

      const text = resp.text?.trim() || '';
      const toolMatch = text.match(/\[TOOL:\s*(\w+)\]([\s\S]*?)\[\/TOOL\]/);

      if (!toolMatch) {
        chatHistory.push({ role: 'model', parts: [{ text }] });
        return text;
      }

      const toolName = toolMatch[1].trim().toUpperCase();
      let params = {};
      try { params = JSON.parse(toolMatch[2].trim()); } catch {}

      log.tool(`${toolName}(${JSON.stringify(params).slice(0, 80)})`);

      let result = '';
      switch (toolName) {
        case 'READ_FILE':    result = await tools.readFile(params.path, params.from, params.to); break;
        case 'GREP':         result = await tools.grep(params.pattern, params.path); break;
        case 'LIST_FILES':   result = await tools.listFiles(params.path); break;
        case 'READ_LOG':     result = await tools.readLog(params.lines); break;
        case 'SYNTAX_CHECK': result = tools.syntaxCheck(params.path).msg; break;
        case 'EDIT_FILE':    result = tools.editFile(params.path, params.oldText, params.newText).msg; break;
        case 'WRITE_FILE':   result = tools.writeFile(params.path, params.content); break;
        default:             result = `Tool tidak dikenal: ${toolName}`;
      }

      log.info(`→ ${result.split('\n')[0].slice(0, 100)}`);

      const before = text.slice(0, toolMatch.index).trim();
      chatHistory.push({ role: 'model', parts: [{ text: before || '...' }] });
      chatHistory.push({ role: 'user', parts: [{ text: `[${toolName} RESULT]\n${result.slice(0, 3000)}\n[/RESULT]` }] });

    } catch (e) {
      if (e.message?.includes('429')) { keyIndex++; continue; }
      return `❌ Error: ${e.message}`;
    }
  }
  return '⚠️ Batas iterasi tool tercapai.';
}

// ═══════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`
${c.bold}╔══════════════════════════════════════════╗
║  🤖 AI Coding Agent V2 — wa-bot-v10     ║
║  /help untuk daftar perintah            ║
║  !!pesan  → SMART mode (lebih dalam)    ║
║  /fix <masalah> → Auto-debug loop       ║
╚══════════════════════════════════════════╝${c.reset}
`);

function prompt() {
  rl.question(`\n${c.cyan}Kamu:${c.reset} `, async (input) => {
    input = input.trim();
    if (!input) return prompt();

    if (input === 'exit') { console.log('👋'); process.exit(0); }
    if (input === 'clear') { chatHistory = []; log.ok('Chat direset.'); return prompt(); }

    // Confirm dangerous command
    if (input.startsWith('confirm:')) {
      const cmd = input.slice(8).trim();
      const r = await tools.run(cmd, true);
      log.agent(r);
      return prompt();
    }

    // Slash commands (LOCAL / hybrid)
    if (input.startsWith('/')) {
      const handled = await handleSlash(input);
      if (!handled) log.err(`Perintah tidak dikenal. Ketik /help`);
      return prompt();
    }

    // SMART mode kalau diawali !!
    const smart = input.startsWith('!!');
    const msg   = smart ? input.slice(2).trim() : input;
    const mode  = smart ? `${c.bold}SMART${c.reset}` : 'FAST';

    process.stdout.write(`\n${c.yellow}🤖 Agent${c.reset} ${c.gray}[${mode}]${c.reset}: ...`);

    const reply = await chat(msg, smart);
    process.stdout.write('\r\x1b[K');
    log.agent(reply);

    prompt();
  });
}

prompt();
