import fs from 'fs';
import path from 'path';

export const MemoryManagerTool = {
  name: 'memory_manager',
  category: 'system',
  permissionLevel: 'AUTO',
  description: 'Mengingat atau melupakan fakta tentang pengguna (contoh: preferensi makanan, hobi, info penting). Gunakan tool ini HANYA jika pengguna memberitahukan fakta penting.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['remember', 'forget'], description: 'Tindakan (remember/forget).' },
      fact: { type: 'string', description: 'Fakta yang diingat.' }
    },
    required: ['action', 'fact']
  },
  async execute(args, context) {
    if (!context || !context.userId) return { success: false, error: 'User ID missing' };
    try {
      const memoryDir = path.resolve(process.cwd(), 'memory', 'users');
      if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
      
      const userMemPath = path.join(memoryDir, `${context.userId.split('@')[0]}.json`);
      let facts = [];
      if (fs.existsSync(userMemPath)) {
        facts = JSON.parse(fs.readFileSync(userMemPath, 'utf8'));
      }
      
      if (args.action === 'remember') {
        if (!facts.includes(args.fact)) facts.push(args.fact);
      } else if (args.action === 'forget') {
        facts = facts.filter(f => f !== args.fact);
      }
      
      fs.writeFileSync(userMemPath, JSON.stringify(facts, null, 2));
      return { success: true, message: `Fakta berhasil di-${args.action}. Total fakta: ${facts.length}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
