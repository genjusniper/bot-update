import { WhatsAppGateway } from './WhatsAppGateway.mjs';
import { AdminCommandListener } from './AdminCommandListener.mjs';
import { ApprovalEngine } from './src/sales/approval/ApprovalEngine.mjs';
import { LeadStorage } from './src/sales/approval/LeadStorage.mjs';
import { SalesGuard } from './src/sales/guard/SalesGuard.mjs';
import dotenv from 'dotenv';
dotenv.config();

async function start() {
    console.log("=== Starting AI Sales Bot ===");
    
    const gateway = new WhatsAppGateway('auth-v5-test');
    await gateway.connect();
    
    const storage = new LeadStorage('./data/ledger');
    const approval = new ApprovalEngine(storage);
    const outbox = []; 
    
    const ownerIds = process.env.OWNER_CHAT_IDS || '628123456789@s.whatsapp.net';
    const adminUI = new AdminCommandListener(gateway, ownerIds, approval, outbox);
    adminUI.start();

    setInterval(async () => {
        while(outbox.length > 0) {
            const task = outbox.shift();
            console.log(`[OutboundWorker] Processing lead ${task.leadId}`);
            
            const guard = new SalesGuard({ 
                leadId: task.leadId, 
                action: 'OUTBOUND_MESSAGE',
                token: task.token
            });
            const policy = await guard.checkPolicy();
            
            if (policy.allowed) {
                console.log(`[OutboundWorker] SalesGuard PERMITTED. Sending WA...`);
                const msg = `Halo! Kami perhatikan warung Anda di Semarang sering ramai. Kami supplier telur murah berkualitas, apakah berkenan jika kami kirimkan pricelist?`;
                
                const targetNumber = ownerIds.split(',')[0].trim();
                
                await gateway.sendMessage(targetNumber, msg);
                console.log(`[OutboundWorker] ✅ Message sent to ${targetNumber}`);
            } else {
                console.log(`[OutboundWorker] ❌ SalesGuard BLOCKED: ${policy.reason}`);
            }
        }
    }, 10000);
}

start().catch(console.error);
