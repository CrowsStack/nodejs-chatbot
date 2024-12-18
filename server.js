const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// CORS configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Initialize local data
const localData = require('./crowsstack.json');

// Load training data
const trainingData = require('./training-data.json');

// Conversation history
let conversationContext = {
    lastUserMessage: '',
    lastBotResponse: '',
    conversationState: 'initial',
    previousTopics: []
};

function createDetailedServiceResponse() {
    // Use the scraped data from crowsstack.json
    const websiteData = require('./crowsstack.json');
    
    // Extract key information from the website metadata
    const companyName = websiteData.metadata.company_name;
    const companyEmail = websiteData.metadata.email;

    // Define services with a more conversational tone
    const services = [
        {
            name: "Products & Services",
            description: "I'd be delighted to walk you through our amazing tech solutions! We have everything from web design to smart business strategies.",
            emoji: "💻"
        },
        {
            name: "Customer Support",
            description: `Need help? I'm here for you! You can reach our support team at ${companyEmail}. We're always ready to assist.`,
            emoji: "🤝"
        },
        {
            name: "Company Information",
            description: "Curious about who we are? We're a passionate team dedicated to bringing innovative technology solutions to businesses like yours.",
            emoji: "🌟"
        },
        {
            name: "Quick Consultation",
            description: "Would you like a free 15-minute consultation to understand how we can transform your business technology?",
            emoji: "📞"
        }
    ];

    // Create a warm, personalized response
    const serviceDescriptions = services
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(service => `${service.emoji} ${service.name}: ${service.description}`)
        .join('\n\n');

    const greetings = [
        "Hey there! 👋",
        "Hi, wonderful! 💖",
        "Greetings! 🌈"
    ];

    const closings = [
        "How can I help you today?",
        "What would you like to know more about?",
        "I'm all ears and ready to assist!"
    ];

    return `${greetings[Math.floor(Math.random() * greetings.length)]} I'm Sarah, your CrowsStack digital assistant.\n\n${serviceDescriptions}\n\n${closings[Math.floor(Math.random() * closings.length)]}`;
}

