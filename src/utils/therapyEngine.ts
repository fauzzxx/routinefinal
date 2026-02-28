/**
 * Rule-based therapy recommendation engine. No AI API.
 * Uses analytics result + RewardContext data to produce recommendations and risk level.
 */
import type { AnalyticsResult } from "./analyticsEngine";

export interface TherapyRecommendationResult {
  recommendations: string[];
  riskLevel: "Low" | "Moderate" | "High";
}

const COMPLETION_RATE_THRESHOLD = 60;
const TASK_FAILURE_RATE_THRESHOLD = 40;
const STREAK_BREAK_INDICATOR_DAYS = 2;

/**
 * Analyze analytics and optional streak-break signal to produce recommendations.
 * Pure logic; no backend.
 */
export function computeTherapyRecommendations(
  analytics: AnalyticsResult,
  options?: { streakFrequentlyBreaks?: boolean; routineTaskCount?: number }
): TherapyRecommendationResult {
  const recommendations: string[] = [];
  let riskScore = 0;

  if (analytics.totalTasksAttempted > 0 && analytics.completionPercentage < COMPLETION_RATE_THRESHOLD) {
    recommendations.push("Consider easier or fewer tasks per session to build confidence.");
    riskScore += 2;
  }

  if (analytics.mostFailedTask && analytics.totalTasksAttempted > 0) {
    const failureRate =
      (analytics.mostFailedTask.failureCount / analytics.totalTasksAttempted) * 100;
    if (failureRate > TASK_FAILURE_RATE_THRESHOLD) {
      recommendations.push(
        `Break "${analytics.mostFailedTask.taskName}" into smaller steps (e.g. 2–3 sub-steps).`
      );
      riskScore += 2;
    }
  }

  if (options?.streakFrequentlyBreaks ?? (analytics.currentStreak < STREAK_BREAK_INDICATOR_DAYS && analytics.hasData)) {
    recommendations.push("Try shorter routines (e.g. 4 tasks) to make streaks easier to maintain.");
    riskScore += 1;
  }

  if (analytics.sevenDayTrend === "Needs Attention") {
    recommendations.push("Increase positive reinforcement (praise, rewards) after each task.");
    riskScore += 2;
  }

  if (options?.routineTaskCount != null && options.routineTaskCount > 5) {
    recommendations.push("Reduce routine length to 4–5 tasks for better focus.");
    riskScore += 1;
  }

  if (recommendations.length === 0) {
    recommendations.push("Keep current routine; progress looks good.");
  }

  let riskLevel: "Low" | "Moderate" | "High" = "Low";
  if (riskScore >= 4) riskLevel = "High";
  else if (riskScore >= 2) riskLevel = "Moderate";

  return { recommendations, riskLevel };
}

/**
 * Generate a short weekly report paragraph from analytics and therapy result.
 */
export function generateWeeklyReportParagraph(
  analytics: AnalyticsResult,
  therapy: TherapyRecommendationResult,
  dateRange: { start: string; end: string }
): string {
  const parts: string[] = [];
  parts.push(
    `Weekly Behavioral Report (${dateRange.start} to ${dateRange.end}). `
  );
  parts.push(
    `Total tasks completed: ${analytics.totalTasksCompleted}; attempted: ${analytics.totalTasksAttempted}. `
  );
  parts.push(`Completion rate: ${analytics.completionPercentage}%. `);
  if (analytics.mostFailedTask) {
    parts.push(
      `Most difficult task: ${analytics.mostFailedTask.taskName} (${analytics.mostFailedTask.failureCount} failures). `
    );
  }
  parts.push(`7-day trend: ${analytics.sevenDayTrend}. `);
  parts.push(`Current streak: ${analytics.currentStreak} days. `);
  parts.push(
    `Recommendations: ${therapy.recommendations.join(" ")} Risk level: ${therapy.riskLevel}.`
  );
  return parts.join("");
}
