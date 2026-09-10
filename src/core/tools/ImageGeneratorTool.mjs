// src/core/tools/ImageGeneratorTool.mjs
// Instant AI Image Generation for WhatsApp via Pollinations FLUX Engine (Zero API Key, High Res)

export class ImageGeneratorTool {
    /**
     * Checks if the message text is an image generation request
     * Examples: "gambarin kucing naik rx king", "bikinin gambar naga terbang", "generate image cyberpunk girl"
     * @param {string} text 
     * @returns {boolean}
     */
    static isImageRequest(text = '') {
        const lower = (text || '').trim().toLowerCase();
        return Boolean(
            lower.startsWith('gambarin ') ||
            lower.startsWith('gambar: ') ||
            lower.startsWith('gambar ') ||
            lower.startsWith('bikinin gambar ') ||
            lower.startsWith('buatkan gambar ') ||
            lower.startsWith('generate image ') ||
            lower.startsWith('bikin gambar ') ||
            lower.includes('tolong gambarkan')
        );
    }

    /**
     * Extracts clean prompt from user request
     * @param {string} text 
     * @returns {string}
     */
    static extractPrompt(text = '') {
        let p = (text || '').trim();
        p = p.replace(/^(?:salim\s+)?(?:tolong\s+)?(?:gambarin|gambar:|gambar|bikinin gambar|buatkan gambar|generate image|bikin gambar|tolong gambarkan)\s*/i, '').trim();
        return p;
    }

    /**
     * Generates image buffer from prompt
     * @param {string} userPrompt 
     * @returns {Promise<{ success: boolean, buffer?: Buffer, prompt: string, error?: string }>}
     */
    static async generate(userPrompt) {
        try {
            console.log('[ImageGenerator] 🎨 Generating AI image for: "' + userPrompt + '"');
            
            // Build Pollinations FLUX URL with enhance and clean quality
            const encoded = encodeURIComponent(userPrompt + ', highly detailed, 4k resolution, cinematic lighting');
            const url = 'https://image.pollinations.ai/prompt/' + encoded + '?width=1024&height=1024&model=flux&nologo=true&seed=' + Math.floor(Math.random() * 1000000);

            const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
            if (!res.ok) {
                throw new Error('HTTP ' + res.status);
            }

            const arrayBuf = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            console.log('[ImageGenerator] ✅ Image generated successfully (' + (buffer.length / 1024).toFixed(1) + ' KB)');
            return {
                success: true,
                buffer,
                prompt: userPrompt
            };
        } catch (err) {
            console.error('[ImageGenerator] ❌ Generation error:', err.message);
            return {
                success: false,
                prompt: userPrompt,
                error: err.message
            };
        }
    }
}
