export async function aiSuggest(env, prompt) {
  if (env.ENABLE_AI_SEARCH !== 'true') return null

  const body = {
    contents: [{ parts: [{ text: prompt.slice(0, Number(env.MAX_AI_CONTEXT || 15000)) }] }]
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  )

  if (!res.ok) return null
  const json = await res.json()
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || null
}
