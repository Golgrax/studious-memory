// File: /api/pagasa-proxy.js

// We use node-fetch to make the request on the server-side.
// You'll need to add it to your project's dependencies.
// Run: npm install node-fetch
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const feedUrl = 'https://publicalert.pagasa.dost.gov.ph/feeds/';

  // Allow requests from any origin. For production, you might want to restrict this
  // to your actual Vercel domain.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache for 5 minutes

  // Handle pre-flight CORS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const pagasaResponse = await fetch(feedUrl);

    // Check if the request to PAGASA was successful
    if (!pagasaResponse.ok) {
      console.error(`PAGASA feed fetch failed with status: ${pagasaResponse.status}`);
      return res.status(pagasaResponse.status).json({ error: 'Failed to fetch PAGASA feed' });
    }

    const xmlData = await pagasaResponse.text();

    // Send the fetched XML data back to your frontend
    res.setHeader('Content-Type', 'application/atom+xml');
    res.status(200).send(xmlData);

  } catch (error) {
    console.error('Error in PAGASA proxy:', error);
    res.status(500).json({ error: 'Internal Server Error while fetching feed.' });
  }
};