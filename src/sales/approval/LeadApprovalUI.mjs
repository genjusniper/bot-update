export class LeadApprovalUI {
    render(lead) {
        let output = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        output += `LOCAL SUPPLY OPPORTUNITY\n`;
        output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        output += `Business:\n${lead.businessName}\n\n`;
        output += `Type:\n${lead.businessType || 'UNKNOWN'}\n\n`;
        output += `LOCATION:\n${lead.location || 'UNKNOWN'}\n\n`;
        output += `QUALITY:\n${lead.qualityGrade || 'UNKNOWN'}\n\n`;
        
        const coverage = lead.evidenceCoverage ? Math.round((lead.evidenceCoverage.identity + lead.evidenceCoverage.contact) / 2) : 0;
        output += `EVIDENCE COVERAGE:\n${coverage}%\n\n`;

        output += `TOP OPPORTUNITIES\n\n`;
        
        if (lead.primaryOpportunity) {
            output += `🥇 ${lead.primaryOpportunity.name.toUpperCase()}\n`;
            output += `Fit: ${(lead.primaryOpportunity.fitScore * 100).toFixed(0)}%\n`;
            output += `Demand: ${lead.primaryOpportunity.demandSignal || 'UNKNOWN'}\n`;
            output += `Supply: ${lead.primaryOpportunity.supplyStatus || 'UNKNOWN'}\n`;
            output += `Evidence: ${(lead.primaryOpportunity.evidenceConfidence * 100).toFixed(0)}%\n\n`;
        }

        if (lead.secondaryOpportunities && lead.secondaryOpportunities.length > 0) {
            const sec = lead.secondaryOpportunities[0];
            output += `🥈 ${sec.name.toUpperCase()}\n`;
            output += `Fit: ${(sec.fitScore * 100).toFixed(0)}%\n`;
            output += `Demand: ${sec.demandSignal || 'UNKNOWN'}\n`;
            output += `Supply: ${sec.supplyStatus || 'UNKNOWN'}\n`;
            output += `Evidence: ${(sec.evidenceConfidence * 100).toFixed(0)}%\n\n`;
        }
        
        if (lead.secondaryOpportunities && lead.secondaryOpportunities.length > 1) {
            const ter = lead.secondaryOpportunities[1];
            output += `🥉 ${ter.name.toUpperCase()}\n`;
            output += `Fit: ${(ter.fitScore * 100).toFixed(0)}%\n`;
            output += `Demand: ${ter.demandSignal || 'UNKNOWN'}\n`;
            output += `Supply: ${ter.supplyStatus || 'UNKNOWN'}\n`;
            output += `Evidence: ${(ter.evidenceConfidence * 100).toFixed(0)}%\n\n`;
        }

        output += `WHY:\n`;
        (lead.decisionReasons || []).forEach(reason => {
            output += `- ${reason.reason}\n`;
        });
        output += `\n`;

        output += `NEXT ACTION:\n${lead.nextBestAction || 'UNKNOWN'}\n\n`;
        output += `OUTBOUND:\n🔒 DRY_RUN\n\n`;
        output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        return output;
    }
}
