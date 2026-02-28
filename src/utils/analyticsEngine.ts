/**
 * Analytics engine: reads only from existing localStorage and RewardContext data.
 * Computes parent dashboard metrics. No new storage formats; graceful empty state.
 */
import { storage } from "@/utils/storage";

const DEMO_PRACTICE_KEY = "rb_demo_practice_results";
const DEMO_TEST_KEY = "rb_demo_test_results";

export interface AnalyticsResult {
  totalTasksCompleted: number;
  totalTasksAttempted: number;
  completionPercentage: number;
  currentStreak: number;
  averageTimePerTaskSeconds: number;
  mostFailedTask: { taskName: string; failureCount: number } | null;
  sevenDayTrend: "Improving" | "Needs Attention" | "Insufficient Data";
  completionCountByDay: { date: string; count: number }[];
  failureCountByTask: { taskName: string; count: number }[];
  hasData: boolean;
}

interface CompletionLogEntry {
  taskName?: string;
  taskId?: string;
  completedAt?: string;
  createdAt?: string;
  durationSec?: number;
  date?: string;
}

interface FailureLogEntry {
  taskName?: string;
  taskId?: string;
  failedAt?: string;
  createdAt?: string;
}

function getLast7Days(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    return storage.get(key, defaultValue);
  } catch {
    return defaultValue;
  }
}

function safeGetRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Compute all analytics from existing localStorage only.
 * Never throws; returns zeros/empty when data is missing.
 */
export function computeAnalytics(streakFromContext: number): AnalyticsResult {
  const completionLogs = safeGet<CompletionLogEntry[]>("completionLogs", []);
  const failureLogs = safeGet<FailureLogEntry[]>("failureLogs", []);
  const currentStreak = streakFromContext ?? safeGet<number>("streak", 0);

  const demoPractice = safeGetRaw(DEMO_PRACTICE_KEY) as Array<{ created_at?: string; engagement_score?: number }> | null;
  const demoTest = safeGetRaw(DEMO_TEST_KEY) as Array<{ activity_type?: string; created_at?: string; performance_tier?: string }> | null;

  const completedEntries: { date: string; durationSec: number; taskName: string }[] = [];
  const attemptedSet = new Set<string>();

  if (Array.isArray(completionLogs)) {
    completionLogs.forEach((entry) => {
      const date = entry.completedAt ?? entry.createdAt ?? entry.date ?? new Date().toISOString().split("T")[0];
      const day = date.split("T")[0];
      const taskName = entry.taskName ?? entry.taskId ?? "Task";
      completedEntries.push({
        date: day,
        durationSec: typeof entry.durationSec === "number" ? entry.durationSec : 0,
        taskName,
      });
      attemptedSet.add(`${day}-${taskName}`);
    });
  }

  if (Array.isArray(demoPractice)) {
    demoPractice.forEach((r) => {
      const date = r.created_at ? r.created_at.split("T")[0] : new Date().toISOString().split("T")[0];
      completedEntries.push({ date, durationSec: 0, taskName: "Practice" });
      attemptedSet.add(`${date}-Practice`);
    });
  }

  if (Array.isArray(demoTest)) {
    demoTest.forEach((r) => {
      const date = r.created_at ? r.created_at.split("T")[0] : new Date().toISOString().split("T")[0];
      const taskName = r.activity_type ?? "Activity";
      completedEntries.push({ date, durationSec: 0, taskName });
      attemptedSet.add(`${date}-${taskName}`);
    });
  }

  const failureEntries: { taskName: string }[] = [];
  if (Array.isArray(failureLogs)) {
    failureLogs.forEach((entry) => {
      failureEntries.push({ taskName: entry.taskName ?? entry.taskId ?? "Unknown" });
    });
  }

  const totalTasksCompleted = completedEntries.length;
  const totalTasksAttempted = totalTasksCompleted + failureEntries.length;
  const completionPercentage =
    totalTasksAttempted > 0 ? Math.round((totalTasksCompleted / totalTasksAttempted) * 100) : 0;

  const totalDurationSec = completedEntries.reduce((s, e) => s + e.durationSec, 0);
  const averageTimePerTaskSeconds =
    totalTasksCompleted > 0 ? Math.round(totalDurationSec / totalTasksCompleted) : 0;

  const failureCountByTaskMap = new Map<string, number>();
  failureEntries.forEach(({ taskName }) => {
    failureCountByTaskMap.set(taskName, (failureCountByTaskMap.get(taskName) ?? 0) + 1);
  });
  const failureCountByTask = Array.from(failureCountByTaskMap.entries()).map(([taskName, count]) => ({
    taskName,
    count,
  }));
  const mostFailedTaskEntry =
    failureCountByTask.length > 0
      ? failureCountByTask.reduce((a, b) => (a.count >= b.count ? a : b))
      : null;
  const mostFailedTask = mostFailedTaskEntry
    ? { taskName: mostFailedTaskEntry.taskName, failureCount: mostFailedTaskEntry.count }
    : null;

  const last7 = getLast7Days();
  const countByDay = new Map<string, number>();
  last7.forEach((d) => countByDay.set(d, 0));
  completedEntries.forEach(({ date }) => {
    if (countByDay.has(date)) countByDay.set(date, (countByDay.get(date) ?? 0) + 1);
  });
  const completionCountByDay = last7.map((date) => ({
    date: date.slice(5),
    count: countByDay.get(date) ?? 0,
  }));

  const counts = completionCountByDay.map((d) => d.count);
  const first3Avg = counts.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last3Avg = counts.slice(-3).reduce((a, b) => a + b, 0) / 3;
  let sevenDayTrend: "Improving" | "Needs Attention" | "Insufficient Data" = "Insufficient Data";
  if (counts.some((c) => c > 0)) {
    sevenDayTrend = last3Avg >= first3Avg ? "Improving" : "Needs Attention";
  }

  const hasData = totalTasksCompleted > 0 || totalTasksAttempted > 0 || currentStreak > 0;

  return {
    totalTasksCompleted,
    totalTasksAttempted,
    completionPercentage,
    currentStreak,
    averageTimePerTaskSeconds,
    mostFailedTask,
    sevenDayTrend,
    completionCountByDay,
    failureCountByTask,
    hasData,
  };
}
