const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());

// Path to scraped data
const scrapedDataFile = path.join(__dirname, 'crowsstack.json'); // Change to crowsstack.json

// Function to fetch scraped data
async function getScrapedData() {
    try {
        const rawData = await fs.readFile(scrapedDataFile, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error reading scraped data:', error);
        throw new Error('Scraped data not available');
    }
}

app.get('/crowsstack.json', async (req, res) => {
    try {
        const scrapedData = await getScrapedData();
        res.json(scrapedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.DATA_SERVER_PORT || 3001;
app.listen(PORT, () => {
    console.log(`Data server is running on port ${PORT}`);
});

module.exports = app;