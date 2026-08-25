import fs from 'fs';
import path from 'path';

export const SendWhatsAppMessageTool = {
  name: 'send_whatsapp_message',
  category: 'whatsapp',
  permissionLevel: 'AUTO',
  description: 'Mengirim pesan WhatsApp ke kontak tertentu. Gunakan ini jika user menyuruh kamu mengirim pesan ke orang lain.',
  inputSchema: {
    type: 'object',
    properties: {
      contactName: {
        type: 'string',
        description: 'Nama kontak tujuan (misal: "novita"). Akan dicari di buku alamat.'
      },
      targetJid: {
        type: 'string',
        description: 'Atau JID tujuan jika sudah diketahui (opsional).'
      },
      message: {
        type: 'string',
        description: 'Isi pesan yang akan dikirim.'
      }
    },
    required: ['message']
  },
  async execute(args, context) {
    if (!context || !context.deps || !context.deps.sendMessage) {
      return { success: false, error: 'WhatsApp sender dependency is missing.' };
    }
    
    let jid = args.targetJid;
    if (!jid && args.contactName) {
      const contactsPath = path.resolve(process.cwd(), 'contacts.json');
      if (fs.existsSync(contactsPath)) {
        const data = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
        const query = args.contactName.toLowerCase();
        for (const [name, storedJid] of Object.entries(data)) {
          if (name.toLowerCase().includes(query)) {
            jid = storedJid;
            break;
          }
        }
      }
    }
    
    if (!jid) {
      return { success: false, error: `Kontak '${args.contactName}' tidak ditemukan di buku alamat.` };
    }
    
    try {
      console.log(`[Tool] Sending WhatsApp message to ${jid}`);
      const result = await context.deps.sendMessage(jid, args.message);
      if (result) {
        return { success: true, message: `Berhasil mengirim pesan ke ${jid}` };
      } else {
        return { success: false, error: 'Gagal mengirim pesan (Socket not ready).' };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
