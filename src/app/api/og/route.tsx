import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawScore = Number(searchParams.get("score") ?? 0);
  const score = Math.min(100, Math.max(0, isNaN(rawScore) ? 0 : rawScore));
  const app = (searchParams.get("app") ?? "My App").slice(0, 40);

  const color =
    score >= 70 ? "#4ade80" : score >= 50 ? "#e5a520" : "#f87171";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          gap: 0,
        }}
      >
        {/* Top label */}
        <div
          style={{
            color: "#e5a520",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 48,
          }}
        >
          MARKETMYAPP
        </div>

        {/* Score */}
        <div
          style={{
            color,
            fontSize: 180,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          {score}
        </div>
        <div
          style={{
            color: "#888",
            fontSize: 28,
            marginBottom: 32,
          }}
        >
          / 100 Marketing Health Score
        </div>

        {/* App name */}
        <div
          style={{
            color: "#fafafa",
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 48,
          }}
        >
          {app}
        </div>

        {/* CTA */}
        <div
          style={{
            color: "#555",
            fontSize: 20,
          }}
        >
          marketmyapp.vercel.app — What&apos;s your score?
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
