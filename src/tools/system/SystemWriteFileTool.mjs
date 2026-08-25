import fs from 'fs';
import path from 'path';

export const SystemWriteFileTool = {
  name: 'write_file',
  category: 'system',
  permissionLevel: 'AUTO',
  description: 'Menulis atau menimpa (overwrite) isi file di server dengan kode/teks baru. Sangat berguna untuk memperbaiki bug.',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'Path file yang mau ditulis (misal: "src/tools/test.js").' },
      content: { type: 'string', description: 'Isi konten file yang baru (akan menimpa keseluruhan file).' }
    },
    required: ['filePath', 'content']
  },
  async execute(args, context) {
    if (!context || !context.userId) return { success: false, error: 'User ID missing' };
    const OWNER_JID = process.env.OWNER_NUMBER || '6285600596826@s.whatsapp.net';
    if (context.userId !== OWNER_JID && context.userId !== '236322690191595@lid') {
      return { success: false, error: 'SECURITY ALERT: Unauthorized file access!' };
    }
    
    try {
      const fullPath = path.resolve(process.cwd(), args.filePath);
      fs.writeFileSync(fullPath, args.content, 'utf8');
      return { success: true, message: 'Berhasil menulis ' + args.content.length + ' karakter ke ' + args.filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
