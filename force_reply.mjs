
import fs from 'fs';
import { createAIGateway } from './src/ai/index.mjs';

(async () => {
  try {
    const aiGateway = createAIGateway(process.env.GEMINI_API_KEY.split(',')[0]);
    const memPath = './memory/6285600596826_s_whatsapp_net.json';
    if (!fs.existsSync(memPath)) {
      console.log('Memory not found!');
      process.exit(1);
    }
    const mem = JSON.parse(fs.readFileSync(memPath, 'utf8'));
    const lastMsg = mem.shortTerm[mem.shortTerm.length - 1];
    
    console.log('📝 Chat terakhir Novita yg gantung:', lastMsg.text);
    
    const result = await aiGateway.generate(lastMsg.text, {
      history: mem.shortTerm.slice(-15),
      systemPrompt: "Kamu adalah asisten/sahabat dekat. Jawab dengan santai, nyambung, tidak kaku, dan JANGAN mengaku AI."
    });
    
    console.log('🤖 Jawaban AI yg seharusnya:', result.response);
  } catch (e) {
    console.log(e);
  }
  process.exit(0);
})();
