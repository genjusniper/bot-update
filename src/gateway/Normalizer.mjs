
export class Normalizer {
  static normalize(mek) {
      if (!mek || !mek.message) return null;
      const msg = mek.message;
      const isEphemeral = Object.keys(msg)[0] === 'ephemeralMessage';
      const actualMsg = isEphemeral ? msg.ephemeralMessage.message : msg;
      if (!actualMsg) return null;

      const type = Object.keys(actualMsg)[0];
      let text = '';
      if (type === 'conversation') text = actualMsg.conversation;
      else if (type === 'extendedTextMessage') text = actualMsg.extendedTextMessage.text;
      else if (type === 'imageMessage') text = actualMsg.imageMessage.caption || '';
      
      let quoted = null;
      const contextInfo = actualMsg.extendedTextMessage?.contextInfo || actualMsg.imageMessage?.contextInfo;
      if (contextInfo && contextInfo.quotedMessage) {
          const qMsg = contextInfo.quotedMessage;
          quoted = {
              id: contextInfo.stanzaId,
              sender: contextInfo.participant,
              text: qMsg.conversation || qMsg.extendedTextMessage?.text || ''
          };
      }

      let reaction = null;
      if (type === 'reactionMessage') {
          reaction = actualMsg.reactionMessage.text;
      }

      return {
          id: mek.key.id,
          chatId: mek.key.remoteJid,
          senderId: mek.key.participant || mek.key.remoteJid,
          type: type,
          text: text,
          timestamp: mek.messageTimestamp,
          quoted: quoted,
          reaction: reaction,
          metadata: {
              isGroup: mek.key.remoteJid?.endsWith('@g.us'),
              isFromMe: mek.key.fromMe
          }
      };
  }
}
