const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const cleanText = require('./utils/textProcessor');

class WebScraper {
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
        this.scrapedDataFile = path.join(__dirname, 'crowsstack.json'); // Change to crowsstack.json
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
        const rawContent = {
            title: $('title').text(),
            headings: {},
            paragraphs: [],
            lists: [],
            contact_info: {
                phone: [],
                email: [],
                address: []
            }
        };

        // Extract headings
        for (let i = 1; i <= 6; i++) {
            const headings = [];
            $(`h${i}`).each((_, elem) => {
                const text = $(elem).text().trim();
                if (text) headings.push(text);
            });
            if (headings.length > 0) {
                rawContent.headings[`h${i}`] = headings;
            }
        }

        // Extract paragraphs
        $('p').each((_, elem) => {
            const text = $(elem).text().trim();
            if (text) rawContent.paragraphs.push(text);
        });

        // Extract lists
        $('ul, ol').each((_, list) => {
            const items = [];
            $(list).find('li').each((_, item) => {
                const text = $(item).text().trim();
                if (text) items.push(text);
            });
            if (items.length > 0) {
                rawContent.lists.push(items);
            }
        });

        // Extract contact information
        $('*').each((_, elem) => {
            const text = $(elem).text().trim();
            
            // Phone numbers
            const phoneMatch = text.match(/(\+234|0)\d{10}/);
            if (phoneMatch) rawContent.contact_info.phone.push(phoneMatch[0]);

            // Email addresses
            const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) rawContent.contact_info.email.push(emailMatch[0]);

            // Address (simple heuristic)
            if (text.toLowerCase().includes('address') || text.includes('location')) {
                const addressText = text.replace(/address:|location:/i, '').trim();
                if (addressText) rawContent.contact_info.address.push(addressText);
            }
        });

        // Clean and format the content
        return {
            title: cleanText.processText(rawContent.title),
            headings: Object.entries(rawContent.headings).reduce((acc, [key, values]) => {
                acc[key] = values.map(v => cleanText.processText(v));
                return acc;
            }, {}),
            content: {
                paragraphs: rawContent.paragraphs.map(p => cleanText.processText(p)),
                lists: rawContent.lists.map(list => list.map(item => cleanText.processText(item))),
                contact: {
                    phone: [...new Set(rawContent.contact_info.phone)].map(p => cleanText.formatPhoneNumber(p)),
                    email: [...new Set(rawContent.contact_info.email)].map(e => cleanText.formatEmail(e)),
                    address: [...new Set(rawContent.contact_info.address)].map(a => cleanText.processText(a))
                }
            }
        };
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

        // Process the entire dataset
                // Process the entire dataset
                return {
                    ...scrapedData,
                    processed: true,
                    version: '1.0'
                };
            }
        
            async saveData(data) {
                try {
                    // Save the scraped data to crowsstack.json in the root directory
                    await fs.writeFile(this.scrapedDataFile, JSON.stringify(data, null, 2));
                    console.log('Scraped data saved successfully to crowsstack.json');
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
        const scraper = new WebScraper();
        scraper.start().catch(console.error);