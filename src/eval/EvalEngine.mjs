// src/eval/EvalEngine.mjs
import fs from 'fs';
import path from 'path';
import { createAIGateway } from '../ai/index.mjs';
import { AgentV2 } from '../agent/AgentV2.mjs';
import dotenv from 'dotenv';
dotenv.config();

export class EvalEngine {
  static scorecardFile = path.join(process.cwd(), 'memory', 'eval_scorecard.json');

  static async run() {
    console.log('🧪 [EvalEngine] Running Regression CI and Automated Scorecard...');
    
    const key = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.split(',')[0] : '';
    const aiGateway = createAIGateway(key);
    const agent = new AgentV2(aiGateway);

    const testCases = [
      { id: 'TC01', text: 'halo bro, apa kabar?', expectedRoute: 'REPLY' },
      { id: 'TC02', text: 'tolong buatin teka-teki lucu dong', expectedRoute: 'REPLY' },
      { id: 'TC03', text: 'siapa namamu?', expectedRoute: 'REPLY' }
    ];

    const results = [];
    let passed = 0;
    const latencyBudgetMs = 4000; // 4 seconds budget per reply

    for (const tc of testCases) {
      const startTime = Date.now();
      let status = 'PASSED';
      let error = null;
      let replyText = '';

      try {
        console.log(`⚡ Testing Case ${tc.id}: "${tc.text}"`);
        const res = await agent.processMessage(
          'test_chat_id@lid',
          tc.text,
          { working_memory: [], semantic_memory: [], episodic_memory: [] },
          { id: 'msg_test_' + Date.now(), text: tc.text }
        );
        
        replyText = res.chunks ? res.chunks.join(' | ') : '';
        const latency = Date.now() - startTime;
        
        if (!replyText || replyText.includes('error euy')) {
          status = 'FAILED_EMPTY_RESPONSE';
        } else if (latency > latencyBudgetMs) {
          status = 'FAILED_LATENCY_BUDGET_EXCEEDED';
        }
        
        results.push({
          id: tc.id,
          input: tc.text,
          status,
          latencyMs: latency,
          response: replyText.substring(0, 100) + (replyText.length > 100 ? '...' : '')
        });

        if (status === 'PASSED') passed++;
        
      } catch (err) {
        status = 'FAILED_CRASH';
        error = err.message;
        results.push({
          id: tc.id,
          input: tc.text,
          status,
          latencyMs: Date.now() - startTime,
          error
        });
      }
    }

    const scorecard = {
      timestamp: Date.now(),
      scorecardVersion: '1.0.0',
      totalTests: testCases.length,
      passed,
      failed: testCases.length - passed,
      passPercentage: (passed / testCases.length) * 100,
      results
    };

    fs.writeFileSync(this.scorecardFile, JSON.stringify(scorecard, null, 2));
    
    console.log(`\n==========================================`);
    console.log(`🏆 CI SCORECARD RESULT: ${scorecard.passPercentage.toFixed(1)}% Passed`);
    console.log(`==========================================`);
    console.log(`Passed: ${passed} / ${testCases.length}`);
    console.log(`Results written to: memory/eval_scorecard.json`);
    console.log(`==========================================\n`);
    
    return scorecard;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  EvalEngine.run().catch(console.error);
}
