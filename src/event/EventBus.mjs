// src/event/EventBus.mjs
// FIX #7 & #9: Missing EventBus — used by NaturalConversationEngine, SelfTrainingKernel
import { EventEmitter } from 'events';

const bus = new EventEmitter();
bus.setMaxListeners(50); // Prevent MaxListenerWarning

export const EventBus = {
    emit: (event, payload) => bus.emit(event, { payload }),
    subscribe: (event, handler) => bus.on(event, handler),
    once: (event, handler) => bus.once(event, handler),
    off: (event, handler) => bus.off(event, handler)
};
