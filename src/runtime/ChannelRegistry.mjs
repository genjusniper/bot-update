// src/runtime/ChannelRegistry.mjs
// V8 — Omni-channel Gateway Registry
export class ChannelRegistry {
  constructor() {
    this.channels = new Map();
  }

  register(name, gatewayInstance) {
    // Contract Check
    if (typeof gatewayInstance.connect !== 'function' || 
        typeof gatewayInstance.sendMessage !== 'function' ||
        typeof gatewayInstance.shutdown !== 'function') {
      throw new Error(`[ChannelRegistry] Gateway for "${name}" does not implement required interface.`);
    }
    
    this.channels.set(name, gatewayInstance);
    console.log(`🔌 [ChannelRegistry] Channel Gateway "${name}" registered successfully.`);
  }

  get(name) {
    return this.channels.get(name);
  }

  async connectAll() {
    for (const [name, gateway] of this.channels.entries()) {
      console.log(`📡 Connecting channel: ${name}...`);
      await gateway.connect();
    }
  }

  shutdownAll() {
    for (const [name, gateway] of this.channels.entries()) {
      console.log(`🔌 Shutting down channel: ${name}...`);
      gateway.shutdown();
    }
  }
}

export const channels = new ChannelRegistry();
