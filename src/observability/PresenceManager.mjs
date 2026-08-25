
export class PresenceManager {
  static isStarted = false;
  static start(sock, EventBus) {
    if (this.isStarted) return;
    this.isStarted = true;

    EventBus.on('message.received', async (msg) => {
       try { 
           await sock.readMessages([{ remoteJid: msg.chatId, id: msg.id, participant: msg.senderId }]); 
       } catch(e){}
    });

    EventBus.on('intent.detected', async (data) => {
       try { await sock.sendPresenceUpdate('composing', data.chatId); } catch(e){}
    });

    EventBus.on('tool.requested', async (data) => {
       try { await sock.sendPresenceUpdate('composing', data.chatId); } catch(e){}
    });

    EventBus.on('tool.started', async (data) => {
       try { await sock.sendPresenceUpdate('composing', data.chatId); } catch(e){}
    });

    EventBus.on('message.sent', async (data) => {
       try { await sock.sendPresenceUpdate('available', data.chatId); } catch(e){}
    });
    
    EventBus.on('agent.interrupted', async (data) => {
       try { await sock.sendPresenceUpdate('available', data.chatId); } catch(e){}
    });
  }
}
