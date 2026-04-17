import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { groqComplete } from "@/lib/groq";
import { buildHealthScorePrompt } from "@/lib/prompts/health-score";
import { healthScoreLimiter, checkRateLimit, getIP } from "@/lib/ratelimit";
import type { HealthScoreResult } from "@/types";

const QuickAssessmentSchema = z.object({
  app_name: z.string().min(1, "App name is required"),
  app_description: z.string().min(1, "App description is required"),
  target_customer: z.string().min(1, "Target customer is required"),
  stage: z.enum(["idea", "building", "launched", "growing"]),
  current_traction: z.string().min(1, "Traction is required"),
  channels_tried: z.array(z.string()),
  biggest_struggle: z.string().min(1, "Biggest struggle is required"),
});

export async function POST(request: Request) {
  // Rate limit by IP — unauthenticated endpoint that calls AI APIs
  const rateLimitResponse = await checkRateLimit(healthScoreLimiter, `health-score:${getIP(request)}`);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = QuickAssessmentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;
  const prompt = buildHealthScorePrompt(input);

  let rawText: string;

  try {
    rawText = await groqComplete(prompt, 1024);
  } catch (groqErr) {
    console.warn("[health-score] Groq failed, falling back to Claude:", groqErr);
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      const block = message.content[0];
      if (block.type !== "text") throw new Error("Unexpected content type");
      rawText = block.text;
    } catch (claudeErr) {
      const msg = claudeErr instanceof Error ? claudeErr.message : "AI generation failed";
      return Response.json({ error: msg }, { status: 502 });
    }
  }

  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let result: HealthScoreResult;

  try {
    result = JSON.parse(cleanedText) as HealthScoreResult;
  } catch {
    console.error("[health-score] Failed to parse AI response as JSON:", cleanedText.slice(0, 200));
    return Response.json(
      { error: "Failed to generate health score. Please try again." },
      { status: 502 }
    );
  }

  return Response.json(result, { status: 200 });
}
