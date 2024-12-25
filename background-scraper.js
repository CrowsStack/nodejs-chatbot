const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class BackgroundScraper {
    constructor() {
        this.baseUrl = 'https://solar-t-wl47.vercel.app';
        this.pages = [
            '/',
            '/quote',
            '/services',
            '/about',
            '/blog',
            '/projects',
            '/contact'
        ];
        this.scrapedDataFile = path.join(__dirname, 'scraped-data.json');
        this.isRunning = false;
    }

    async fetchPage(url) {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error.message);
            return null;
        }
    }

    extractContent($) {
        const content = {
            title: $('title').text(),
            headings: [],
            paragraphs: [],
            links: [],
            lastUpdated: new Date().toISOString()
        };

        // Extract headings
        $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
            const text = $(elem).text().trim();
            if (text) content.headings.push(text);
        });

        // Extract paragraphs
        $('p').each((_, elem) => {
            const text = $(elem).text().trim();
            if (text) content.paragraphs.push(text);
        });

        // Extract links with text
        $('a').each((_, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            if (href && text) {
                content.links.push({ href, text });
            }
        });

        return content;
    }

    async scrapeAll() {
        const scrapedData = {
            pages: {},
            lastScraped: new Date().toISOString()
        };

        for (const page of this.pages) {
            const url = `${this.baseUrl}${page}`;
            console.log(`Scraping ${url}...`);
            const html = await this.fetchPage(url);
            
            if (html) {
                const $ = cheerio.load(html);
                scrapedData.pages[page] = this.extractContent($);
            }
        }

        return scrapedData;
    }

    async saveData(data) {
        try {
            await fs.writeFile(this.scrapedDataFile, JSON.stringify(data, null, 2));
            console.log('Scraped data saved successfully');
        } catch (error) {
            console.error('Error saving scraped data:', error);
        }
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        const updateInterval = 30 * 60 * 1000; // 30 minutes
        
        const runScraper = async () => {
            try {
                console.log('Starting scrape cycle:', new Date().toISOString());
                const data = await this.scrapeAll();
                await this.saveData(data);
                console.log('Scrape cycle completed:', new Date().toISOString());
            } catch (error) {
                console.error('Error in scrape cycle:', error);
            }
        };

        // Initial scrape
        await runScraper();

        // Set up regular interval
        setInterval(runScraper, updateInterval);
    }
}

// Start the background scraper
const scraper = new BackgroundScraper();
scraper.start().catch(console.error);
