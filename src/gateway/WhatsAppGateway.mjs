// src/gateway/WhatsAppGateway.mjs — UNIVERSAL MULTIMODAL & CO-PILOT GATEWAY
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
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
        if (!mek.message) continue;
        
        const jid = mek.key.remoteJid;
        
        // Filter out status broadcasts and newsletters
        if (!jid || jid.endsWith('@newsletter') || jid === 'status@broadcast') { 
            continue; 
        } 

        try {
          let unifiedMsg = Normalizer.normalize(mek);
          if (!unifiedMsg) {
            unifiedMsg = {
              chatId: jid,
              senderId: mek.key.participant || jid,
              text: mek.message?.conversation || mek.message?.extendedTextMessage?.text || mek.message?.imageMessage?.caption || '',
              timestamp: mek.messageTimestamp || Date.now()
            };
          }
          
          const textPreview = unifiedMsg.text ? unifiedMsg.text.substring(0, 30) : '[Media/Foto/VN]';
          console.log('<<< MESSAGE ACCEPTED & QUEUED:', jid, '| text:', textPreview);
          
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
