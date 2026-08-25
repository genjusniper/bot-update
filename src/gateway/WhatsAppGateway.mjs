// src/gateway/WhatsAppGateway.mjs — MULTIMODAL & CO-PILOT GATEWAY WITH CLEAN SOCKET LIFECYCLE
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Normalizer } from './Normalizer.mjs';
import { EventBus } from '../event/EventBus.mjs';
import { JobQueue } from '../queue/JobQueue.mjs';

export class WhatsAppGateway {
  constructor(sessionDir = 'auth-v5-test') {
    this.sessionDir = sessionDir;
    this.sock = null;
    this.isShuttingDown = false;
    this.connectionGeneration = 0;
    this.reconnectTimer = null;
  }

  cleanupCurrentSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sock) {
      try {
        if (this.sock.ev && typeof this.sock.ev.removeAllListeners === 'function') {
          this.sock.ev.removeAllListeners();
        }
        if (this.sock.ws && typeof this.sock.ws.close === 'function') {
          this.sock.ws.close();
        }
        if (typeof this.sock.end === 'function') {
          this.sock.end(new Error('Socket Replaced'));
        }
      } catch (e) {
        console.warn('[WA Gateway] Socket cleanup warning:', e.message);
      }
      this.sock = null;
    }
  }

  async connect() {
    this.connectionGeneration++;
    const currentGen = this.connectionGeneration;
    console.log(`📡 [WA Gateway] Initializing Connection (Gen #${currentGen})...`);

    // Clean up any existing socket & listeners to prevent duplicate handler multiplication
    this.cleanupCurrentSocket();

    const { version } = await fetchLatestBaileysVersion();
    console.log(`📡 [WA Gateway] Web Version: ${version.join('.')}`);
    
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
    
    const socket = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      printQRInTerminal: false,
      syncFullHistory: false
    });

    this.sock = socket;

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (update) => {
      if (this.connectionGeneration !== currentGen) return; // Stale socket

      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`❌ [WA Gateway Gen #${currentGen}] Connection closed (Status: ${statusCode || 'unknown'}). Reconnecting: ${shouldReconnect}`);
        
        if (shouldReconnect && !this.isShuttingDown) {
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      } else if (connection === 'open') {
        console.log(`✅ [WA Gateway Gen #${currentGen}] WhatsApp Web Socket Connected`);
        EventBus.publish('whatsapp.connected', {});
      }
    });

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (this.connectionGeneration !== currentGen) return; // Stale socket
      if (type !== 'notify') return;

      for (const mek of messages) {
        if (!mek.message) continue;
        
        const jid = mek.key.remoteJid;
        
        // Filter out status broadcasts and newsletters
        if (!jid || jid.endsWith('@newsletter') || jid === 'status@broadcast') { 
            continue; 
        } 

        const eventId = mek.key.id;

        // Idempotency check: drop if message has already been processed (e.g. from reconnect replay)
        if (eventId && JobQueue.isMessageProcessed(eventId)) {
            console.log(`[WA Gateway] ⏭️ Dropped duplicate event ${eventId} from ${jid}`);
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
          console.log(`<<< [Gen #${currentGen}] MESSAGE ACCEPTED: ${jid} | ID: ${eventId} | text: "${textPreview}"`);
          
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
    this.cleanupCurrentSocket();
  }
}
