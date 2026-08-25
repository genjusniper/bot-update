// FLOW TRACER: Simulates a real incoming WhatsApp message through the ENTIRE pipeline
import dotenv from 'dotenv';
dotenv.config();

const log = (step, msg, ok = true) => {
    const icon = ok ? '✅' : '❌';
    console.log(`${icon} [${step}] ${msg}`);
};

(async () => {
    console.log('================================================================');
    console.log('🧬 FULL PIPELINE FLOW TRACER — V13.5 Live on Termux');
    console.log('================================================================\n');

    // ─── STEP 1: PersonalCoPilotGuard (Private chat from VIP)
    const { PersonalCoPilotGuard } = await import('./src/security/copilot/PersonalCoPilotGuard.mjs');
    const gate1 = await PersonalCoPilotGuard.evaluateGatekeeper({
        chatId: '6281325554282@s.whatsapp.net',
        groupSubject: '',
        text: 'hei aiku lagi apa?',
        fromMe: false,
        isGroup: false,
        rawMessage: {},
        ownerJid: null
    });
    log('GATE:PRIVATE_VIP', `allowAI=${gate1.allowAI} reason=${gate1.reason}`, gate1.allowAI);

    // ─── STEP 2: PersonalCoPilotGuard (Private chat from UNKNOWN number — SHOULD BE SILENT)
    const gate2 = await PersonalCoPilotGuard.evaluateGatekeeper({
        chatId: '628999000111@s.whatsapp.net',
        groupSubject: '',
        text: 'halo kamu siapa?',
        fromMe: false,
        isGroup: false,
        rawMessage: {},
        ownerJid: null
    });
    log('GATE:PRIVATE_UNKNOWN', `allowAI=${gate2.allowAI} reason=${gate2.reason} (Expected: SILENT)`, !gate2.allowAI);

    // ─── STEP 3: PersonalCoPilotGuard (Group — no tag, should be SILENT)
    const gate3 = await PersonalCoPilotGuard.evaluateGatekeeper({
        chatId: '120363426279510545@g.us',
        groupSubject: 'Semarang climbers',
        text: 'kapan kita janjian?',
        fromMe: false,
        isGroup: true,
        rawMessage: {},
        ownerJid: '628123456789@s.whatsapp.net'
    });
    log('GATE:GROUP_UNTAGGED', `allowAI=${gate3.allowAI} reason=${gate3.reason} (Expected: SILENT)`, !gate3.allowAI);

    // ─── STEP 4: DeepIntentRouter — Link detection
    const { DeepIntentRouter } = await import('./src/multimodal/DeepIntentRouter.mjs');
    const intent1 = DeepIntentRouter.classify('https://maps.app.goo.gl/abc123', { hasImage: false });
    log('INTENT:MAPS_LINK', `intent=${intent1.intent} url=${intent1.url}`, intent1.intent === 'LINK_ANALYSIS');

    const intent2 = DeepIntentRouter.classify('https://vt.tiktok.com/ZSjX123/', { hasImage: false });
    log('INTENT:TIKTOK_LINK', `intent=${intent2.intent}`, intent2.intent === 'LINK_ANALYSIS');

    const intent3 = DeepIntentRouter.classify('cek ini dong', { hasImage: true });
    log('INTENT:PHOTO', `intent=${intent3.intent}`, intent3.intent === 'IMAGE_ANALYSIS');

    // ─── STEP 5: DontOverhelpEngine 
    const { DontOverhelpEngine } = await import('./src/social/v12/DontOverhelpEngine.mjs');
    const isVenting = DontOverhelpEngine.isVentingWithoutAdviceRequest('capek banget hari ini gue');
    log('DONTOVERHELP:VENTING', `detected=${isVenting} (Expected: true)`, isVenting === true);

    const isNotVenting = DontOverhelpEngine.isVentingWithoutAdviceRequest('gimana caranya bikin nasi goreng?');
    log('DONTOVERHELP:QUESTION', `detected=${isNotVenting} (Expected: false)`, isNotVenting === false);

    // ─── STEP 6: LocalCalculatorEngine
    const { LocalCalculatorEngine } = await import('./src/utility/LocalCalculatorEngine.mjs');
    const mathRes = LocalCalculatorEngine.calculate('hitung 30% dari 500000');
    log('CALCULATOR', `handled=${mathRes.handled} result="${mathRes.result}"`, mathRes.handled && mathRes.result.includes('150'));

    // ─── STEP 7: Real AI Gateway generation test
    console.log('\n[REAL AI GATEWAY] Testing Gemini 2.5 Flash with real message...');
    const { AIGatewayObservable } = await import('./src/resilience/AIGatewayObservable.mjs');
    const gw = new AIGatewayObservable();
    
    // Show fleet size
    const status = gw.fleet.getFleetStatus();
    log('FLEET', `Total keys: ${status.totalKeys}, Healthy: ${status.healthy}, Cooldown: ${status.cooldown}, Quarantined: ${status.quarantined}`, status.healthy > 0);
    
    const aiRes = await gw.generate(
        'Kamu adalah asisten ngobrol WhatsApp yang asik dan santai, berbahasa Indonesia casual / Jawa ringan.',
        [{ role: 'user', parts: [{ text: 'Hei aiku, rekomendasiin spot panjat tebing di sekitar Semarang dong yang bagus buat pemula' }] }]
    );
    log('AI_GATEWAY', `success=${aiRes.success} model=${aiRes.modelUsed} latency=${aiRes.latencyMs}ms`, aiRes.success);
    if (aiRes.success) {
        console.log('\n   📝 AI Response:\n   ' + aiRes.text.slice(0, 200) + '...\n');
    } else {
        console.log('   ❌ Error traces:', JSON.stringify(aiRes.telemetry?.traces, null, 2));
    }

    // ─── STEP 8: ContactPolicyEngine VIP check
    const { ContactPolicyEngine } = await import('./src/security/copilot/ContactPolicyEngine.mjs');
    const vip = await ContactPolicyEngine.getPolicyForContact('6281325554282@s.whatsapp.net');
    log('CONTACT_POLICY:VIP', `policy=${vip.policy} (Expected: AUTO)`, vip.policy === 'AUTO');

    const unknown = await ContactPolicyEngine.getPolicyForContact('628999000111@s.whatsapp.net');
    log('CONTACT_POLICY:UNKNOWN', `policy=${unknown.policy} (Expected: SILENT)`, unknown.policy === 'SILENT');

    console.log('\n================================================================');
    console.log('🏁 PIPELINE FLOW TRACER COMPLETE');
    console.log('================================================================');
})();