async function generateResponse(userMessage) {
    try {
        if (!userMessage || typeof userMessage !== 'string') {
            return "How can I help you today?";
        }

        const lowerMessage = userMessage.toLowerCase();
        
        // Handle conversation reset or new start
        if (lowerMessage.match(/^(hi|hello|hey|start over|reset|new conversation)$/)) {
            conversationContext = {
                lastUserMessage: '',
                lastBotResponse: '',
                conversationState: 'initial',
                previousTopics: []
            };
            return "Hi! How can I help you today? I'm ready to assist you.";
        }

        // Service-specific queries
        if (lowerMessage.includes('service') || lowerMessage.includes('offer')) {
            return createDetailedServiceResponse();
        }

        // Web Development specific query
        if (lowerMessage.includes('web') || lowerMessage.includes('website')) {
            const webDevService = trainingData.services.find(s => s.category === 'Web Development');
            return `Our Web Development services are designed to create powerful digital platforms:\n\n${webDevService.description}\n\nTechnologies we specialize in:\n${
                webDevService.technologies.map(tech => `• ${tech}`).join('\n')
            }\n\nReady to elevate your digital presence?`;
        }

        // AI and Machine Learning specific query
        if (lowerMessage.includes('ai') || lowerMessage.includes('machine learning')) {
            const aiService = trainingData.services.find(s => s.category === 'AI and Machine Learning');
            return `Unlock the power of AI with CrowsStack:\n\n${aiService.description}\n\nOur AI capabilities include:\n${
                aiService.key_offerings.map(offering => `• ${offering}`).join('\n')
            }\n\nLet's discuss how AI can transform your business.`;
        }

        // Cloud Solutions specific query
        if (lowerMessage.includes('cloud') || lowerMessage.includes('infrastructure')) {
            const cloudService = trainingData.services.find(s => s.category === 'Cloud Solutions');
            return `Scale and secure your business with our Cloud Solutions:\n\n${cloudService.description}\n\nCloud Partners:\n${
                cloudService.cloud_partners.map(partner => `• ${partner}`).join('\n')
            }\n\nWe're ready to optimize your cloud strategy.`;
        }

        const context = localData;
        const prompt = {
            contents: [{
                parts: [{
                    text: `Context: ${JSON.stringify(context, null, 2)}
Conversation History:
- Last User Message: ${conversationContext.lastUserMessage}
- Last Bot Response: ${conversationContext.lastBotResponse}
- Conversation State: ${conversationContext.conversationState}
- Previous Topics: ${conversationContext.previousTopics.join(', ')}

Current question: ${userMessage}

Guidelines:
1. Consider conversation history when responding
2. Provide context-aware responses
3. If it's a follow-up, expand on previous topic
4. Keep responses concise but informative
5. Track and reference previous topics

Your response:`
                }]
            }]
        };

        // Fallback to local response if API fails
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            const valuePropositions = trainingData.conversation_templates.value_proposition;
            return valuePropositions[Math.floor(Math.random() * valuePropositions.length)];
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prompt)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Response Error:', errorText);
                
                // Check for rate limit error
                if (errorText.includes('rate limit')) {
                    return "I'm experiencing high traffic. Please try again in a few minutes.";
                }
                
                const valuePropositions = trainingData.conversation_templates.value_proposition;
                return valuePropositions[Math.floor(Math.random() * valuePropositions.length)];
            }

            const result = await response.json();
            let generatedResponse;
            
            if (!result.candidates?.[0]?.content) {
                const valuePropositions = trainingData.conversation_templates.value_proposition;
                generatedResponse = valuePropositions[Math.floor(Math.random() * valuePropositions.length)];
            } else {
                generatedResponse = result.candidates[0].content.parts[0].text;
            }

            // Update conversation context
            conversationContext.lastUserMessage = userMessage;
            conversationContext.lastBotResponse = generatedResponse;
            
            // Track topics
            if (lowerMessage.includes('loan') && !conversationContext.previousTopics.includes('loan')) {
                conversationContext.previousTopics.push('loan');
                conversationContext.conversationState = 'discussing_loans';
            }
            
            if (lowerMessage.includes('company') && !conversationContext.previousTopics.includes('company')) {
                conversationContext.previousTopics.push('company');
                conversationContext.conversationState = 'discussing_company';
            }

            return generatedResponse;
        } catch (error) {
            console.error('Error:', error);
            const valuePropositions = trainingData.conversation_templates.value_proposition;
            return valuePropositions[Math.floor(Math.random() * valuePropositions.length)];
        }
    } catch (error) {
        console.error('Error:', error);
        const valuePropositions = trainingData.conversation_templates.value_proposition;
        return valuePropositions[Math.floor(Math.random() * valuePropositions.length)];
    }
}

function createFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Handle simple acknowledgments with more engaging responses
    const acknowledgments = ['okay', 'ok', 'alright', 'sure'];
    if (acknowledgments.includes(lowerMessage)) {
        const followupSuggestions = [
            "Is there anything specific you'd like to know more about?",
            "Feel free to ask about our services or products.",
            "Would you like to hear more about our features?",
            "I'm here to help! Do you want to learn more about our options?",
            "We have a lot to offer. Interested in hearing about our services?"
        ];
        return followupSuggestions[Math.floor(Math.random() * followupSuggestions.length)];
    }

    if (lowerMessage.match(/^(hi|hello|hey)$/)) {
        return "Hi! How can I help you today?";
    }

    if (lowerMessage.includes('company')) {
        return "We provide fast, financing for individuals and businesses. Would you like to know more about our mission or services?";
    }

    if (lowerMessage.includes('loan')) {
        return "We offer:\n• Quick loans\n• Business loans\n• Fast approval\n• No collateral needed\nWhich type of loan interests you most?";
    }

    const valuePropositions = trainingData.conversation_templates.value_proposition;
    return valuePropositions[Math.floor(Math.random() * valuePropositions.length)];
}

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const response = await generateResponse(userMessage);
        res.json({ response: response.trim() });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: true,
            response: "I'm having trouble processing your request. Please try again later."
        });
    }
});

// Serverless function export for Vercel
module.exports = app;

// Only start server if not in serverless environment
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
