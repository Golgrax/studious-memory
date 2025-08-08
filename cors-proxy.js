// Simple CORS Proxy for PAGASA API
// This can be deployed as a separate service or integrated into the main application

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Proxy endpoint for PAGASA feeds
app.get('/api/pagasa/feeds', async (req, res) => {
    try {
        const response = await fetch('https://publicalert.pagasa.dost.gov.ph/feeds/');
        const data = await response.text();
        
        res.set('Content-Type', 'application/xml');
        res.send(data);
    } catch (error) {
        console.error('Error fetching PAGASA feeds:', error);
        res.status(500).json({ error: 'Failed to fetch PAGASA feeds' });
    }
});

// Proxy endpoint for individual CAP files
app.get('/api/pagasa/cap/*', async (req, res) => {
    try {
        const capPath = req.params[0];
        const capUrl = `https://publicalert.pagasa.dost.gov.ph/${capPath}`;
        
        const response = await fetch(capUrl);
        const data = await response.text();
        
        res.set('Content-Type', 'application/xml');
        res.send(data);
    } catch (error) {
        console.error('Error fetching CAP file:', error);
        res.status(500).json({ error: 'Failed to fetch CAP file' });
    }
});

app.listen(PORT, () => {
    console.log(`CORS Proxy server running on port ${PORT}`);
});

module.exports = app;

