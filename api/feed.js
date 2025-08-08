// api/feed.js  (Vercel serverless function)
export default async function handler(req, res) {
  const feed = await fetch('https://publicalert.pagasa.dost.gov.ph/feeds/');
  const xml  = await feed.text();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
}