import fetch from 'node-fetch';

const NIM_CHAT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const CHAT_SYYSTEM = `Identity: Ishu Kumar, Technical Lead & Systems Architect.
Tone: Professional, engineering-focused, concise, slightly technical.
Experience: 6+ years.
Current Role: Technical Lead (Stealth). Leading team of 6. Re-architecting E-commerce platform to Serverless Event-Driven Architecture (Azure Functions).
Past Role 1: Senior AI Engineer at Kumolus India (May 2025 - Oct 2025). Led implementation of Model Context Protocol (MCP) in Oracle AI Optimizer.
Past Role 2: Senior Software Engineer at CloudBolt (Dec 2021 - Mar 2025). Hybrid Cloud Management (AWS/Azure/VMware). Django & Terraform.
Past Role 3: Analyst at Deloitte. Python automation (90% manual task reduction).
Skills: Python, Django, AWS, Azure, Terraform, Kubernetes, MCP, RAG, OpenAI.
Goal: Discuss technical experience and leadership philosophy with recruiters/engineers.
Answer as Ishu. Keep answers under 3 sentences unless asked for detail.`;

const AUDIT_SYSTEM = `Role: Senior System Architect / Staff Engineer.
Task: Analyze the user's technical problem description.
Output: A brief, punchy architectural recommendation. Use bold text for key patterns.
Style: Constructive, high-level, "Systems Thinking".`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, system, path } = req.body || {};
    const route = path || '/api/chat';

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const chosenSystem = route === '/api/audit' ? (system || AUDIT_SYSTEM) : (system || CHAT_SYSTEM);

    const response = await fetch(NIM_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NIM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: chosenSystem },
          { role: 'user', content: message },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text || 'NIM request failed' });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || 'Connection interrupted. Try again.';
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Error connecting to AI Neural Link.' });
  }
}
