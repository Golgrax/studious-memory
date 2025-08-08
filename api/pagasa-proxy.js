// File: /api/pagasa-proxy.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const feedUrl = 'https://publicalert.pagasa.dost.gov.ph/feeds/';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache for 5 minutes

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const pagasaResponse = await fetch(feedUrl);

    if (!pagasaResponse.ok) {
      console.error(`PAGASA feed fetch failed with status: ${pagasaResponse.status}`);
      return res.status(pagasaResponse.status).json({ error: 'Failed to fetch PAGASA feed' });
    }

    const xmlData = await pagasaResponse.text();

    res.setHeader('Content-Type', 'application/atom+xml');
    res.status(200).send(xmlData);

  } catch (error) {
    console.error('Error in PAGASA proxy:', error);
    res.status(500).json({ error: 'Internal Server Error while fetching feed.' });
  }
};