import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { buildHealthScorePrompt } from "@/lib/prompts/health-score";
import type { HealthScoreResult } from "@/types";

const QuickAssessmentSchema = z.object({
  app_name: z.string().min(1, "App name is required"),
  stage: z.enum(["idea", "building", "launched", "growing"]),
  biggest_struggle: z.string().min(1, "Biggest struggle is required"),
});

export async function POST(request: Request) {
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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response content type from Claude");
    }
    rawText = block.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claude API error";
    return Response.json({ error: message }, { status: 502 });
  }

  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let result: HealthScoreResult;

  try {
    result = JSON.parse(cleanedText) as HealthScoreResult;
  } catch {
    return Response.json(
      { error: "Failed to parse Claude response as JSON", raw: cleanedText },
      { status: 502 }
    );
  }

  return Response.json(result, { status: 200 });
}
