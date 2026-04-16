import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PlanContent } from "@/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0a0a0a",
    color: "#fafafa",
    fontFamily: "Helvetica",
    padding: 48,
    fontSize: 11,
  },
  header: {
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 16,
  },
  brand: {
    fontSize: 9,
    color: "#e5a520",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#fafafa",
  },
  subtitle: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#e5a520",
    marginTop: 24,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  scoreLabel: {
    width: 100,
    fontSize: 10,
    color: "#888",
    textTransform: "capitalize",
  },
  scoreBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#222",
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: 4,
    backgroundColor: "#e5a520",
    borderRadius: 2,
  },
  scoreValue: {
    width: 28,
    fontSize: 10,
    color: "#fafafa",
    textAlign: "right",
  },
  actionCard: {
    backgroundColor: "#111",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  actionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#fafafa",
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 10,
    color: "#888",
    marginBottom: 6,
    lineHeight: 1.5,
  },
  actionMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaText: {
    fontSize: 9,
    color: "#e5a520",
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bulletDot: {
    width: 12,
    fontSize: 10,
    color: "#e5a520",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#888",
    lineHeight: 1.5,
  },
  skipCard: {
    backgroundColor: "#1a0a0a",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#3a1a1a",
  },
  skipAction: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#f87171",
    marginBottom: 3,
  },
  skipReason: {
    fontSize: 10,
    color: "#888",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: "#555",
  },
});

interface Props {
  appName: string;
  plan: PlanContent;
}

export function PlanDocument({ appName, plan }: Props) {
  const score = plan.health_score.score;
  const breakdown = plan.health_score.breakdown;

  return (
    <Document>
      {/* Page 1: Header + Health Score + This Week's Top 3 + What to Skip */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>MarketMyApp</Text>
          <Text style={styles.appName}>{appName} — Marketing Plan</Text>
          <Text style={styles.subtitle}>
            Marketing Health Score: {score}/100
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Marketing Health Score</Text>
        {Object.entries(breakdown).map(([dim, val]) => (
          <View key={dim} style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{dim}</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${val}%` }]} />
            </View>
            <Text style={styles.scoreValue}>{val}</Text>
          </View>
        ))}
        <Text style={{ fontSize: 9, color: "#888", marginTop: 6 }}>
          {plan.health_score.encouragement}
        </Text>

        <Text style={styles.sectionTitle}>{"This Week's Top 3"}</Text>
        {plan.this_weeks_top_3.map((action, i) => (
          <View key={i} style={styles.actionCard}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDesc}>{action.description}</Text>
            <View style={styles.actionMeta}>
              <Text style={styles.metaText}>{action.time_estimate}</Text>
              <Text style={[styles.metaText, { color: "#888" }]}>
                {action.priority}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>What to Skip</Text>
        {plan.what_to_skip.map((s, i) => (
          <View key={i} style={styles.skipCard}>
            <Text style={styles.skipAction}>X {s.action}</Text>
            <Text style={styles.skipReason}>{s.reason}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2: Positioning + Channel Strategy + 30-Day Sprint */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Positioning &amp; Messaging</Text>
        <View style={styles.actionCard}>
          <Text style={[styles.actionTitle, { marginBottom: 2 }]}>Tagline</Text>
          <Text style={styles.actionDesc}>{plan.positioning.tagline}</Text>
          <Text style={[styles.actionTitle, { marginBottom: 2 }]}>Value Proposition</Text>
          <Text style={styles.actionDesc}>{plan.positioning.value_prop}</Text>
          <Text style={[styles.actionTitle, { marginBottom: 2 }]}>Elevator Pitch</Text>
          <Text style={styles.actionDesc}>{plan.positioning.elevator_pitch}</Text>
        </View>

        <Text style={styles.sectionTitle}>Channel Strategy</Text>
        {plan.channel_strategy.map((c, i) => (
          <View key={i} style={styles.actionCard}>
            <Text style={styles.actionTitle}>
              #{c.roi_rank} {c.channel}
            </Text>
            <Text style={styles.actionDesc}>{c.why}</Text>
            <Text style={[styles.metaText, { color: "#e5a520" }]}>
              First action: {c.first_action}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>30-Day Sprint</Text>
        {plan.sprint_30_day.map((week) => (
          <View key={week.week}>
            <Text style={{ fontSize: 10, color: "#e5a520", marginBottom: 6, marginTop: 8 }}>
              Week {week.week}
            </Text>
            {week.tasks.map((task, i) => (
              <View key={i} style={styles.actionCard}>
                <Text style={styles.actionTitle}>{task.title}</Text>
                <Text style={styles.actionDesc}>{task.description}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 2</Text>
        </View>
      </Page>

      {/* Page 3: Content Ideas + Metrics + Tools */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Content Ideas</Text>
        {plan.content_ideas.map((idea, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              {idea.title} ({idea.format} · {idea.channel})
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Metrics to Track</Text>
        {plan.metrics_to_track.map((m, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>-&gt;</Text>
            <Text style={styles.bulletText}>
              {m.metric}: {m.target}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Tools &amp; Budget</Text>
        {plan.tools_and_budget.map((t, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              {t.tool} ({t.cost}) — {t.purpose}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 3</Text>
        </View>
      </Page>
    </Document>
  );
}
