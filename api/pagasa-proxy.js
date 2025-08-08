// File: /api/pagasa-proxy.js

const fetch = require('node-fetch');

// Define the allowed domain for security
const ALLOWED_DOMAIN = 'publicalert.pagasa.dost.gov.ph';

module.exports = async (req, res) => {
  // The target URL can be provided as a query parameter...
  const targetUrl = req.query.url;
  // ...or we fall back to the main feed URL.
  const defaultFeedUrl = `https://${ALLOWED_DOMAIN}/feeds/`;

  const urlToFetch = targetUrl || defaultFeedUrl;

  // --- Security Check ---
  // Ensure the requested URL is from the allowed PAGASA domain
  try {
    const hostname = new URL(urlToFetch).hostname;
    if (hostname !== ALLOWED_DOMAIN) {
      return res.status(400).json({ error: 'Invalid domain requested.' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }
  // --------------------

  // Set CORS and Cache headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const pagasaResponse = await fetch(urlToFetch);

    if (!pagasaResponse.ok) {
      console.error(`PAGASA fetch failed for ${urlToFetch} with status: ${pagasaResponse.status}`);
      return res.status(pagasaResponse.status).json({ error: `Failed to fetch from PAGASA: ${pagasaResponse.statusText}` });
    }

    const xmlData = await pagasaResponse.text();

    res.setHeader('Content-Type', 'application/atom+xml');
    res.status(200).send(xmlData);

  } catch (error) {
    console.error(`Error in PAGASA proxy fetching ${urlToFetch}:`, error);
    res.status(500).json({ error: 'Internal Server Error while fetching data.' });
  }
};