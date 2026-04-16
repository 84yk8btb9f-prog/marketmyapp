const GROQ_BASE = "https://api.groq.com/openai/v1";

// Priority: best reasoning → versatile → fallback
const GROQ_MODELS = [
  "moonshotai/kimi-k2-instruct",
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
];

export async function groqComplete(
  prompt: string,
  maxTokens = 8192
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  for (const model of GROQ_MODELS) {
    // --- fetch (only catch network errors here) ---
    let res: Response;
    try {
      res = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (err) {
      console.warn(`[groq] ${model} network error:`, err);
      continue;
    }

    // --- status check (outside try — fatal errors propagate up) ---
    if (!res.ok) {
      const errText = await res.text().catch(() => res.status.toString());
      if (res.status === 401) {
        throw new Error(`[groq] Fatal auth failure: ${errText}`);
      }
      console.warn(`[groq] ${model} → ${res.status}: ${errText}`);
      continue;
    }

    // --- parse response ---
    try {
      const data = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error(`[groq] ${model} returned empty choices`);
      return content;
    } catch (err) {
      console.warn(`[groq] ${model} parse error:`, err);
      continue;
    }
  }

  throw new Error("All Groq models failed");
}
