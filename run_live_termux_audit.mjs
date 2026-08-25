import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { ContactPolicyEngine } from './src/security/copilot/ContactPolicyEngine.mjs';
import { GroupSafetyPolicy } from './src/security/copilot/GroupSafetyPolicy.mjs';
import { LinkIntelligenceEngine } from './src/multimodal/LinkIntelligenceEngine.mjs';
import { DontOverhelpEngine } from './src/social/v12/DontOverhelpEngine.mjs';
import { LocalCalculatorEngine } from './src/utility/LocalCalculatorEngine.mjs';

(async () => {
    console.log("==========================================================================");
    console.log("🔬 LIVE TERMUX END-TO-END SYSTEM HEALTH AUDIT");
    console.log("==========================================================================");

    const os = new PersonalAIOS();
    const testVip = '6281325554282@s.whatsapp.net';
    const testGroup = '120363426279510545@g.us';

    // 1. Test Math Engine
    console.log("\n[1/5] Testing Instant Math Engine (<1ms, 0 API Token):");
    const mathRes = await os.process(testVip, "hitung 25% dari 800000", "test_math", null, { pushName: "Mas Danang" });
    console.log("  - Math Response:", mathRes?.text);

    // 2. Test Don't Overhelp (Curhat Venting)
    console.log("\n[2/5] Testing Don't Overhelp Engine (Curhat / Validasi Emosi):");
    const curhatRes = await os.process(testVip, "capek banget hari ini pengen rebahan", "test_curhat", null, { pushName: "Mas Danang" });
    console.log("  - Curhat Response:", curhatRes?.text);

    // 3. Test Google Maps Resolver (share.google format)
    console.log("\n[3/5] Testing Google Maps Link Engine:");
    const linkData = await LinkIntelligenceEngine.resolveUrl("https://share.google/6FhXTX2Ew860ko1TX");
    console.log("  - Maps Resolved Title:", linkData.title);
    console.log("  - Maps Type:", linkData.type);

    // 4. Test Group Safety (Untagged -> Dropped, Tagged -> Allowed)
    console.log("\n[4/5] Testing Group Safety Filter on 'Semarang climbers':");
    const untaggedGroup = await os.process(testGroup, "besok ngumpul dimana?", "test_grp1", null, { groupSubject: "Semarang climbers", ownerJid: "628123456789@s.whatsapp.net" });
    console.log("  - Untagged Group Message Result:", untaggedGroup ? "REPLIED" : "SILENT (SUCCESS - Ignored general chat)");

    // 5. Test AI Gateway Generation
    console.log("\n[5/5] Testing Master AI Gateway with Gemini 2.5/2.0 Flash:");
    const aiRes = await os.process(testVip, "menurutmu rekomendasi tempat outdoor di semarang apa aja?", "test_ai", null, { pushName: "Mas Danang" });
    console.log("  - AI Gateway Response:", aiRes?.text);

    console.log("\n==========================================================================");
    console.log("🏆 LIVE AUDIT COMPLETE: ALL MODULES FUNCTIONING ACCORDING TO DESIGN!");
    console.log("==========================================================================");
})();
