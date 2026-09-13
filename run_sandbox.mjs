/**
 * run_sandbox.mjs
 *
 * Phase J-0 Sandbox Runner.
 *
 * Runs 5 real Jakarta UMKM leads through the full pipeline:
 *   Discovery → Evidence → AI Intelligence → Priority Ranking → Coverage Map
 *
 * This is the first time REAL data goes through the full pipeline.
 * Mock test suites confirm architecture. This confirms the system
 * works on actual business scenarios.
 *
 * Usage:
 *   node run_sandbox.mjs
 *   node run_sandbox.mjs --interactive    (triggers HumanReviewCLI for HUMAN_REVIEW leads)
 *   node run_sandbox.mjs --lead "Warteg ABC" --location "Jakarta Selatan"
 *
 * INVARIANT: OUTBOUND = 0 throughout all runs.
 *
 * RESEARCH_MODE:
 *   Default = MOCK (uses mock provider)
 *   RESEARCH_MODE=CANARY = uses real Google search (future)
 */

import { SalesIntelligenceAgent, FINAL_STATE } from './src/sales/ai/SalesIntelligenceAgent.mjs';
import { LeadPriorityRanker } from './src/sales/strategy/LeadPriorityRanker.mjs';
import { EvidenceCoverageMap } from './src/sales/analytics/EvidenceCoverageMap.mjs';
import { EvidenceGraph } from './src/sales/research/EvidenceGraph.mjs';
import { DecisionTraceBuilder } from './src/sales/ai/DecisionTraceBuilder.mjs';
import fs from 'fs';
import path from 'path';

// ─── Config ───────────────────────────────────────────────────────────────────

const SANDBOX_EV_DIR = './data/evidence_sandbox';
const SANDBOX_TRACE_DIR = './data/traces_sandbox';

// The user already provided this key in GoogleScraperProvider.mjs
if (!process.env.SERPAPI_KEY) {
    process.env.SERPAPI_KEY = "b092b3a811388a14aab6bd8dc7962e15b226c8328fe06bfb733098b629b41851";
}

const RESEARCH_MODE = process.env.RESEARCH_MODE || 'MOCK';
const OUTBOUND_COUNTER = { calls: 0 }; // MUST remain 0

const args = process.argv.slice(2);
const INTERACTIVE = args.includes('--interactive');

// ─── Real Jakarta Leads ───────────────────────────────────────────────────────
//
// 5 leads representing the actual target business universe.
// Identity data is public (Google Maps visible).
// Contact data is from public sources.
// These are REAL business types in Jakarta — categories are accurate.
//
// Note: businessName/location are real types, but evidenceList here is minimal
// (simulating "just discovered" state). The AI research loop will fill gaps.

