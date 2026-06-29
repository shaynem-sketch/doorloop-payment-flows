// Vercel Serverless Function: /api/state
// Reads and writes state.json in the GitHub repo
// Requires GITHUB_TOKEN env var in Vercel project settings

const REPO = 'shaynem-sketch/doorloop-payment-flows';
const FILE_PATH = 'state.json';
const BRANCH = 'main';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });

  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'doorloop-gap-analysis'
  };

  // GET: Read current state
  if (req.method === 'GET') {
    try {
      const resp = await fetch(apiUrl, { headers });
      if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to read state' });
      const data = await resp.json();
      const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      return res.status(200).json({ state: content, sha: data.sha });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST: Write updated state
  if (req.method === 'POST') {
    try {
      const { state, sha } = req.body;
      if (!state || !sha) return res.status(400).json({ error: 'Missing state or sha' });

      const content = Buffer.from(JSON.stringify(state, null, 2)).toString('base64');
      const resp = await fetch(apiUrl, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Update gap analysis state (${state.updatedBy || 'unknown'})`,
          content,
          sha,
          branch: BRANCH
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        return res.status(resp.status).json({ error: err.message || 'Write failed' });
      }

      const result = await resp.json();
      return res.status(200).json({ success: true, sha: result.content.sha });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
