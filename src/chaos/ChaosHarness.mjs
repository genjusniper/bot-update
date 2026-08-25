// src/chaos/ChaosHarness.mjs
import { EventBus } from '../event/EventBus.mjs';
import { JobQueue } from '../queue/JobQueue.mjs';
import { PluginManager } from '../plugins/PluginManager.mjs';
import { ChannelRegistry } from '../runtime/ChannelRegistry.mjs';
import { setTimeout } from 'timers/promises';

export class ChaosHarness {
    static async triggerApiFailure(providerName) {
        console.log(`[CHAOS] Triggering API Failure for ${providerName}`);
        EventBus.emit('metrics:api_usage', {
            provider: providerName,
            status: 429,
            latencyMs: 100
        });
    }

    static async injectNetworkLoss(durationMs) {
        console.log(`[CHAOS] Simulating Network Loss for ${durationMs}ms`);
        EventBus.emit('chaos:network_loss', { durationMs });
    }

    static async injectSqliteLock() {
        console.log(`[CHAOS] Simulating SQLite DB Lock`);
        try {
            JobQueue.db.prepare('BEGIN EXCLUSIVE TRANSACTION').run();
            await setTimeout(3000);
            JobQueue.db.prepare('COMMIT').run();
        } catch (e) {
            console.log(`[CHAOS] SQLite Lock simulation ended. (${e.message})`);
        }
    }

    static async floodEvents(chatId, count) {
        console.log(`[CHAOS] Flooding ${count} concurrent events to ${chatId}`);
        for (let i = 0; i < count; i++) {
            try {
                // In wa-bot-v10, we directly emit to EventBus to simulate incoming webhook
                // because ChannelRegistry.routeInbound might just wrap it. Let's do both.
                EventBus.emit('whatsapp:message', {
                    key: { remoteJid: chatId, fromMe: false, id: `CHAOS_${i}` },
                    message: { conversation: `Chaos message ${i}` },
                    pushName: 'Chaos Tester',
                    timestamp: Date.now()
                });
            } catch(e) {
                console.log('Flood warning:', e.message);
            }
        }
    }

    static async crashPlugin(pluginId) {
        console.log(`[CHAOS] Simulating Plugin Crash for ${pluginId}`);
        // Just trigger an event that will cause an unhandled exception if not caught
        EventBus.emit('plugin:crash_test', { pluginId });
    }
}