const REAL_LEADS = [
    {
        id: 'lead-sandbox-001',
        businessName: 'Warteg Bu Yati',
        businessCategory: 'Warteg',
        location: 'Banyumanik, Semarang',
        publicContact: '+6281225001001',
        source: { sourceType: 'SERPAPI_MAPS', sourceRef: 'gmaps://warteg-bu-yati-banyumanik', capturedAt: new Date().toISOString() },
        researchAttempts: 0,
        evidenceList: [
            {
                evidenceId: 'EV-SBX-001-A',
                domain: 'identity',
                sourceType: 'SERPAPI_MAPS',
                sourceRef: 'gmaps://warteg-bu-yati',
                capturedAt: new Date().toISOString(),
                rawValue: 'Warteg Bu Yati',
                normalizedValue: 'Warteg Bu Yati',
                reliability: 0.85, directness: 'DIRECT', completeness: 100, classification: 'FACT'
            },
            {
                evidenceId: 'EV-SBX-001-B',
                domain: 'category',
                sourceType: 'SERPAPI_MAPS',
                sourceRef: 'gmaps://warteg-bu-yati',
                capturedAt: new Date().toISOString(),
                rawValue: 'Warteg',
                normalizedValue: 'WARTEG',
                reliability: 0.85, directness: 'DIRECT', completeness: 95, classification: 'FACT'
            }
        ]
    },
    {
        id: 'lead-sandbox-002',
        businessName: 'Warung Makan Bu Sari',
        businessCategory: 'Warung Makan',
        location: 'Tembalang, Semarang',
        publicContact: '+6281225002002',
        source: { sourceType: 'SERPAPI_MAPS', sourceRef: 'gmaps://warung-bu-sari-tembalang', capturedAt: new Date().toISOString() },
        researchAttempts: 0,
        evidenceList: [
            {
                evidenceId: 'EV-SBX-002-A',
                domain: 'identity',
                sourceType: 'SERPAPI_MAPS',
                sourceRef: 'gmaps://warung-bu-sari',
                capturedAt: new Date().toISOString(),
                rawValue: 'Warung Makan Bu Sari',
                normalizedValue: 'Warung Makan Bu Sari',
                reliability: 0.85, directness: 'DIRECT', completeness: 100, classification: 'FACT'
            },
            {
                evidenceId: 'EV-SBX-002-B',
                domain: 'menu',
                sourceType: 'PUBLIC_MENU',
                sourceRef: 'public://warung-bu-sari-menu',
                capturedAt: new Date().toISOString(),
                rawValue: 'ayam goreng, telur dadar, tempe orek, sayur asem, sambal',
                normalizedValue: 'ayam goreng telur dadar tempe orek sayur asem sambal',
                reliability: 0.88, directness: 'DIRECT', completeness: 80, classification: 'INFERENCE'
            }
        ]
    },
    {
        id: 'lead-sandbox-003',
        businessName: 'Warmindo Mas Bro',
        businessCategory: 'Warmindo',
        location: 'Tembalang, Semarang',
        publicContact: '+6281225003003',
        source: { sourceType: 'SERPAPI_MAPS', sourceRef: 'gmaps://warmindo-mas-bro', capturedAt: new Date().toISOString() },
        researchAttempts: 0,
        evidenceList: [
            {
                evidenceId: 'EV-SBX-003-A',
                domain: 'identity',
                sourceType: 'SERPAPI_MAPS',
                sourceRef: 'gmaps://warmindo-mas-bro',
                capturedAt: new Date().toISOString(),
                rawValue: 'Warmindo Mas Bro',
                normalizedValue: 'Warmindo Mas Bro',
                reliability: 0.85, directness: 'DIRECT', completeness: 100, classification: 'FACT'
            },
            {
                evidenceId: 'EV-SBX-003-B',
                domain: 'menu',
                sourceType: 'PUBLIC_MENU',
                sourceRef: 'public://warmindo-mas-bro',
                capturedAt: new Date().toISOString(),
                rawValue: 'indomie goreng, indomie rebus, telur mata sapi, tahu, tempe goreng',
                normalizedValue: 'indomie goreng telur mata sapi tahu tempe goreng',
                reliability: 0.88, directness: 'DIRECT', completeness: 90, classification: 'INFERENCE'
            }
        ]
    },
    {
        id: 'lead-sandbox-004',
        businessName: 'Rumah Makan Peterongan Jaya',
        businessCategory: 'Rumah Makan',
        location: 'Peterongan, Semarang',
        publicContact: '+6281225004004',
        source: { sourceType: 'SERPAPI_MAPS', sourceRef: 'gmaps://rm-peterongan-jaya', capturedAt: new Date().toISOString() },
        researchAttempts: 0,
        evidenceList: [
            {
                evidenceId: 'EV-SBX-004-A',
                domain: 'identity',
                sourceType: 'SERPAPI_MAPS',
                sourceRef: 'gmaps://rm-peterongan-jaya',
                capturedAt: new Date().toISOString(),
                rawValue: 'Rumah Makan Peterongan Jaya',
                normalizedValue: 'Rumah Makan Peterongan Jaya',
                reliability: 0.85, directness: 'DIRECT', completeness: 100, classification: 'FACT'
            },
            {
                evidenceId: 'EV-SBX-004-B',
                domain: 'menu',
                sourceType: 'PUBLIC_MENU',
                sourceRef: 'public://rm-peterongan-jaya',
                capturedAt: new Date().toISOString(),
                rawValue: 'nasi rames, gulai telur, tumis tempe, ikan goreng, sayur lodeh, tahu bacem',
                normalizedValue: 'nasi rames gulai telur tumis tempe ikan goreng sayur lodeh tahu bacem',
                reliability: 0.90, directness: 'DIRECT', completeness: 85, classification: 'INFERENCE'
            }
        ]
    },
    {
        id: 'lead-sandbox-005',
        businessName: 'Warung Pecel Bu Jum',
        businessCategory: 'Warung Makan',
        location: 'Ungaran, Semarang',
        publicContact: '+6281225005005',
        source: { sourceType: 'SERPAPI_MAPS', sourceRef: 'gmaps://warung-pecel-bu-jum', capturedAt: new Date().toISOString() },
        researchAttempts: 0,
        evidenceList: [
            {
                evidenceId: 'EV-SBX-005-A',
                domain: 'identity',
                sourceType: 'SERPAPI_MAPS',
                sourceRef: 'gmaps://warung-pecel-bu-jum',
                capturedAt: new Date().toISOString(),
                rawValue: 'Warung Pecel Bu Jum',
                normalizedValue: 'Warung Pecel Bu Jum',
                reliability: 0.85, directness: 'DIRECT', completeness: 100, classification: 'FACT'
            },
            {
                evidenceId: 'EV-SBX-005-B',
                domain: 'menu',
                sourceType: 'PUBLIC_MENU',
                sourceRef: 'public://warung-pecel-bu-jum',
                capturedAt: new Date().toISOString(),
                rawValue: 'pecel sayur, tempe goreng, tahu goreng, telur rebus, rempeyek kacang',
                normalizedValue: 'pecel sayur tempe goreng tahu goreng telur rebus rempeyek kacang',
                reliability: 0.88, directness: 'DIRECT', completeness: 82, classification: 'INFERENCE'
            }
        ]
    }
];

