// src/core/multimodal/processors/LinkIntelligenceProcessor.mjs
// Link Intelligence: URL extraction, domain classification, and web entity binding

export class LinkIntelligenceProcessor {
    /**
     * Processes link / URL
     * @param {Object} params
     * @param {string} params.url
     * @param {string} [params.surroundingText='']
     * @returns {Object} Link Analysis
     */
    static process({ url = '', surroundingText = '' }) {
        let domain = '';
        try {
            domain = new URL(url).hostname;
        } catch (e) {
            domain = url.split('/')[0];
        }

        let linkCategory = 'GENERAL_WEB';
        if (/github\.com/i.test(domain)) linkCategory = 'CODE_REPOSITORY';
        else if (/maps\.google|goo\.gl\/maps/i.test(domain) || /maps\.app\.goo\.gl/i.test(domain)) linkCategory = 'GOOGLE_MAPS';
        else if (/kompas|detik|cnn|reuters|tempo/i.test(domain)) linkCategory = 'NEWS_ARTICLE';
        else if (/tokopedia|shopee|bukalapak|lazada/i.test(domain)) linkCategory = 'ECOMMERCE';

        return {
            modality: 'LINK',
            url,
            domain,
            linkCategory,
            extractedText: `Link [${linkCategory}]: ${url} (${surroundingText || ''})`,
            urlEntity: {
                id: `url_${domain.replace(/[^a-zA-Z0-9]/g, '_')}`,
                domain,
                type: 'URL'
            },
            isUnderstood: Boolean(url)
        };
    }
}
