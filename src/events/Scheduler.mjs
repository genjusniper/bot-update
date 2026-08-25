
import { EventBus } from './EventBus.mjs';

export class Scheduler {
  static isStarted = false;
  static start() {
      if (this.isStarted) return;
      this.isStarted = true;
      console.log('⏰ Watchdog Scheduler diaktifkan (Setiap 2 Jam)');
      
      setInterval(() => {
          EventBus.emit('system.cron', { timestamp: Date.now() });
      }, 2 * 60 * 60 * 1000); 
  }
}
