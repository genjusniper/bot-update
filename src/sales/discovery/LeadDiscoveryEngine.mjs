import fs from 'fs';
import { GoogleScraperProvider } from './GoogleScraperProvider.mjs';
import { EventLedger } from '../ledger/EventLedger.mjs';
import { LeadQualityFirewall } from '../guard/LeadQualityFirewall.mjs';
import { OpportunityScorer } from '../strategy/OpportunityScorer.mjs';
import { ContextAwarePitchEngine } from '../drafting/ContextAwarePitchEngine.mjs';
import { BusinessDemandEngine } from '../strategy/BusinessDemandEngine.mjs';
import { MotherSupplyCatalog } from '../strategy/MotherSupplyCatalog.mjs';
import { SupplyDemandMatcher } from '../strategy/SupplyDemandMatcher.mjs';

// Define a minimal LeadStorage if missing in imports
class MinimalLeadStorage {
    constructor(path) { this.path = path; }
    async saveLead(lead) {
        let leads = {};
        if (fs.existsSync(this.path)) {
            const data = JSON.parse(fs.readFileSync(this.path, 'utf-8'));
            if (Array.isArray(data)) {
                data.forEach(l => leads[l.id] = l);
            } else {
                leads = data;
            }
        }
        leads[lead.id] = lead;
        fs.writeFileSync(this.path, JSON.stringify(leads, null, 2));
    }
}

export class LeadDiscoveryEngine {
    constructor() {
        this.provider = new GoogleScraperProvider();
        this.storage = new MinimalLeadStorage('./data/queues/leads.json');
        this.ledger = new EventLedger();
        
        this.catalog = new MotherSupplyCatalog();
        this.demandEngine = new BusinessDemandEngine();
        this.matcher = new SupplyDemandMatcher();
        this.scorer = new OpportunityScorer();
        this.pitchEngine = new ContextAwarePitchEngine();
        this.firewall = new LeadQualityFirewall();
    }