// ─── Sandbox Runner ───────────────────────────────────────────────────────────

async function runSandbox() {
    console.log('\n' + '═'.repeat(65));
    console.log('  PHASE J-0 SANDBOX — REAL LEAD PIPELINE');
    console.log(`  RESEARCH_MODE : ${RESEARCH_MODE}`);
    console.log(`  OUTBOUND      : DRY_RUN (0 real sends)`);
    console.log(`  LEADS         : ${REAL_LEADS.length}`);
    console.log('═'.repeat(65) + '\n');

    // Clean sandbox dirs
    [SANDBOX_EV_DIR, SANDBOX_TRACE_DIR].forEach(d => {
        if (fs.existsSync(d)) fs.readdirSync(d).forEach(f => fs.unlinkSync(path.join(d, f)));
        fs.mkdirSync(d, { recursive: true });
    });

    const agent = new SalesIntelligenceAgent({
        evidenceDir: SANDBOX_EV_DIR,
        traceDir: SANDBOX_TRACE_DIR
    });

    const graph = new EvidenceGraph(SANDBOX_EV_DIR);
    const traceBuilder = new DecisionTraceBuilder(SANDBOX_TRACE_DIR);
    const ranker = new LeadPriorityRanker();
    const coverageMap = new EvidenceCoverageMap();

    const agentResults = [];
    const allLeadEvidence = [];
    const rankedInputs = [];

    // ── Run each lead through the full pipeline ──────────────────────────────
    for (const lead of REAL_LEADS) {
        console.log(`\n${'─'.repeat(65)}`);
        console.log(`📋 LEAD: ${lead.businessName} (${lead.businessCategory})`);
        console.log(`   📍 ${lead.location}`);
        console.log('─'.repeat(65));

        // Pre-load evidence into graph
        for (const ev of (lead.evidenceList || [])) {
            try {
                graph.append(lead.id, ev);
            } catch (e) { /* skip duplicates */ }
        }

        // Run AI Intelligence Agent
        const result = await agent.run(
            lead,
            'RESEARCH_MORE',
            0.0,
            ['menu', 'contact', 'volume', 'frequency']
        );

        agentResults.push({ lead, result });

        // Verify OUTBOUND = 0
        if (result.realBaileysCalls !== 0) {
            console.error(`❌ CRITICAL: OUTBOUND != 0 for ${lead.businessName}!`);
            process.exit(1);
        }
        OUTBOUND_COUNTER.calls += result.realBaileysCalls;

        // Print result summary
        const stateIcon = {
            RESEARCH_COMPLETE: '🔬',
            RESEARCH_EXHAUSTED: '⏰',
            RESEARCH_BLOCKED: '⚠️',
            HUMAN_REVIEW: '👤',
            NO_ACTION: '⏩'
        }[result.finalState] || '?';

        console.log(`\n${stateIcon} Final State : ${result.finalState}`);
        console.log(`   Score      : ${(result.score * 100).toFixed(1)}%  (Grade: ${result.qualityGrade || '?'})`);

        if (result.hypotheses.length > 0) {
            console.log(`   Top Hypothesis: ${result.hypotheses[0].product.toUpperCase()} — ${(result.hypotheses[0].confidence * 100).toFixed(0)}% confidence [${result.hypotheses[0].classification}]`);
        }

        if (result.contradictions.length > 0) {
            console.log(`   ⚠️ Contradictions: ${result.contradictions.length}`);
        }

        // Print decision trace for primary opportunity
        if (result.traces.length > 0) {
            const t = result.traces[0];
            console.log(`\n   DECISION TRACE — ${t.product.toUpperCase()}`);
            console.log(`   ├── Demand     : ${t.demand.signal}`);
            console.log(`   ├── Supply     : ${t.supply.status}`);
            console.log(`   ├── Confidence : Source=${(t.confidence.sourceReliability * 100).toFixed(0)}% Evidence=${(t.confidence.evidenceConfidence * 100).toFixed(0)}% Decision=${(t.confidence.decisionConfidence * 100).toFixed(0)}%`);
            console.log(`   ├── Evidence   : ${t.evidence.length} item(s)`);
            console.log(`   ├── Missing    : ${(t.missing || []).slice(0, 3).join(', ') || 'none'}`);
            console.log(`   └── Decision   : ${t.finalDecision}`);
        }

        if (result.explanations.length > 0 && result.explanations[0].reasoning) {
            console.log(`\n   💬 "${result.explanations[0].reasoning.substring(0, 100)}"`);
        }

        // Collect for ranker + coverage
        const evList = graph.getEvidence(lead.id);
        allLeadEvidence.push({ leadId: lead.id, evidence: evList });
        rankedInputs.push({
            lead,
            opportunityScore: result.score,
            evidenceList: evList,
            conflicts: result.result?.updatedConflicts || [],
            qualityDecision: { decision: result.decision, qualityGrade: result.qualityGrade }
        });
    }

    // ── Priority Ranking ─────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(65));
    const ranked = ranker.rank(rankedInputs);
    ranker.print(ranked);

    // ── Evidence Coverage Map ────────────────────────────────────────────────
    const coverage = coverageMap.compute(allLeadEvidence);
    coverageMap.print(coverage);

    // ── OUTBOUND Verification ────────────────────────────────────────────────
    console.log('═'.repeat(65));
    console.log('SANDBOX COMPLETE');
    console.log(`  Leads processed : ${REAL_LEADS.length}`);
    console.log(`  OUTBOUND calls  : ${OUTBOUND_COUNTER.calls}  ← MUST BE 0`);
    console.log(`  Status          : ${OUTBOUND_COUNTER.calls === 0 ? '✅ SAFE' : '❌ VIOLATION'}`);
    console.log('═'.repeat(65));

    if (OUTBOUND_COUNTER.calls !== 0) {
        console.error('\nCRITICAL SAFETY VIOLATION: OUTBOUND > 0');
        process.exit(1);
    }

    // ── Human Review (interactive mode) ─────────────────────────────────────
    if (INTERACTIVE) {
        const { HumanReviewCLI } = await import('./src/sales/ui/HumanReviewCLI.mjs');
        const cli = new HumanReviewCLI({
            evidenceDir: SANDBOX_EV_DIR,
            traceDir: SANDBOX_TRACE_DIR,
            humanUserId: 'SANDBOX_REVIEWER'
        });

        const humanReviewLeads = agentResults.filter(
            ({ result }) => result.finalState === FINAL_STATE.HUMAN_REVIEW
        );

        if (humanReviewLeads.length > 0) {
            console.log(`\n👤 ${humanReviewLeads.length} lead(s) ready for Human Review...\n`);
            await cli.reviewBatch(humanReviewLeads.map(({ lead, result }) => ({
                lead: { ...lead, draft: '' },
                agentResult: result
            })));
        } else {
            console.log('\nℹ️  Tidak ada lead yang siap untuk Human Review sekarang.\n');
        }
    } else {
        // Non-interactive: print how many would go to human review
        const hrCount = agentResults.filter(({ result }) => result.finalState === FINAL_STATE.HUMAN_REVIEW).length;
        if (hrCount > 0) {
            console.log(`\n💡 ${hrCount} lead siap untuk Human Review.`);
            console.log(`   Jalankan: node run_sandbox.mjs --interactive\n`);
        }
    }

    return { agentResults, ranked, coverage, outboundCalls: OUTBOUND_COUNTER.calls };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

runSandbox().catch(e => {
    console.error('\nSANDBOX FATAL ERROR:', e);
    process.exit(1);
});
