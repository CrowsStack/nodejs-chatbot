const express = require('express');
const cors = require('cors');
const scraper = require('./scraper');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());

// CrowsStack comprehensive company data
const data = {
    "company_info": {
        "name": "CrowsStack",
        "description": "Your innovative technology solutions partner, established to provide cutting-edge web and digital services.",
        "products": [
            {
                "name": "Web Development",
                "description": "Custom web solutions tailored to your business needs",
                "features": [
                    "Responsive design",
                    "Modern technology stack",
                    "SEO optimization",
                    "Performance-driven development",
                    "Ongoing support"
                ],
                "eligibility": [
                    "Businesses of all sizes",
                    "Startups and established companies",
                    "Diverse industry sectors"
                ]
            }
        ],
        "faqs": [
            {
                "question": "What technologies do you use?",
                "answer": "We leverage modern web technologies including Node.js, React, and cloud services."
            }
        ],
        "support": {
            "channels": [
                {
                    "type": "Email",
                    "availability": "Business hours"
                }
            ]
        }
    }
};

// Path to scraped data
const scrapedDataFile = path.join(__dirname, 'scraped-data.json');

// Function to merge static and scraped data
async function getMergedData() {
    try {
        // Get static data
        const staticData = data;

        // Try to get scraped data
        let scrapedData = {};
        try {
            const rawData = await fs.readFile(scrapedDataFile, 'utf8');
            scrapedData = JSON.parse(rawData);
        } catch (error) {
            console.log('No scraped data available yet');
        }

        // Merge the data
        return {
            ...staticData,
            website_content: scrapedData,
            last_updated: scrapedData.lastScraped || new Date().toISOString()
        };
    } catch (error) {
        console.error('Error merging data:', error);
        return data; // Fallback to static data
    }
}

app.get('/crowsstack.json', async (req, res) => {
    const mergedData = await getMergedData();
    res.json(mergedData);
});

// Start the server
const PORT = process.env.DATA_SERVER_PORT || 3001;
app.listen(PORT, () => {
    console.log(`Data server is running on port ${PORT}`);
});

module.exports = app;
