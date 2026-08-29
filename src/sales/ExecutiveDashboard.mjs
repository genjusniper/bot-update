// src/sales/ExecutiveDashboard.mjs
// Menyusun laporan harian dan mingguan dari seluruh aktivitas OS

import { PipelineGapAnalyzer } from './PipelineGapAnalyzer.mjs';
import { SalesLearningEngine } from './SalesLearningEngine.mjs';
import { LeadCRM } from './LeadCRM.mjs';

export class ExecutiveDashboard {
    
    /**
     * Generate laporan harian (Daily Check-in)
     */
    static generateDailyReport() {
        const gap = PipelineGapAnalyzer.analyze();
        
        const contactedToday = LeadCRM.getByStatus('CONTACTED').filter(l => 
            l.updatedAt && new Date(l.updatedAt).toDateString() === new Date().toDateString()
        ).length;
        
        const repliedToday = LeadCRM.getByStatus('REPLIED').filter(l => 
            l.updatedAt && new Date(l.updatedAt).toDateString() === new Date().toDateString()
        ).length;

        const closedToday = LeadCRM.getByStatus('ORDER').filter(l => 
            l.updatedAt && new Date(l.updatedAt).toDateString() === new Date().toDateString()
        ).length;

        return `📊 *DAILY SALES REPORT* 📊\n` +
               `Target Omzet: Rp ${gap.targetRevenue.toLocaleString()}\n` +
               `Tercapai: Rp ${gap.confirmedRevenue.toLocaleString()}\n` +
               `Gap/Kekurangan: Rp ${gap.gapValue.toLocaleString()}\n\n` +
               `*Aktivitas Hari Ini:*\n` +
               `- 📤 Outreach (Kirim): ${contactedToday} prospek\n` +
               `- 💬 Balasan (Reply): ${repliedToday} prospek\n` +
               `- 🤝 Closing (Order): ${closedToday} prospek`;
    }

    /**
     * Generate laporan mingguan komprehensif dari Learning Engine
     */
    static generateWeeklyReport() {
        const learnData = SalesLearningEngine.learn();
        
        let insightStr = '';
        if (learnData.insights.length > 0) {
            insightStr = learnData.insights.map(i => `💡 ${i}`).join('\n');
        } else {
            insightStr = '💡 Belum ada pola khusus yang menonjol minggu ini.';
        }

        return `📈 *WEEKLY SALES INTELLIGENCE REPORT* 📈\n` +
               `Total Data Points: ${learnData.totalDataPoints} prospek dianalisa.\n\n` +
               `*Insights & Winning Patterns:*\n${insightStr}\n\n` +
               `Sistem akan terus mengoptimasi strategi sapaan berdasarkan metrik di atas.`;
    }
}
