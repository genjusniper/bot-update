// src/agent/ProposalEngine.mjs
// V6.8 — Proactive Proposal Engine (Open Loop with Human Approval)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class ProposalEngine {
  static proposalFile = path.join(process.cwd(), 'memory', 'proposals.jsonl');

  static _loadProposals() {
    if (!fs.existsSync(this.proposalFile)) return [];
    const lines = fs.readFileSync(this.proposalFile, 'utf8').split('\n').filter(Boolean);
    return lines.map(line => JSON.parse(line));
  }

  static _saveProposals(proposals) {
    const lines = proposals.map(p => JSON.stringify(p)).join('\n') + '\n';
    fs.writeFileSync(this.proposalFile, lines);
  }

  static createProposal(chatId, tool, args) {
    const proposals = this._loadProposals();
    const id = 'prop_' + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const newProposal = {
      proposalId: id,
      chatId,
      tool,
      args,
      status: 'PENDING',
      timestamp: Date.now()
    };
    proposals.push(newProposal);
    this._saveProposals(proposals);
    console.log(`[ProposalEngine] 💡 Created proposal ${id} for ${tool} (${args})`);
    return id;
  }

  static getPendingProposal(chatId) {
    const proposals = this._loadProposals();
    return proposals.reverse().find(p => p.chatId === chatId && p.status === 'PENDING');
  }

  static updateStatus(proposalId, status) {
    const proposals = this._loadProposals();
    const p = proposals.find(x => x.proposalId === proposalId);
    if (p) {
      p.status = status;
      this._saveProposals(proposals);
      console.log(`[ProposalEngine] 🔄 Proposal ${proposalId} status updated to ${status}`);
      return true;
    }
    return false;
  }
}
