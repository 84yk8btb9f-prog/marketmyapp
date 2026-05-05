import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PlanContent } from "@/types";

// ─── palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#ffffff",
  surface: "#f7f7f7",
  surfaceAlt: "#f0f0f0",
  border: "#e2e2e2",
  accent: "#b45309",     // amber-700 — legible on white
  accentLight: "#fef3c7",
  text: "#111111",
  secondary: "#555555",
  muted: "#888888",
  destructive: "#b91c1c",
  destructiveBg: "#fff1f1",
  destructiveBorder: "#fecaca",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: "Helvetica",
    padding: 48,
    fontSize: 10,
  },

  // header
  header: {
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
  },
  brand: {
    fontSize: 8,
    color: C.accent,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  appName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: C.secondary,
  },

  // section title
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    marginTop: 20,
    marginBottom: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  // score
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  scoreLabel: {
    width: 90,
    fontSize: 9,
    color: C.secondary,
    textTransform: "capitalize",
  },
  scoreTrack: {
    flex: 1,
    height: 5,
    backgroundColor: C.surfaceAlt,
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  scoreFill: {
    height: 5,
    backgroundColor: C.accent,
    borderRadius: 3,
  },
  scoreValue: {
    width: 24,
    fontSize: 9,
    color: C.text,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  encouragement: {
    fontSize: 9,
    color: C.secondary,
    marginTop: 6,
    fontStyle: "italic",
  },

  // action card
  actionCard: {
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 10,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: C.border,
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  actionDesc: {
    fontSize: 9,
    color: C.secondary,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  actionMeta: {
    flexDirection: "row",
    gap: 10,
  },
  metaAccent: {
    fontSize: 8,
    color: C.accent,
    fontFamily: "Helvetica-Bold",
  },
  metaMuted: {
    fontSize: 8,
    color: C.muted,
  },

  // priority chip (inline style used per-card)
  priorityBase: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },

  // skip card
  skipCard: {
    backgroundColor: C.destructiveBg,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.destructiveBorder,
  },
  skipAction: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.destructive,
    marginBottom: 3,
  },
  skipReason: {
    fontSize: 9,
    color: C.secondary,
    lineHeight: 1.5,
  },

  // positioning
  posCard: {
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  posLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  posValue: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.5,
  },
  taglineValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    lineHeight: 1.4,
  },

  // channels
  channelCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 10,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "flex-start",
  },
  channelRank: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  channelRankText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
  },
  channelName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 2,
  },
  channelWhy: {
    fontSize: 9,
    color: C.secondary,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  channelAction: {
    fontSize: 9,
    color: C.accent,
    fontFamily: "Helvetica-Bold",
  },

  // bullet list
  bulletRow: {
    flexDirection: "row",
    marginBottom: 5,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: C.accent,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: C.secondary,
    lineHeight: 1.5,
  },

  // content ideas
  ideaCard: {
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 9,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  ideaTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 2,
  },
  ideaDesc: {
    fontSize: 8,
    color: C.secondary,
    lineHeight: 1.4,
  },

  // table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.surfaceAlt,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopColor: C.border,
    borderLeftColor: C.border,
    borderRightColor: C.border,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: C.surface,
  },
  tableCell: { fontSize: 9, color: C.text },
  tableCellMuted: { fontSize: 9, color: C.secondary },
  tableCellAccent: { fontSize: 9, color: C.accent, fontFamily: "Helvetica-Bold" },

  // metrics
  metricCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 2,
  },
  metricWhy: { fontSize: 8, color: C.secondary, lineHeight: 1.4 },
  metricTarget: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.accent },

  // priority cards
  priorityCard: {
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  priorityTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 3 },
  priorityDesc: { fontSize: 9, color: C.secondary, lineHeight: 1.5, marginBottom: 4 },
  impactBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    backgroundColor: C.accentLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.accent,
    alignSelf: "flex-start",
  },

  // sprint week
  weekLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    marginBottom: 5,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: C.muted },
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function PriorityChip({ priority }: { priority: string }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    "MUST DO":   { color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
    "SHOULD DO": { color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
    "CAN WAIT":  { color: C.muted,   bg: C.surfaceAlt, border: C.border },
  };
  const s = map[priority] ?? map["CAN WAIT"];
  return (
    <Text style={{ ...styles.priorityBase, color: s.color, backgroundColor: s.bg, borderColor: s.border }}>
      {priority}
    </Text>
  );
}

// ─── document ────────────────────────────────────────────────────────────────

interface Props {
  appName: string;
  plan: PlanContent;
}

export function PlanDocument({ appName, plan }: Props) {
  const score = plan.health_score.score;

  return (
    <Document>
      {/* ══ PAGE 1: Health Score · Top Priorities · This Week's Top 3 · What to Skip ══ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>MarketMyApp</Text>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={styles.subtitle}>Marketing Plan · Health Score: {score}/100</Text>
        </View>

        <Text style={styles.sectionTitle}>Marketing Health Score</Text>
        {Object.entries(plan.health_score.breakdown).map(([dim, val]) => (
          <View key={dim} style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{dim}</Text>
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { width: `${val}%` }]} />
            </View>
            <Text style={styles.scoreValue}>{val}</Text>
          </View>
        ))}
        <Text style={styles.encouragement}>{plan.health_score.encouragement}</Text>

        <Text style={styles.sectionTitle}>Top Priorities</Text>
        {plan.health_score.top_priorities.map((p) => (
          <View key={p.title} style={styles.priorityCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
              <Text style={styles.priorityTitle}>{p.title}</Text>
              <Text style={styles.impactBadge}>{p.impact}</Text>
            </View>
            <Text style={styles.priorityDesc}>{p.description}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>{"This Week's Top 3"}</Text>
        {plan.this_weeks_top_3.map((action) => (
          <View key={action.title} style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <PriorityChip priority={action.priority} />
            </View>
            <Text style={styles.actionDesc}>{action.description}</Text>
            <View style={styles.actionMeta}>
              <Text style={styles.metaAccent}>{action.time_estimate}</Text>
              <Text style={styles.metaMuted}>Outcome: {action.expected_outcome}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>What to Skip</Text>
        {plan.what_to_skip.map((s) => (
          <View key={s.action} style={styles.skipCard}>
            <Text style={styles.skipAction}>✕  {s.action}</Text>
            <Text style={styles.skipReason}>{s.reason}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 1 of 3</Text>
        </View>
      </Page>

      {/* ══ PAGE 2: Positioning · Channel Strategy · 30-Day Sprint ══ */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { marginBottom: 0, paddingBottom: 12 }]}>
          <Text style={styles.brand}>MarketMyApp</Text>
          <Text style={{ ...styles.appName, fontSize: 16 }}>{appName} — Strategy & Roadmap</Text>
        </View>

        <Text style={styles.sectionTitle}>Positioning & Messaging</Text>
        <View style={styles.posCard}>
          <Text style={styles.posLabel}>Tagline</Text>
          <Text style={styles.taglineValue}>{plan.positioning.tagline}</Text>
        </View>
        <View style={styles.posCard}>
          <Text style={styles.posLabel}>Value Proposition</Text>
          <Text style={styles.posValue}>{plan.positioning.value_prop}</Text>
        </View>
        <View style={styles.posCard}>
          <Text style={styles.posLabel}>Elevator Pitch</Text>
          <Text style={[styles.posValue, { fontStyle: "italic", color: C.secondary }]}>
            {plan.positioning.elevator_pitch}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Channel Strategy</Text>
        {plan.channel_strategy.map((c) => (
          <View key={c.channel} style={styles.channelCard}>
            <View style={styles.channelRank}>
              <Text style={styles.channelRankText}>{c.roi_rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelName}>{c.channel}</Text>
              <Text style={styles.channelWhy}>{c.why}</Text>
              <Text style={styles.channelAction}>First action → {c.first_action}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>30-Day Sprint</Text>
        {plan.sprint_30_day.map((week) => (
          <View key={week.week}>
            <Text style={styles.weekLabel}>Week {week.week}</Text>
            {week.tasks.map((task) => (
              <View key={task.title} style={styles.actionCard}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionTitle}>{task.title}</Text>
                  <PriorityChip priority={task.priority} />
                </View>
                <Text style={styles.actionDesc}>{task.description}</Text>
                <Text style={styles.metaAccent}>{task.time_estimate}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 2 of 3</Text>
        </View>
      </Page>

      {/* ══ PAGE 3: 60/90-Day · Content Ideas · Tools & Budget · Metrics ══ */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { marginBottom: 0, paddingBottom: 12 }]}>
          <Text style={styles.brand}>MarketMyApp</Text>
          <Text style={{ ...styles.appName, fontSize: 16 }}>{appName} — Growth & Resources</Text>
        </View>

        <Text style={styles.sectionTitle}>60-Day Expansion</Text>
        {plan.expansion_60_day.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>90-Day Growth</Text>
        {plan.growth_90_day.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Content Ideas</Text>
        {plan.content_ideas.map((idea) => (
          <View key={idea.title} style={styles.ideaCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ideaTitle}>{idea.title}</Text>
              <Text style={styles.ideaDesc}>{idea.description}</Text>
              <Text style={[styles.ideaDesc, { color: C.accent, marginTop: 2 }]}>
                {idea.format} · {idea.channel}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Tools & Budget</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 100 }]}>Tool</Text>
          <Text style={[styles.tableHeaderCell, { width: 60 }]}>Cost</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Purpose</Text>
        </View>
        {plan.tools_and_budget.map((t, i) => (
          <View
            key={t.tool}
            style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}
          >
            <Text style={[styles.tableCell, { width: 100, fontFamily: "Helvetica-Bold" }]}>
              {t.tool}
            </Text>
            <Text style={[styles.tableCellAccent, { width: 60 }]}>{t.cost}</Text>
            <Text style={[styles.tableCellMuted, { flex: 1 }]}>{t.purpose}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Metrics to Track</Text>
        {plan.metrics_to_track.map((m) => (
          <View key={m.metric} style={styles.metricCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metricName}>{m.metric}</Text>
              <Text style={styles.metricWhy}>{m.why}</Text>
            </View>
            <Text style={styles.metricTarget}>{m.target}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 3 of 3</Text>
        </View>
      </Page>
    </Document>
  );
}
