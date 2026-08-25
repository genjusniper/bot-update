import fs from 'fs';
import path from 'path';

export const ScheduleReminderTool = {
  name: 'schedule_reminder',
  category: 'whatsapp',
  permissionLevel: 'AUTO',
  description: 'Menjadwalkan pengingat atau pesan untuk dikirim ke user di masa depan. Gunakan ini jika user meminta untuk "diingatkan" atau "jadwalkan pesan".',
  inputSchema: {
    type: 'object',
    properties: {
      delayMinutes: {
        type: 'number',
        description: 'Berapa menit dari sekarang pesan ini harus dikirim. (Hitung dengan logika: jika jam 5 sore dan sekarang jam 3 sore, berarti 120 menit).'
      },
      message: {
        type: 'string',
        description: 'Isi pesan pengingat yang akan dikirim.'
      },
      targetJid: {
        type: 'string',
        description: 'JID tujuan (biasanya JID user yang meminta pengingat).'
      }
    },
    required: ['delayMinutes', 'message', 'targetJid']
  },
  async execute(args, context) {
    if (!args.delayMinutes || !args.message || !args.targetJid) {
      return { success: false, error: 'Data tidak lengkap.' };
    }
    
    try {
      const remindersPath = path.resolve(process.cwd(), 'memory', 'reminders.json');
      let reminders = [];
      if (fs.existsSync(remindersPath)) {
        try { reminders = JSON.parse(fs.readFileSync(remindersPath, 'utf8')); } catch (e) {}
      }
      
      const executeAt = Date.now() + (args.delayMinutes * 60 * 1000);
      
      reminders.push({
        jid: args.targetJid,
        message: args.message,
        executeAt: executeAt,
        createdAt: Date.now()
      });
      
      fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
      return { 
        success: true, 
        message: `Pengingat berhasil disetel. Akan dikirim dalam ${args.delayMinutes} menit.` 
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
