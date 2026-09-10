// src/core/autonomy/GoalTrackerEngine.mjs
// Hierarchical goal and milestone tracker for ARKA OS projects and long-running objectives
// Answers meta-queries like: "Kita masih punya PR apa?", "Status goal sekarang gimana?"

import fs from 'fs';
import path from 'path';

const GOALS_FILE = path.resolve(process.cwd(), 'data/goals_registry.json');

export class GoalTrackerEngine {
    static goals = new Map();

    static init(customPath = null) {
        const filePath = customPath || GOALS_FILE;
        try {
            if (fs.existsSync(filePath)) {
                const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.goals.clear();
                for (const g of raw) {
                    this.goals.set(g.goalId, g);
                }
            } else {
                this.seedInitialGoals();
                this.save(filePath);
            }
        } catch (e) {
            console.warn('[GoalTrackerEngine] ⚠️ Failed to load goals, seeding defaults:', e.message);
            this.seedInitialGoals();
        }
    }

    static seedInitialGoals() {
        this.goals.clear();
        this.createGoal({
            goalId: 'goal_arka_os_v1',
            title: 'Build ARKA OS v1 (Unified Personal AI OS)',
            projectRef: 'proj_arka',
            ownerId: 'person_agus',
            priority: 'HIGH',
            milestones: [
                { id: 'm27', name: 'Phase 27: Universal WhatsApp Capability Fabric', status: 'COMPLETED' },
                { id: 'm28', name: 'Phase 28: Universal Multimodal Intelligence Fabric', status: 'COMPLETED' },
                { id: 'm28a', name: 'Phase 28A: Global Command & Control Plane', status: 'COMPLETED' },
                { id: 'm29', name: 'Phase 29: Persistent World Model & Temporal Entity Engine', status: 'COMPLETED' },
                { id: 'm30', name: 'Phase 30: Causal & Uncertainty Engine', status: 'COMPLETED' },
                { id: 'm31', name: 'Phase 31: Evidence & Reality Grounding Layer', status: 'COMPLETED' },
                { id: 'm32', name: 'Phase 32: Goal & Open Loop Intelligence', status: 'ACTIVE' },
                { id: 'm60', name: 'Phase 60: ARKA OS v1 Master Release', status: 'PROPOSED' }
            ]
        });
    }

    static save(filePath = GOALS_FILE) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const list = Array.from(this.goals.values());
            fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
        } catch (e) {
            console.error('[GoalTrackerEngine] ❌ Failed to save goals:', e.message);
        }
    }

    static createGoal(data) {
        const milestones = (data.milestones || []).map((m, idx) => ({
            id: m.id || `m_${idx + 1}`,
            name: m.name || '',
            status: m.status || 'PENDING',
            completedAt: m.status === 'COMPLETED' ? Date.now() : null
        }));

        const completedCount = milestones.filter(m => m.status === 'COMPLETED').length;
        const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

        const goal = {
            goalId: data.goalId || `goal_${Date.now()}`,
            title: data.title || 'Untitled Goal',
            projectRef: data.projectRef || 'proj_general',
            ownerId: data.ownerId || 'person_agus',
            status: data.status || 'ACTIVE',
            priority: data.priority || 'NORMAL',
            milestones,
            progressPercent,
            createdAt: data.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        this.goals.set(goal.goalId, goal);
        return goal;
    }

    static updateMilestone(goalId, milestoneId, newStatus) {
        const goal = this.goals.get(goalId);
        if (!goal) return null;

        const milestone = goal.milestones.find(m => m.id === milestoneId);
        if (milestone) {
            milestone.status = newStatus;
            milestone.completedAt = newStatus === 'COMPLETED' ? Date.now() : null;
        }

        const completedCount = goal.milestones.filter(m => m.status === 'COMPLETED').length;
        goal.progressPercent = goal.milestones.length > 0 ? Math.round((completedCount / goal.milestones.length) * 100) : 0;
        if (goal.progressPercent === 100) goal.status = 'COMPLETED';
        goal.updatedAt = Date.now();

        this.save();
        return goal;
    }

    static getActiveGoals(projectRef = null) {
        const all = Array.from(this.goals.values());
        if (!projectRef) return all.filter(g => g.status !== 'COMPLETED' && g.status !== 'CANCELLED');
        return all.filter(g => g.projectRef === projectRef && g.status !== 'COMPLETED');
    }

    static formatGoalsSummary() {
        const active = this.getActiveGoals();
        if (active.length === 0) return 'Tidak ada goal aktif saat ini.';

        const lines = ['🎯 *ARKA ACTIVE GOALS & ROADMAP*\n───────────────────────'];
        for (const g of active) {
            lines.push(`📌 *${g.title}* [${g.progressPercent}%]`);
            for (const m of g.milestones.slice(0, 8)) {
                const icon = m.status === 'COMPLETED' ? '✅' : (m.status === 'ACTIVE' ? '⏳' : '◻️');
                lines.push(`  ${icon} ${m.name}`);
            }
        }
        return lines.join('\n');
    }
}
