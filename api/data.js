// Vercel serverless function — read-only, data is bundled at deploy time
const data = require('../data.json');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    return res.status(200).json(data);
  }

  // PUT/DELETE silently rejected — this deployment is read-only
  return res.status(405).json({ error: 'Read-only deployment. Edits are only saved in your local copy.' });
};
