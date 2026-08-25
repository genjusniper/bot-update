import fs from 'fs';
import path from 'path';

export const GetContactsTool = {
  name: 'get_contacts',
  category: 'whatsapp',
  permissionLevel: 'AUTO',
  description: 'Mendapatkan daftar kontak (nama dan JID) dari buku alamat (contacts.json) untuk mengetahui nomor WA seseorang.',
  inputSchema: {
    type: 'object',
    properties: {
      searchName: {
        type: 'string',
        description: 'Nama kontak yang ingin dicari (opsional).'
      }
    },
    required: []
  },
  async execute(args, context) {
    const contactsPath = path.resolve(process.cwd(), 'contacts.json');
    if (!fs.existsSync(contactsPath)) {
      // Create empty contacts file if it doesn't exist
      fs.writeFileSync(contactsPath, JSON.stringify({
        "novita": "6280000000000@s.whatsapp.net",
        "rahayu": "6280000000001@s.whatsapp.net"
      }, null, 2));
      return { contacts: { "novita": "6280000000000@s.whatsapp.net", "rahayu": "6280000000001@s.whatsapp.net" }, note: "Buku alamat baru saja dibuat dengan nomor palsu. Harap perbarui file contacts.json secara manual dengan nomor asli." };
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
      if (args.searchName) {
        const query = args.searchName.toLowerCase();
        const results = {};
        for (const [name, jid] of Object.entries(data)) {
          if (name.toLowerCase().includes(query)) {
            results[name] = jid;
          }
        }
        return { results };
      }
      return { contacts: data };
    } catch (e) {
      return { error: 'Gagal membaca buku alamat: ' + e.message };
    }
  }
};
