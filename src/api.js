export function parseJ(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(clean); } catch (_) {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Could not parse JSON response.');
  }
}

export async function detectProduct(groqKey, imageBase64, imageMime) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${imageMime};base64,${imageBase64}` } },
        { type: 'text', text: `Analyze this product image.\nReturn ONLY JSON (no markdown):\n{"product":"full name","brand":"brand","category":"category"}` }
      ]}],
      max_tokens: 300, temperature: 0.1
    })
  });
  if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(`Vision: ${e.error?.message || resp.statusText}`); }
  const data = await resp.json();
  return parseJ(data.choices?.[0]?.message?.content || '{}');
}

export async function tavilySearch(apiKey, query, includeImages = false) {
  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: 'basic', max_results: 4, include_answer: true, include_images: includeImages })
  });
  if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(`Tavily: ${e.message || resp.statusText}`); }
  const data = await resp.json();
  if (includeImages) return data;
  const snippets = (data.results || []).map(r => `• ${r.title}: ${(r.content || '').slice(0, 280)}`).join('\n');
  return (data.answer ? `Summary: ${data.answer}\n` : '') + snippets;
}

export async function fetchEnvData(tavilyKey, pd) {
  const p = `${pd.brand || ''} ${pd.product || ''}`.trim();
  const qs = [
    `${p} environmental impact sustainability`,
    `${p} harmful chemicals ingredients`,
    `best eco friendly alternatives to ${p}`
  ];
  const results = await Promise.all(qs.map(q => tavilySearch(tavilyKey, q)));
  return results.map((r, i) => `[Query: ${qs[i]}]\n${r}`).join('\n\n---\n\n');
}

export async function analyzeProduct(groqKey, pd, searchResults) {
  const prompt = `You are a sustainability expert.

Product: ${pd.product} by ${pd.brand} (${pd.category})

Web Research:
${searchResults.slice(0, 4000)}

Return ONLY a JSON object (no markdown, no text outside JSON):
{
  "eco_score": <integer 1-10>,
  "score_rationale": "<one sentence>",
  "issues": ["issue1","issue2","issue3"],
  "certifications": [],
  "alternatives": [
    {"name":"Exact product name as listed on Amazon India","brand":"Brand","reason":"why greener"},
    {"name":"Exact product name as listed on Amazon India","brand":"Brand","reason":"why greener"},
    {"name":"Exact product name as listed on Amazon India","brand":"Brand","reason":"why greener"}
  ]
}`;
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 1000, temperature: 0.3 })
  });
  if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(`Analysis: ${e.error?.message || resp.statusText}`); }
  const data = await resp.json();
  return parseJ(data.choices?.[0]?.message?.content || '{}');
}

export function buildBuyLinks(name) {
  const q = encodeURIComponent(name);
  return [
    { cls: 'amazon',    icon: 'https://www.google.com/s2/favicons?sz=16&domain=amazon.in',    label: 'Amazon',    url: `https://www.amazon.in/s?k=${q}` },
    { cls: 'flipkart',  icon: 'https://www.google.com/s2/favicons?sz=16&domain=flipkart.com', label: 'Flipkart',  url: `https://www.flipkart.com/search?q=${q}` },
    { cls: 'bigbasket', icon: 'https://www.google.com/s2/favicons?sz=16&domain=bigbasket.com',label: 'BigBasket', url: `https://www.bigbasket.com/ps/?q=${q}` },
    { cls: 'google',    icon: 'https://www.google.com/s2/favicons?sz=16&domain=google.com',   label: 'Search',    url: `https://www.google.com/search?q=${q}+buy+online+eco+friendly` }
  ];
}

export function looksLikeImage(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(url) ||
    /\/(image|img|photo|product|media)\//i.test(url) ||
    url.includes('images-amazon') || url.includes('cdn') || url.includes('static');
}
