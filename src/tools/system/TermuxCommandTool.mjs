import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

export const TermuxCommandTool = {
  name: 'run_termux_command',
  category: 'system',
  permissionLevel: 'AUTO',
  description: 'Mengeksekusi perintah shell/terminal di dalam server Termux (misalnya pm2 logs, ls, npm install, dll). HANYA BOLEH digunakan jika OWNER yang meminta eksekusi perintah sistem.',
  inputSchema: {
    type: 'object',
    properties: {
      command: { 
        type: 'string', 
        description: 'Perintah shell yang akan dijalankan di Termux (misal: ls -la, pm2 status, df -h)' 
      }
    },
    required: ['command']
  },
  async execute(args, context) {
    if (!context || !context.userId) {
      return { success: false, error: 'User ID tidak tersedia dalam konteks eksekusi.' };
    }

    // SECURITY CHECK: Hanya izinkan eksekusi jika pengirim adalah nomor ke-2 milik owner.
    const OWNER_JID = '6285600596826@s.whatsapp.net'; 
    const ALLOWED_LID = '236322690191595@lid'; // Jaga-jaga jika LID tidak ter-resolve

    if (context.userId !== OWNER_JID && context.userId !== ALLOWED_LID) {
      return { 
        success: false, 
        error: `SECURITY ALERT: User ${context.userId} is not authorized to run terminal commands!` 
      };
    }

    try {
      console.log(`[TermuxCommandTool] OWNER is running: ${args.command}`);
      const { stdout, stderr } = await execPromise(args.command);
      
      let output = '';
      if (stdout) output += `STDOUT:\n${stdout}\n`;
      if (stderr) output += `STDERR:\n${stderr}\n`;
      
      if (!output) output = 'Command executed successfully (no output).';
      
      // Jika output terlalu panjang, potong agar WA tidak hang
      if (output.length > 2500) {
        output = output.substring(output.length - 2500);
        output = '...[OUTPUT TERPOTONG]...\n' + output;
      }
      
      return { success: true, output };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