    async discoverAndDraft(criteria, limit = 5) {
        console.log(`\\n🚀 [Controlled Discovery] Memulai pencarian: ${criteria} (Budget Limit: ${limit})`);
        
        const rawLeads = await this.provider.search(criteria, limit);
        const processedLeads = [];
        let duplicateCount = 0;

        const indexFile = './data/ledger/lead_identity_index.json';
        let identityIndex = {};
        if (fs.existsSync(indexFile)) {
            identityIndex = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
        }

        const checkDuplicate = (rawLead) => {
            for (const key in identityIndex) {
                const el = identityIndex[key];
                if (el.sourceRef === rawLead.source.sourceRef) return true;
                if (el.publicContact && rawLead.publicContact && el.publicContact === rawLead.publicContact) return true;
                if (el.businessName.toLowerCase() === rawLead.businessName.toLowerCase()) return true;
            }
            return false;
        };

        const registerIdentity = (finalLead) => {
            identityIndex[finalLead.id] = {
                leadId: finalLead.id,
                businessName: finalLead.businessName,
                publicContact: finalLead.publicContact,
                sourceRef: finalLead.source.sourceRef,
                firstSeenAt: new Date().toISOString(),
                lastSeenAt: new Date().toISOString()
            };
            fs.writeFileSync(indexFile, JSON.stringify(identityIndex, null, 2));
        };

        for (const lead of rawLeads) {
            // FIREWALL GATE 1: Raw Validation
            const rawVal = this.firewall.validateRawLead(lead);
            if (rawVal.decision === 'REJECTED') {
                console.log(`❌ [Firewall] REJECTED: ${rawVal.reason}`);
                continue;
            }

            if (checkDuplicate(lead)) {
                duplicateCount++;
                console.log(`⚠️ [Discovery] Duplicate lead detected: ${lead.businessName}. Skipping.`);
                if (duplicateCount > 5) break;
                continue; 
            }

            const flowId = `flow-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const leadId = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            await this.ledger.transitionState(`${flowId}-discover`, leadId, 'DISCOVERED');
            await this.ledger.logEvent(`${flowId}-source`, leadId, 'ACTION_SOURCE_CAPTURED', { source: lead.source, businessName: lead.businessName });

            console.log(`\\n🧠 Menganalisis: ${lead.businessName}`);
            
            // 1. Evidence Extraction (Mocked/Basic for now since we bypass scrape details in tests)
            let rawEvidences = lead.evidenceList || [];
            if (rawEvidences.length === 0) {
                // Identity
                rawEvidences.push({
                    evidenceId: `EV-${Date.now()}-ID`,
                    domain: 'identity',
                    sourceType: lead.source?.sourceType || 'SERPAPI_MAPS',
                    sourceRef: lead.source?.sourceRef || 'Fallback',
                    capturedAt: lead.source?.capturedAt || new Date().toISOString(),
                    rawValue: lead.businessName,
                    normalizedValue: lead.businessName,
                    reliability: lead.source?.sourceType === 'HEURISTIC' ? 0.2 : 0.9,
                    directness: 0.9,
                    completeness: 100
                });
                
                // Contact
                if (lead.publicContact) {
                    rawEvidences.push({
                        evidenceId: `EV-${Date.now()}-CT`,
                        domain: 'contact',
                        sourceType: 'SERPAPI_MAPS',
                        capturedAt: new Date().toISOString(),
                        rawValue: lead.publicContact,
                        normalizedValue: lead.publicContact,
                        reliability: 0.9,
                        directness: 0.9,
                        completeness: 100
                    });
                }
                
                // Category
                if (lead.businessCategory) {
                    rawEvidences.push({
                        evidenceId: `EV-${Date.now()}-CAT`,
                        domain: 'category',
                        sourceType: 'SERPAPI_MAPS',
                        capturedAt: new Date().toISOString(),
                        rawValue: lead.businessCategory,
                        normalizedValue: lead.businessCategory,
                        reliability: 0.8,
                        directness: 0.9,
                        completeness: 100
                    });
                }
            }

            // 2. Business Demand Engine
            const demandResult = this.demandEngine.inferDemand(lead, rawEvidences);
            await this.ledger.transitionState(`${flowId}-verify`, leadId, 'VERIFIED');
            
            // 3. Supply Demand Matcher
            const demandMatches = this.matcher.match(demandResult.demandProfile, this.catalog);
            
            // 4. Opportunity Scorer
            const oppScoreData = this.scorer.score(demandMatches, demandResult.unknowns);
            
            // FIREWALL GATE 2: Quality Decision
            lead.researchAttempts = lead.researchAttempts || 0;
            const qualityDecision = this.firewall.gradeQuality(lead, demandResult.evidence, oppScoreData.opportunityScore);
            
            console.log(`   [Opportunity] Score: ${oppScoreData.opportunityScore.toFixed(2)} | Grade: ${qualityDecision.qualityGrade}`);
            console.log(`   [Firewall] Action: ${qualityDecision.decision}`);

            if (qualityDecision.decision === 'REJECTED') {
                await this.ledger.transitionState(`${flowId}-reject`, leadId, 'INVALID', qualityDecision.reasons[0]);
                continue;
            }

            let pitchInfo = { draft: null, metadata: null, productName: null };
            
            // Generate Context-Aware Pitch dynamically using PitchEngine
            try {
                const pitchResult = await this.pitchEngine.generatePitch(lead, oppScoreData);
                pitchInfo.draft = pitchResult.draft;
                pitchInfo.metadata = pitchResult.metadata;
                pitchInfo.productName = pitchResult.productName;
            } catch (err) {
                console.warn(`[LeadDiscovery] PitchEngine error:`, err.message);
                const priName = oppScoreData.primaryOpportunity?.name || 'Bahan Pangan Segar';
                pitchInfo.draft = `Halo tim ${lead.businessName}, salam kenal kami supplier ${priName} di Semarang. Boleh kami kirimkan info daftar harga hari ini?`;
                pitchInfo.metadata = { draftSource: 'FALLBACK_HEURISTIC', confidence: 'LOW', requiresHumanReview: true };
                pitchInfo.productName = priName;
            }

            // Compose Output
            const finalLead = {
                ...lead,
                id: leadId,
                status: 'PENDING_APPROVAL',
                version: 1,
                timestamp: new Date().toISOString(),
                
                // Analytics
                qualityGrade: qualityDecision.qualityGrade,
                confidence: qualityDecision.confidence,
                firewallDecision: qualityDecision.decision,
                firewallReasons: qualityDecision.reasons,
                evidenceCoverage: qualityDecision.coverage,
                evidenceConflicts: qualityDecision.conflicts,
                freshness: qualityDecision.freshness,
                
                // Matching & Opportunity
                businessType: demandResult.businessProfile.inferredType,
                demandMatches: demandMatches,
                primaryOpportunity: oppScoreData.primaryOpportunity,
                secondaryOpportunities: oppScoreData.secondaryOpportunities,
                conditionalOpportunities: oppScoreData.conditionalOpportunities,
                opportunityScore: oppScoreData.opportunityScore,
                nextBestAction: qualityDecision.decision, 
                decisionReasons: oppScoreData.decisionReasons,
                
                // Outreach
                draft: pitchInfo.draft,
                draftMetadata: pitchInfo.metadata,
                recommendedProduct: pitchInfo.productName || oppScoreData.primaryOpportunity?.name || 'Bahan Pangan Segar'
            };

            await this.storage.saveLead(finalLead);
            registerIdentity(finalLead);
            
            if (qualityDecision.decision === 'RESEARCH_MORE') {
                console.log(`🔍 [Discovery] Lead ${finalLead.id} butuh RESEARCH_MORE.`);
            } else {
                console.log(`✅ [Discovery] Lead ${finalLead.id} siap review.`);
            }
            
            await this.ledger.transitionState(`${flowId}-qualify`, leadId, 'QUALIFIED');
            processedLeads.push(finalLead);
            
            if (processedLeads.length >= limit) break;
        }

        return processedLeads;
    }
}
