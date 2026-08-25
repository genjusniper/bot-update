
import { EventEmitter } from 'events';
class Bus extends EventEmitter {}
export const EventBus = new Bus();
