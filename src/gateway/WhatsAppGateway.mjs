// src/gateway/WhatsAppGateway.mjs — STRICT CHANNEL & BROADCAST FILTER
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import { Normalizer } from './Normalizer.mjs';
import { EventBus } from '../event/EventBus.mjs';

export class WhatsAppGateway {
  constructor(sessionDir = 'auth-v5-test') {
    this.sessionDir = sessionDir;
    this.sock = null;
    this.isShuttingDown = false;
  }

  async connect() {
    const { version } = await fetchLatestBaileysVersion();
    console.log(`📡 [WA Gateway] Web Version: ${version.join('.')}`);
    
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
    
    this.sock = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      printQRInTerminal: false,
      syncFullHistory: false
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('❌ [WA Gateway] Connection closed. Reconnecting:', shouldReconnect);
        if (shouldReconnect && !this.isShuttingDown) {
           setTimeout(() => this.connect(), 3000); 
        }
      } else if (connection === 'open') {
        console.log('✅ [WA Gateway] WhatsApp Web Socket Connected');
        EventBus.publish('whatsapp.connected', {});
      }
    });

    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const mek of messages) {
        if (!mek.message || mek.key.fromMe) continue;
        
        const jid = mek.key.remoteJid;
        
        // STRICT FILTER: Block group chats, broadcasts, and channels
        if (!jid || jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid === 'status@broadcast') { 
            continue; 
        } 

        try {
          const unifiedMsg = Normalizer.normalize(mek);
          if (!unifiedMsg || !unifiedMsg.text) continue;
          
          console.log('<<< MESSAGE ACCEPTED & QUEUED:', jid, '| text:', unifiedMsg.text?.substring(0, 30));
          
          const eventId = mek.key.id;
          const correlationId = `conv_${jid}_${Date.now()}`;
          
          EventBus.publish('whatsapp.message.received', {
            unifiedMsg,
            rawKey: mek.key,
            rawMessage: mek.message,
            correlationId,
            eventId
          }, correlationId, eventId);
        } catch (e) {
           console.error('[WA Gateway] Error parsing message:', e);
        }
      }
    });
  }

  async sendMessage(chatId, text, options = {}) {
    if (!this.sock) throw new Error('WhatsApp Socket not connected');
    return await this.sock.sendMessage(chatId, { text }, options);
  }

  async sendPresenceUpdate(state, chatId) {
    if (!this.sock) return;
    return await this.sock.sendPresenceUpdate(state, chatId);
  }

  shutdown() {
    this.isShuttingDown = true;
    if (this.sock) {
      this.sock.end(new Error('Graceful Shutdown'));
    }
  }
}
