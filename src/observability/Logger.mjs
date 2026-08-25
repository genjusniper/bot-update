
import { EventBus } from '../events/EventBus.mjs';

export class ObservabilityLogger {
  static timers = new Map();
  static isStarted = false;

  static start() {
      if (this.isStarted) return;
      this.isStarted = true;

      EventBus.on('message.received', (msg) => {
          this.timers.set(msg.chatId, { start: Date.now(), last: Date.now() });
          console.log("\n[\x1b[36m" + new Date().toLocaleTimeString() + "\x1b[0m] 📩 MESSAGE.RECEIVED (type: " + msg.type + ")");
      });

      EventBus.on('intent.detected', (data) => {
          const timer = this.timers.get(data.chatId);
          if (timer) {
              const elapsed = Date.now() - timer.last;
              timer.last = Date.now();
              console.log("[\x1b[36m" + new Date().toLocaleTimeString() + "\x1b[0m] 🧠 INTENT.DETECTED      " + elapsed + "ms");
          }
      });

      EventBus.on('response.generated', (data) => {
          const timer = this.timers.get(data.chatId);
          if (timer) {
              const elapsed = Date.now() - timer.last;
              timer.last = Date.now();
              console.log("[\x1b[36m" + new Date().toLocaleTimeString() + "\x1b[0m] ⚙️ RESPONSE.GENERATED   " + elapsed + "ms");
          }
      });

      EventBus.on('agent.interrupted', (data) => {
          this.timers.delete(data.chatId);
          console.log("[\x1b[31m" + new Date().toLocaleTimeString() + "\x1b[0m] 🛑 AGENT.INTERRUPTED    (Pesanan dibatalkan)\n");
      });

      EventBus.on('message.sent', (data) => {
          const timer = this.timers.get(data.chatId);
          if (timer) {
              const total = Date.now() - timer.start;
              console.log("[\x1b[36m" + new Date().toLocaleTimeString() + "\x1b[0m] ✅ MESSAGE.SENT");
              console.log("\x1b[32mTOTAL LATENCY: " + (total / 1000).toFixed(2) + "s\x1b[0m\n");
              this.timers.delete(data.chatId);
          }
      });
  }
}
