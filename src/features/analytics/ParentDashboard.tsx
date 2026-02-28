import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRewards } from "@/contexts/RewardContext";
import { computeAnalytics } from "@/utils/analyticsEngine";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Clock, CheckCircle2, Zap, Target } from "lucide-react";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { streak } = useRewards();

  const analytics = useMemo(() => computeAnalytics(streak), [streak]);

  if (!analytics.hasData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white font-inter pb-20">
          <Navigation />
          <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-fredoka text-slate-900">Parent Analytics</h1>
                <p className="text-slate-500 text-sm">Performance insights from routine practice</p>
              </div>
            </div>
            <Card className="rounded-2xl border shadow-sm bg-white max-w-xl">
              <CardContent className="p-8 text-center">
                <p className="text-slate-600 font-medium">
                  No performance data yet. Start practicing routines to see insights.
                </p>
                <Button
                  variant="default"
                  className="mt-6 rounded-xl min-h-[40px]"
                  onClick={() => navigate("/child")}
                >
                  Go to Child Mode
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white font-inter pb-20">
        <Navigation />

        <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-fredoka text-slate-900">Parent Analytics</h1>
              <p className="text-slate-500 text-sm">Performance insights from routine practice</p>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <CheckCircle2 className="text-primary w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500 font-medium">Total Completed</p>
                <p className="text-2xl font-fredoka text-slate-900">{analytics.totalTasksCompleted}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                  <Target className="text-indigo-600 w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500 font-medium">Completion %</p>
                <p className="text-2xl font-fredoka text-slate-900">{analytics.completionPercentage}%</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Zap className="text-orange-600 w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500 font-medium">Current Streak</p>
                <p className="text-2xl font-fredoka text-slate-900">{analytics.currentStreak} days</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                  <Clock className="text-slate-600 w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500 font-medium">Avg Time</p>
                <p className="text-2xl font-fredoka text-slate-900">
                  {analytics.averageTimePerTaskSeconds > 0
                    ? `${analytics.averageTimePerTaskSeconds}s`
                    : "—"}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="mb-8">
            <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
              <CardContent className="p-5">
                <h2 className="text-lg font-fredoka text-slate-900 mb-2">Trend Insight</h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block w-3 h-3 rounded-full shrink-0 ${
                      analytics.sevenDayTrend === "Improving"
                        ? "bg-green-500"
                        : analytics.sevenDayTrend === "Needs Attention"
                          ? "bg-red-500"
                          : "bg-slate-300"
                    }`}
                  />
                  <p className="text-slate-700 font-medium">
                    {analytics.sevenDayTrend === "Insufficient Data"
                      ? "Insufficient data for trend"
                      : analytics.sevenDayTrend}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="font-fredoka text-lg text-slate-900">7-Day Completion</CardTitle>
                <CardDescription>Completion count per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.completionCountByDay}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#0EA5E9"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#0EA5E9" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="font-fredoka text-lg text-slate-900">Failures by Task</CardTitle>
                <CardDescription>Tasks that need more support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full min-h-0">
                  {analytics.failureCountByTask.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                      No failure data recorded
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.failureCountByTask}
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="taskName"
                          width={80}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {analytics.failureCountByTask.map((entry, index) => (
                            <Cell
                              key={entry.taskName}
                              fill={
                                analytics.mostFailedTask &&
                                entry.taskName === analytics.mostFailedTask.taskName
                                  ? "#ef4444"
                                  : "#e2e8f0"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
