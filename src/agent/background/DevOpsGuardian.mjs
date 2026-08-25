import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);
const OWNER_JID = '6285600596826@s.whatsapp.net';

export class DevOpsGuardian {
  constructor(sock, aiGateway) {
    this.sock = sock;
    this.aiGateway = aiGateway;
    this.lastCheckedTimestamp = Date.now();
    this.interval = null;
    this.memoryPath = path.resolve(process.cwd(), 'memory', 'devops_seen_errors.json');
    this.seenErrors = [];
    
    if (fs.existsSync(this.memoryPath)) {
      try { this.seenErrors = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8')); } catch (e) {}
    }
  }

  start() {
    console.log('[DevOpsGuardian] Agent diaktifkan. Memantau server setiap 2 menit.');
    // Run every 2 minutes
    this.interval = setInterval(() => this.scanLogs(), 2 * 60 * 1000);
    // Initial scan
    setTimeout(() => this.scanLogs(), 10000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  async scanLogs() {
    try {
      // 1. Fetch PM2 error logs
      const { stdout } = await execPromise('pm2 logs --lines 100 --err --nostream');
      if (!stdout) return;

      const lines = stdout.split('\n');
      const recentErrors = [];
      let currentErrorBlock = [];

      // Extract error stack traces or specific error keywords
      for (const line of lines) {
        if (line.match(/Error:|Exception:|❌|fail|crash|trace|EADDRINUSE/i) && !line.includes('DevOpsGuardian')) {
          recentErrors.push(line);
        }
      }

      if (recentErrors.length === 0) return;

      // Combine errors and check if we already handled them
      const errorText = recentErrors.join('\n').trim();
      if (!errorText) return;

      // Hash simple deduplication
      const errorHash = this.hashCode(errorText);
      if (this.seenErrors.includes(errorHash)) return;

      console.log('[DevOpsGuardian] MENDETEKSI ERROR BARU! Memanggil AI untuk analisa...');
      
      this.seenErrors.push(errorHash);
      if (this.seenErrors.length > 50) this.seenErrors.shift();
      fs.writeFileSync(this.memoryPath, JSON.stringify(this.seenErrors));

      // 2. Ask AI to analyze
      const prompt = `Kamu adalah Teknisi IT / DevOps Server. Sistem baru saja mendeteksi log error dari server Node.js PM2. 
Log Error:
"""
${errorText.substring(0, 1500)}
"""
Analisa log di atas. Jelaskan dengan bahasa gaul dan singkat ke bosmu apa penyebabnya, dan berikan solusi cara memperbaikinya. Awali pesan dengan 🚨 *ALERT SERVER CRASH/ERROR!*`;

      const aiResponse = await this.aiGateway.generate(prompt);
      
      // 3. Proactively alert the owner
      if (aiResponse && aiResponse.ok && aiResponse.response) {
        await this.sock.sendMessage(OWNER_JID, { text: aiResponse.response });
      }

    } catch (e) {
      console.error('[DevOpsGuardian] Gagal scan logs:', e.message);
    }
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return hash.toString();
  }
}
