// File: /api/map-proxy.js

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const mapUrl = 'https://www.panahon.gov.ph/';

  try {
    const pagasaResponse = await fetch(mapUrl);
    if (!pagasaResponse.ok) {
      throw new Error(`Failed to fetch map with status: ${pagasaResponse.status}`);
    }

    let html = await pagasaResponse.text();

    // This is the CSS we will inject to hide the unwanted parts of their page.
    const hidingStyles = `
      <style>
        /* Hide the top GOVPH navbar */
        .navbar.navbar-inverse.navbar-fixed-top.gov-ph { display: none !important; }
        /* Hide the main PAGASA header with the logo and time */
        body > .header { display: none !important; }
        /* Hide the entire left sidebar */
        #sidebar { display: none !important; }
        /* Hide everything below the map */
        .weather.hidden-xs, .media.hidden-xs, .contact-us.hidden-xs, .footer-frame { display: none !important; }
        /* Adjust the main content area to remove the sidebar's margin */
        .container-fluid.container-space { margin-left: 0 !important; }
        /* Ensure our map container takes up the full space */
        .map-weather-div { width: 100% !important; }
        /* Hide the mobile view elements just in case */
        .visible-xs.mobile-page { display: none !important; }
      </style>
    `;

    // Inject our styles into the <head> of their HTML
    html = html.replace('</head>', `${hidingStyles}</head>`);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error in map proxy:', error);
    res.status(500).send('<h1>Error loading map</h1><p>Could not fetch the map from the source.</p>');
  }
};