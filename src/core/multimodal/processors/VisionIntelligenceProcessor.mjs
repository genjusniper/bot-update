// src/core/multimodal/processors/VisionIntelligenceProcessor.mjs
// Vision & Image Intelligence: OCR, Visual Entity Classification, and Contextual Scene Understanding

export class VisionIntelligenceProcessor {
    /**
     * Processes images, screenshots, or documents-as-images into structured vision intelligence
     * @param {Object} params
     * @param {string} [params.caption='']
     * @param {string} [params.simulatedOcrText='']
     * @param {Object} [params.metadata={}]
     * @param {Object} [params.context={}]
     * @returns {Object} Vision Analysis
     */
    static process({ caption = '', simulatedOcrText = '', metadata = {}, context = {} }) {
        const fullExtractedText = [caption, simulatedOcrText].filter(Boolean).join(' | ');
        const lower = fullExtractedText.toLowerCase();

        // 1. Classify Visual Entities & Scene Type
        const visualEntities = [];
        let visualCategory = 'GENERAL_PHOTO';

        if (/error|exception|stack trace|failed|errno|syntaxerror/i.test(lower)) {
            visualCategory = 'SCREENSHOT_ERROR';
            visualEntities.push({ label: 'ERROR_LOG', confidence: 0.95 });
        } else if (/arsitektur|architecture|diagram|workflow|flowchart|graf|skema|schema/i.test(lower)) {
            visualCategory = 'ARCHITECTURE_DIAGRAM';
            visualEntities.push({ label: 'SYSTEM_DIAGRAM', confidence: 0.92 });
        } else if (/function|class|import|const|let|return/i.test(lower)) {
            visualCategory = 'CODE_SNIPPET';
            visualEntities.push({ label: 'SOURCE_CODE', confidence: 0.90 });
        } else if (metadata.isSticker) {
            visualCategory = 'STICKER_MEME';
            visualEntities.push({ label: 'EXPRESSION_STICKER', confidence: 0.85 });
        }

        // 2. Action Candidate
        const actionCandidates = [];
        if (visualCategory === 'SCREENSHOT_ERROR') {
            actionCandidates.push({ action: 'DIAGNOSE_ERROR', priority: 'HIGH' });
        } else if (visualCategory === 'ARCHITECTURE_DIAGRAM') {
            actionCandidates.push({ action: 'SUMMARIZE_ARCHITECTURE', priority: 'NORMAL' });
        }

        return {
            modality: metadata.isSticker ? 'STICKER' : 'IMAGE',
            visualCategory,
            extractedText: fullExtractedText,
            visualEntities,
            actionCandidates,
            isUnderstood: true
        };
    }
}
