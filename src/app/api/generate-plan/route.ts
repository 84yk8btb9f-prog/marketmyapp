import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { buildPlanPrompt } from "@/lib/prompts/plan-generation";
import type { PlanContent } from "@/types";

const PlanInputSchema = z.object({
  app_name: z.string().min(1, "App name is required"),
  app_description: z.string().min(1, "App description is required"),
  app_url: z.string(),
  app_category: z.string().min(1, "App category is required"),
  target_customer: z.string().min(1, "Target customer is required"),
  pain_point: z.string().min(1, "Pain point is required"),
  alternatives: z.string(),
  where_they_hang_out: z.string(),
  stage: z.enum(["idea", "building", "launched", "growing"]),
  current_users: z.string(),
  current_revenue: z.string(),
  monthly_budget: z.string(),
  time_available: z.string(),
  founder_strengths: z.array(z.string()),
  primary_goal: z.string().min(1, "Primary goal is required"),
  timeline: z.string(),
  preferred_channels: z.array(z.string()),
});

const encoder = new TextEncoder();

function sseEvent(event: string, data: string): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${data}\n\n`);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PlanInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;
  const prompt = buildPlanPrompt(input);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        let accumulatedText = "";

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            accumulatedText += event.delta.text;
            controller.enqueue(
              sseEvent("chunk", JSON.stringify({ text: event.delta.text }))
            );
          }
        }

        let plan: PlanContent;
        try {
          plan = JSON.parse(accumulatedText) as PlanContent;
        } catch {
          controller.enqueue(
            sseEvent(
              "error",
              JSON.stringify({
                error: "Failed to parse plan JSON",
                raw: accumulatedText,
              })
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(
          sseEvent("complete", JSON.stringify({ plan }))
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Claude API error";
        controller.enqueue(
          sseEvent("error", JSON.stringify({ error: message }))
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
