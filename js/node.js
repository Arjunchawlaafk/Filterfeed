const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Helper function to read cache.json data
function getCacheData() {
    // Adjust the path to point correctly to cache.json
    const cacheFilePath = path.join(__dirname, '../../cache.json');
    try {
        const data = fs.readFileSync(cacheFilePath, 'utf8');
        return JSON.parse(data); // Parse the JSON data
    } catch (error) {
        console.error('Error reading cache.json:', error);
        return {}; // Return an empty object if there's an error
    }
}

// Define routes for each news category
app.get('/financial-news', (req, res) => {
    const data = getCacheData();
    res.json(data.generalNews || []); // Serve cached general news or an empty array
});

app.get('/business-news', (req, res) => {
    const data = getCacheData();
    res.json(data.businessNews || []); // Serve cached business news or an empty array
});

app.get('/video-news', (req, res) => {
    const data = getCacheData();
    res.json(data.videoNews || []); // Serve cached video news or an empty array
});

app.get('/newsdata', (req, res) => {
    const data = getCacheData();
    res.json(data.newsData || []); // Serve cached newsData or an empty array
});

app.get('/main-news', (req, res) => {
    const data = getCacheData();
    res.json(data.mainNews || []); // Serve cached main news or an empty array
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
