// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000; // Use the port you prefer, 4000 in this case

// Serve static files from the root directory (including HTML files)
app.use(express.static(path.join(__dirname)));

// Fetch API key from environment variables
const API_KEY = process.env.API_KEY;

const cacheFilePath = path.join(__dirname, 'newsCache.json');
const CACHE_EXPIRY_MS = (5 * 60 + 30) * 60 * 1000; // 5 hours 30 minutes
const REQUEST_INTERVAL_MS = 1000; // 1 request per second

let newsCache = {};

// Load existing cache if available
if (fs.existsSync(cacheFilePath)) {
    newsCache = JSON.parse(fs.readFileSync(cacheFilePath));
}

const allowedCategories = [
    'politics' //, 'tech'  List of allowed categories
];

// Fetch news for a specific category with retry on rate limiting 
const fetchNewsWithRetry = async (category) => {
    const url = `https://api.newscatcherapi.com/v2/latest_headlines?topic=${category}&lang=en&page_size=100`;
    for (let retries = 0; retries < 5; retries++) {
        try {
            console.log(`Fetching news for category: ${category} (Attempt ${retries + 1})`);
            const response = await axios.get(url, {
                headers: { 'x-api-key': API_KEY },
            });
            console.log(`Fetched ${response.data.articles.length} articles for category: ${category}`);
            return response.data.articles || [];
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log(`Rate limit hit for category "${category}". Retrying in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL_MS));
            } else {
                console.error(`Error fetching ${category} news:`, error);
                return [];
            }
        }
    }
    console.error(`Failed to fetch news for category "${category}" after retries`);
    return [];
};

// Fetch the news only if it's expired or missing from the cache
const fetchNewsIfNeeded = async () => {
    const now = Date.now();

    // Check if the cache has expired for any category or if there's no cache
    for (const category of allowedCategories) {
        if (!newsCache[category] || (now - newsCache[category].timestamp > CACHE_EXPIRY_MS)) {
            console.log(`Fetching news for category: ${category}`);
            const articles = await fetchNewsWithRetry(category);
            newsCache[category] = { timestamp: now, articles };
            saveCacheToFile();
        } else {
            console.log(`Using cached data for category: ${category}`);
        }

        // Delay before processing the next category to prevent overloading API
        await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL_MS));
    }
};

// Save the cache to a file
const saveCacheToFile = () => {
    fs.writeFileSync(cacheFilePath, JSON.stringify(newsCache, null, 2));
};

// Endpoint to get news by category
app.get('/news/:category', async (req, res) => {
    const category = req.params.category;

    // Validate category
    if (!allowedCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category. Allowed categories are: ' + allowedCategories.join(', ') });
    }

    const now = Date.now();

    // Check if the articles are in the cache and if they are still valid
    if (newsCache[category] && (now - newsCache[category].timestamp < CACHE_EXPIRY_MS)) {
        console.log('Returning cached data for category:', category);
        return res.json(newsCache[category].articles);
    } else {
        console.log('Cache expired or no cache found. Fetching news...');
        const articles = await fetchNewsWithRetry(category);
        newsCache[category] = { timestamp: now, articles }; // Cache the articles
        saveCacheToFile(); // Save updated cache
        return res.json(articles);
    }
});

// Run the periodic fetch operation for news (only once on server start)
const schedulePeriodicFetch = async () => {
    await fetchNewsIfNeeded();
    setInterval(fetchNewsIfNeeded, CACHE_EXPIRY_MS); // Re-fetch every 5 hours and 30 minutes
};

// Define routes for different pages
app.get('/Home', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html from the root
});

app.get('/About-us', (req, res) => {
    res.sendFile(path.join(__dirname, 'about-us.html')); // Serve about-us.html
});

app.get('/Contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html')); // Serve contact.html
});

// Define routes for different pages
app.get('/Acknowledgements', (req, res) => {
    res.sendFile(path.join(__dirname, 'Acknowledgements.html')); // Serve index.html from the root
});

app.get('/Business', (req, res) => {
    res.sendFile(path.join(__dirname, 'business.html')); // Serve about-us.html
});

app.get('/Economics', (req, res) => {
    res.sendFile(path.join(__dirname, 'economics.html')); // Serve contact.html
});

app.get('/Entertainment', (req, res) => {
    res.sendFile(path.join(__dirname, 'entertainment.html')); // Serve contact.html
});

app.get('/Finance', (req, res) => {
    res.sendFile(path.join(__dirname, 'finance.html')); // Serve contact.html
});

app.get('/Politics', (req, res) => {
    res.sendFile(path.join(__dirname, 'Politics.html')); // Serve contact.html
});

app.get('/Privacy-Policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacypolicy.html')); // Serve contact.html
});

app.get('/Science', (req, res) => {
    res.sendFile(path.join(__dirname, 'science.html')); // Serve contact.html
});

app.get('/Sports', (req, res) => {
    res.sendFile(path.join(__dirname, 'sports.html')); // Serve contact.html
});

app.get('/Tech', (req, res) => {
    res.sendFile(path.join(__dirname, 'tech.html')); // Serve contact.html
});

app.get('/World', (req, res) => {
    res.sendFile(path.join(__dirname, 'World.html')); // Serve contact.html
});

app.get('/Terms-and-Conditions', (req, res) => {
    res.sendFile(path.join(__dirname, 'Termsandconditions.html')); // Serve contact.html
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    schedulePeriodicFetch(); // Schedule news fetch when the server starts
});
