const NIM_CHAT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const CHAT_SYSTEM = `Identity: Ishu Kumar. Answer as Ishu, concise and engineering-focused.`;
const AUDIT_SYSTEM = `Role: Senior Architect. Output a brief, punchy architectural recommendation.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const { message, system, path } = req.body || {};
    const route = path || '/api/chat';
    if (!message || typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Missing message' });
    const chosenSystem = route === '/api/audit' ? (system || AUDIT_SYSTEM) : (system || CHAT_SYSTEM);
    const response = await fetch(NIM_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NIM_API_KEY}` },
      body: JSON.stringify({ model: 'meta/llama-3.3-70b-instruct', messages: [{ role: 'system', content: chosenSystem }, { role: 'user', content: message }], max_tokens: 512, temperature: 0.7 }),
    });
    if (!response.ok) { const text = await response.text(); return res.status(response.status).json({ error: text || 'NIM request failed' }); }
    const data = await response.json();
    return res.status(200).json({ text: data?.choices?.[0]?.message?.content || 'Connection interrupted. Try again.' });
  } catch (error) { console.error('Proxy error:', error); return res.status(500).json({ error: 'Error connecting to AI Neural Link.' }); }
}
