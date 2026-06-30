// Vercel Serverless Function: /api/auth
// Simple password verification endpoint
// Password stored as env var PAGE_PASSWORD in Vercel

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  const correct = process.env.PAGE_PASSWORD || 'Tr3@sury!DL-2026x';

  if (password === correct) {
    return res.status(200).json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
}
