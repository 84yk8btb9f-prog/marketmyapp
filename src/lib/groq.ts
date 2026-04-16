const GROQ_BASE = "https://api.groq.com/openai/v1";

// Priority: best reasoning → versatile → fallback
const GROQ_MODELS = [
  "moonshotai/kimi-k2-instruct",
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
];

export async function groqComplete(
  prompt: string,
  maxTokens = 8192
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(`${GROQ_BASE}/chat/completions`, {
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

      if (!res.ok) {
        const errText = await res.text().catch(() => res.status.toString());
        console.warn(`[groq] ${model} → ${res.status}: ${errText}`);
        continue;
      }

      const data = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      return data.choices[0].message.content;
    } catch (err) {
      console.warn(`[groq] ${model} threw:`, err);
      continue;
    }
  }

  throw new Error("All Groq models failed");
}
