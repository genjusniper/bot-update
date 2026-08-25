import fs from 'fs';
import path from 'path';

export const SystemReadFileTool = {
  name: 'read_file',
  category: 'system',
  permissionLevel: 'AUTO',
  description: 'Membaca isi file di server (misalnya membaca index.js, package.json, atau error log).',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'Path relatif atau absolut ke file (contoh: "index.js" atau "src/tools/web/WebSearchTool.mjs").' }
    },
    required: ['filePath']
  },
  async execute(args, context) {
    if (!context || !context.userId) return { success: false, error: 'User ID missing' };
    const OWNER_JID = process.env.OWNER_NUMBER || '6285600596826@s.whatsapp.net';
    if (context.userId !== OWNER_JID && context.userId !== '236322690191595@lid') {
      return { success: false, error: 'SECURITY ALERT: Unauthorized file access!' };
    }
    
    try {
      const fullPath = path.resolve(process.cwd(), args.filePath);
      if (!fs.existsSync(fullPath)) return { success: false, error: 'File tidak ditemukan: ' + args.filePath };
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      let out = content;
      if (out.length > 3000) {
        out = out.substring(0, 3000) + '\n...[TRUNCATED. FILE TERLALU BESAR]...';
      }
      return { success: true, content: out };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
