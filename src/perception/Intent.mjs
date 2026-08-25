export class IntentEngine {
  static async analyze(aiGateway, message, workingMemory = []) {
    let msgText = Array.isArray(message) ? (message[1] || "Menganalisis media") : message;
    const prompt = `Sebagai Social Brain AI, analisis pesan user terakhir.
Pesan: "${msgText}"
Konteks: ${JSON.stringify(workingMemory.slice(-5))}

TENTUKAN "What Should I Do?" dari opsi ini: [listen, comfort, solution, joke, validate, react_only].
Jika user meminta eksekusi terminal, baca file, ubah file, atau aksi teknis spesifik, atur action="use_tool".
Tools yang tersedia:
- "shell" (args: "bash command yang akan dieksekusi")
- "read_file" (args: "path absolut/relatif ke file")
- "write_file" (args: "path_file|isi_konten")

Balas HANYA dengan JSON murni (tanpa \`\`\`json):
{
  "intent": "string",
  "tone": "string",
  "energy": "low|normal|high",
  "user_needs": ["..."],
  "detected_topic": "string",
  "action": "reply|silent|use_tool",
  "should_quote": boolean (true jika pesan user butuh di-quote/slide spesifik spt pertanyaan teknis atau panjang, false jika chat pendek/santai),
  "suggested_tool": "nama_tool atau null",
  "tool_args": "argumen_tool atau null"
}`;
    try {
      const result = await aiGateway.generate(prompt, { temperature: 0.1, responseMimeType: "application/json" });
      let rawText = result.response.replace(/^```json/im, '').replace(/^```/im, '').replace(/```$/m, '').trim();
      const match = rawText.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : rawText);
    } catch (error) {
      return { intent: "unknown", tone: "neutral", energy: "normal", user_needs: ["listen"], detected_topic: "general", action: "reply" };
    }
  }
}