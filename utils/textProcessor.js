const cleanText = {
    // Remove extra whitespace and normalize spacing
    normalizeSpaces: (text) => {
        return text.replace(/\s+/g, ' ').trim();
    },

    // Remove special characters but keep basic punctuation
    removeSpecialChars: (text) => {
        return text.replace(/[^\w\s.,!?;:()\-'""]/g, ' ');
    },

    // Format currency values to Naira
    formatCurrency: (text) => {
        return text.replace(/(\d+),(\d{3})/g, '₦$1,$2');
    },

    // Format phone numbers consistently
    formatPhoneNumber: (text) => {
        return text.replace(/(\+234|0)(\d{3})(\d{3})(\d{4})/, '+234 ($2) $3-$4');
    },

    // Clean up HTML artifacts
    removeHtmlArtifacts: (text) => {
        return text
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    },

    // Format lists consistently
    formatLists: (text) => {
        return text.replace(/[•*-]\s*/g, '• ');
    },

    // Clean up email addresses
    formatEmail: (text) => {
        return text.replace(/\[email\s*protected\]/g, 'support@crowsstack.com.ng');
    },

    // Process a complete text block
    processText: (text) => {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let processed = text;
        processed = cleanText.removeHtmlArtifacts(processed);
        processed = cleanText.normalizeSpaces(processed);
        processed = cleanText.removeSpecialChars(processed);
        processed = cleanText.formatCurrency(processed);
        processed = cleanText.formatPhoneNumber(processed);
        processed = cleanText.formatLists(processed);
        processed = cleanText.formatEmail(processed);
        return processed;
    }
};

module.exports = cleanText;
