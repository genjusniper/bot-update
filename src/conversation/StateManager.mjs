
export class StateManager {
  static states = new Map();
  static getState(jid) {
      if (!this.states.has(jid)) {
          this.states.set(jid, { status: 'IDLE', isInterrupted: false });
      }
      return this.states.get(jid);
  }
  static setProcessing(jid) {
      const state = this.getState(jid);
      state.status = 'PROCESSING';
      state.isInterrupted = false;
  }
  static interrupt(jid) {
      const state = this.getState(jid);
      if (state.status !== 'IDLE') {
          state.isInterrupted = true;
          return true;
      }
      return false;
  }
  static setIdle(jid) {
      const state = this.getState(jid);
      state.status = 'IDLE';
      state.isInterrupted = false;
  }
}
