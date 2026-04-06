export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan_tier: "free" | "trial" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  plans_generated: number;
  health_score: number | null;
  current_streak: number;
  longest_streak: number;
  created_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  app_name: string;
  input_data: PlanInput;
  plan_content: PlanContent;
  plan_markdown: string | null;
  health_score: number | null;
  pdf_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyAction {
  id: string;
  plan_id: string;
  user_id: string;
  week_number: number;
  actions: ActionItem[];
  committed_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ActionItem {
  title: string;
  description: string;
  time_estimate: string;
  priority: "MUST DO" | "SHOULD DO" | "CAN WAIT";
  status: "pending" | "done" | "skipped" | "in_progress";
  why_now: string;
  expected_outcome: string;
}

// Input form types
export interface PlanInput {
  // Step 1: Your App
  app_name: string;
  app_description: string;
  app_url: string;
  app_category: string;

  // Step 2: Your Audience
  target_customer: string;
  pain_point: string;
  alternatives: string;
  where_they_hang_out: string;

  // Step 3: Your Situation
  stage: "idea" | "building" | "launched" | "growing";
  current_users: string;
  current_revenue: string;
  monthly_budget: string;
  time_available: string;
  founder_strengths: string[];

  // Step 4: Your Goals
  primary_goal: string;
  timeline: string;
  preferred_channels: string[];
}

// Quick assessment (3 questions for instant win)
export interface QuickAssessment {
  app_name: string;
  stage: "idea" | "building" | "launched" | "growing";
  biggest_struggle: string;
}

// AI output types
export interface HealthScoreResult {
  score: number;
  breakdown: {
    positioning: number;
    audience: number;
    channels: number;
    content: number;
    metrics: number;
  };
  top_priorities: {
    title: string;
    description: string;
    impact: string;
  }[];
  encouragement: string;
}

export interface PlanContent {
  health_score: HealthScoreResult;
  this_weeks_top_3: ActionItem[];
  what_to_skip: { action: string; reason: string }[];
  positioning: {
    tagline: string;
    value_prop: string;
    elevator_pitch: string;
  };
  channel_strategy: {
    channel: string;
    roi_rank: number;
    why: string;
    first_action: string;
  }[];
  sprint_30_day: { week: number; tasks: ActionItem[] }[];
  expansion_60_day: string[];
  growth_90_day: string[];
  content_ideas: {
    title: string;
    format: string;
    channel: string;
    description: string;
  }[];
  launch_checklist: string[] | null;
  tools_and_budget: { tool: string; cost: string; purpose: string }[];
  metrics_to_track: { metric: string; target: string; why: string }[];
}
