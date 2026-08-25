
import { EventBus } from '../events/EventBus.mjs';
import { StateManager } from './StateManager.mjs';

export class InterruptEngine {
  static isStarted = false;
  static start() {
      if (this.isStarted) return;
      this.isStarted = true;
      EventBus.on('message.received', (msg) => {
          const state = StateManager.getState(msg.chatId);
          if (state.status !== 'IDLE') {
              if (StateManager.interrupt(msg.chatId)) {
                  EventBus.emit('agent.interrupted', { chatId: msg.chatId, interruptMsg: msg.text });
              }
          }
      });
  }
}
